"""Contract tests that patch at the Gemini SDK boundary rather than at the
evaluator/runner seams, so signature, model-name, and parsing defects in the
judge and pipeline paths surface without spending provider quota.
"""
import hashlib
import json
from types import SimpleNamespace
from unittest.mock import patch

import pytest

import services.llm_provider as llm_provider
from eval.answer.exceptions import InfrastructureError
from eval.answer.models import (
    ChatAnswerStatus, ExpectedFact, MatchType, PipelineOutput, RunConfig, SemanticFactJudgment,
)
from eval.answer.resumable_runner import C3Runner
from eval.answer.semantic_evaluator import evaluate_semantic_fact
from eval.citation.evaluator import evaluate_citation_correctness
from eval.citation.models import CitationCorrectnessJudgment
from eval.groundedness.evaluator import evaluate_claim_groundedness
from eval.groundedness.models import GroundednessJudgment
from eval.judge import JUDGE_MODEL
from services.ai_service import ConversationAnswer, RawCitationEvaluation, RawGroundedClaim


class FakeModels:
    def __init__(self, responses):
        self._responses = list(responses)
        self.calls = []

    def generate_content(self, *, model, contents, config):
        self.calls.append({"model": model, "contents": contents, "config": config})
        response = self._responses.pop(0) if len(self._responses) > 1 else self._responses[0]
        if isinstance(response, Exception):
            raise response
        return SimpleNamespace(text=response)


class FakeClient:
    def __init__(self, models: FakeModels):
        self.models = models


@pytest.fixture
def fake_sdk():
    """Install a fake Gemini client; call with the response texts to return."""
    installed = {}

    def install(*responses):
        models = FakeModels(responses)
        installed["models"] = models
        return models

    with patch.object(llm_provider, "_get_api_key", return_value="test-key"), \
         patch.object(llm_provider, "_get_client", side_effect=lambda api_key=None: FakeClient(installed["models"])), \
         patch.object(llm_provider.time, "sleep"):
        yield install


def _judgment_json(judgment: str) -> str:
    return json.dumps({"judgment": judgment, "reasoning": "contract test"})


# ---------------------------------------------------------------------------
# Judges: real evaluator -> judge_structured -> _generate_structured -> SDK
# ---------------------------------------------------------------------------

def test_semantic_judge_parses_response_on_judge_model(fake_sdk):
    models = fake_sdk(_judgment_json("PRESENT"))
    fact = ExpectedFact(id="f1", canonical="Mitochondria produce ATP.", match_type=MatchType.SEMANTIC)

    result = evaluate_semantic_fact(fact, "The mitochondria generate ATP [1].")

    assert result.passed is True
    assert result.judgment == SemanticFactJudgment.PRESENT
    assert result.reason == "contract test"
    assert [c["model"] for c in models.calls] == [JUDGE_MODEL]


def test_groundedness_judge_parses_response_on_judge_model(fake_sdk):
    models = fake_sdk(_judgment_json("CONTRADICTED"))

    result = evaluate_claim_groundedness("case_1", "claim_01", "Claim text.", "Context text.")

    assert result.judgment == GroundednessJudgment.CONTRADICTED
    assert result.infrastructure_failed is False
    assert [c["model"] for c in models.calls] == [JUDGE_MODEL]


def test_citation_judge_parses_response_on_judge_model(fake_sdk):
    models = fake_sdk(_judgment_json("PARTIAL"))

    result = evaluate_citation_correctness(
        case_id="case_1", claim_id="claim_01", evidence_id="e_01",
        claim_text="Claim text.", cited_chunk_text="Chunk text.",
    )

    assert result.judgment == CitationCorrectnessJudgment.PARTIAL
    assert result.evidence_id == "e_01"
    assert [c["model"] for c in models.calls] == [JUDGE_MODEL]


def test_malformed_judge_output_raises_infrastructure_error(fake_sdk):
    fake_sdk('{"judgment": "MAYBE", "reasoning": "not a valid enum"}')
    fact = ExpectedFact(id="f1", canonical="Fact.", match_type=MatchType.SEMANTIC)

    with pytest.raises(InfrastructureError):
        evaluate_semantic_fact(fact, "Answer.")


def test_empty_judge_output_raises_infrastructure_error(fake_sdk):
    fake_sdk("")

    with pytest.raises(InfrastructureError):
        evaluate_claim_groundedness("case_1", "claim_01", "Claim.", "Context.")


