import json
import pytest
from pathlib import Path
from unittest.mock import patch

from eval.answer.models import RunConfig, RunStatus, PipelineOutput, ChatAnswerStatus, FrozenSurvivingClaim
from eval.groundedness.models import ClaimGroundednessResult, GroundednessJudgment
from eval.groundedness.runner import C4Runner

@pytest.fixture
def run_config():
    return RunConfig(
        dataset_version="v1", corpus_version="v1", retrieval_run_id="test",
        retrieval_top_k=5, retrieval_threshold=0.6, generation_model="gemini",
        generation_prompt_version="1", citation_evaluator_version="1", c3_evaluator_version="1"
    )

@pytest.fixture
def temp_run_dir(tmp_path, run_config):
    dir_path = tmp_path / "c3_run"
    dir_path.mkdir()
    with open(dir_path / "manifest.json", "w") as f:
        json.dump({"run_id": "test", "config": run_config.model_dump(), "status": RunStatus.PARTIAL.value}, f)
    return str(dir_path)

def test_c4_claim_level_resume(temp_run_dir):
    po = PipelineOutput(
        case_id="case_1", actual_status=ChatAnswerStatus.ANSWERED,
        answer_markdown="ans", retrieved_eids=["e_01"], retrieved_context="ctx", infrastructure_failed=False,
        surviving_claims=[
            FrozenSurvivingClaim(claim_id="c1", claim_text="t1"),
            FrozenSurvivingClaim(claim_id="c2", claim_text="t2")
        ]
    )
    with open(Path(temp_run_dir) / "pipeline_outputs.jsonl", "w") as f:
        f.write(json.dumps(po.model_dump()) + "\n")
        
    cr1 = ClaimGroundednessResult(
        case_id="case_1", claim_id="c1", claim_text="t1",
        judgment=GroundednessJudgment.GROUNDED, reason="test", infrastructure_failed=False
    )
    with open(Path(temp_run_dir) / "groundedness_claims.jsonl", "w") as f:
        f.write(json.dumps(cr1.model_dump()) + "\n")

    runner = C4Runner(temp_run_dir)
    
    with patch("eval.groundedness.runner.evaluate_claim_groundedness") as mock_eval:
        mock_eval.return_value = ClaimGroundednessResult(
            case_id="case_1", claim_id="c2", claim_text="t2",
            judgment=GroundednessJudgment.PARTIAL, reason="test2", infrastructure_failed=False
        )
        
        golden = {"case_1": {"category": "test"}}
        
        metrics = runner.run(golden)
        
        # Should only evaluate c2
        mock_eval.assert_called_once_with("case_1", "c2", "t2", "ctx")
        
        assert metrics.overall.evaluated_claim_count == 2
        assert metrics.overall.strict_groundedness_rate == 0.5 # 1 grounded, 1 partial
        assert metrics.overall.fully_grounded_answer_rate == 0.0 # 1 case, not fully grounded
        
def test_c4_abstention_case(temp_run_dir):
    po = PipelineOutput(
        case_id="case_1", actual_status=ChatAnswerStatus.INSUFFICIENT_EVIDENCE,
        answer_markdown="ans", retrieved_eids=["e_01"], retrieved_context="ctx", infrastructure_failed=False,
        surviving_claims=[] # ABSTENTION
    )
    with open(Path(temp_run_dir) / "pipeline_outputs.jsonl", "w") as f:
        f.write(json.dumps(po.model_dump()) + "\n")

    runner = C4Runner(temp_run_dir)
    
    with patch("eval.groundedness.runner.evaluate_claim_groundedness") as mock_eval:
        golden = {"case_1": {"category": "test"}}
        
        metrics = runner.run(golden)
        
        mock_eval.assert_not_called()
        assert metrics.overall.applicable_case_count == 0
        assert metrics.overall.evaluated_claim_count == 0