def test_provider_exhaustion_raises_infrastructure_error(fake_sdk):
    fake_sdk(RuntimeError("quota exhausted"))

    with pytest.raises(InfrastructureError):
        evaluate_citation_correctness(
            case_id="case_1", claim_id="claim_01", evidence_id="e_01",
            claim_text="Claim.", cited_chunk_text="Chunk.",
        )


# ---------------------------------------------------------------------------
# Provider: model_override pins one model and disables fallback
# ---------------------------------------------------------------------------

def test_model_override_pins_single_model_without_fallback(fake_sdk, monkeypatch):
    monkeypatch.setattr(llm_provider.settings, "gemini_fallback_models", "fallback-model")
    models = fake_sdk(RuntimeError("non-retryable"))

    with pytest.raises(llm_provider.AIServiceError):
        llm_provider._generate_structured(
            prompt="p", response_schema=ConversationAnswer, model_override="override-model",
        )

    assert {c["model"] for c in models.calls} == {"override-model"}


def test_default_generation_uses_configured_model_chain(fake_sdk, monkeypatch):
    monkeypatch.setattr(llm_provider.settings, "gemini_fallback_models", "fallback-model")
    models = fake_sdk(RuntimeError("non-retryable"))

    with pytest.raises(llm_provider.AIServiceError):
        llm_provider._generate_structured(prompt="p", response_schema=ConversationAnswer)

    tried = []
    for call in models.calls:
        if not tried or tried[-1] != call["model"]:
            tried.append(call["model"])
    assert tried == [llm_provider.settings.gemini_model, "fallback-model"]


# ---------------------------------------------------------------------------
# C3 pipeline: real execute_pipeline / execute_c3 with domain objects
# ---------------------------------------------------------------------------

@pytest.fixture
def c3_runner(tmp_path):
    config = RunConfig(
        dataset_version="v1", corpus_version="v1", retrieval_run_id="test",
        retrieval_top_k=5, retrieval_threshold=0.6, generation_model="test-gen",
        generation_prompt_version="1", citation_evaluator_version="1", c3_evaluator_version="1",
        judge_model=JUDGE_MODEL,
    )
    return C3Runner(str(tmp_path / "c3_run"), config)


def test_execute_pipeline_freezes_surviving_claims(c3_runner):
    supported = "Mitochondria produce ATP."
    unsupported = "Mitochondria store DNA for the whole cell."
    raw_answer = ConversationAnswer(
        claims=[
            RawGroundedClaim(claim_text=supported, cited_evidence_ids=["e_01"]),
            RawGroundedClaim(claim_text=unsupported, cited_evidence_ids=["e_02"]),
        ],
        evidence_sufficient=True,
    )
    evaluations = [
        RawCitationEvaluation(claim_text=supported, evidence_id="e_01", support_level="SUPPORTED", reasoning="r"),
        RawCitationEvaluation(claim_text=unsupported, evidence_id="e_02", support_level="UNSUPPORTED", reasoning="r"),
    ]
    chunks = [
        {"text": "Mitochondria are the site of ATP production.", "score": 0.9},
        {"text": "The nucleus stores most cellular DNA.", "score": 0.8},
    ]

    with patch("eval.answer.resumable_runner.answer_conversation_question", return_value=raw_answer), \
         patch("eval.answer.resumable_runner.evaluate_citations", return_value=evaluations):
        po = c3_runner.execute_pipeline({"id": "case_1", "question": "What do mitochondria do?"}, chunks)

    assert po.infrastructure_failed is False, po.error_message
    assert po.actual_status == ChatAnswerStatus.PARTIALLY_ANSWERED
    assert [(c.claim_text, c.cited_evidence_ids) for c in po.surviving_claims] == [(supported, ["e_01"])]
    assert po.retrieved_eids == ["e_01", "e_02"]
    assert "[1]" in po.answer_markdown

    unhashed = po.model_copy(update={"content_hash": None})
    assert po.content_hash == hashlib.sha256(unhashed.model_dump_json().encode()).hexdigest()


def test_execute_c3_judge_failure_is_infrastructure_not_absent(c3_runner, fake_sdk):
    fake_sdk("not json at all")
    golden = {
        "id": "case_1",
        "expected_status": "ANSWERED",
        "category": "test",
        "expected_facts": [{"id": "f1", "canonical": "Mitochondria produce ATP.", "match_type": "semantic"}],
    }
    po = PipelineOutput(
        case_id="case_1", actual_status=ChatAnswerStatus.ANSWERED,
        answer_markdown="Mitochondria produce ATP [1].", retrieved_eids=["e_01"], infrastructure_failed=False,
    )

    result = c3_runner.execute_c3(golden, po)

    assert result.infrastructure_failed is True
    assert result.fact_results == []
