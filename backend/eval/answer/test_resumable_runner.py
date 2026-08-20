import json
import pytest
from pathlib import Path
from unittest.mock import patch, MagicMock

from eval.answer.models import RunConfig, RunStatus, PipelineOutput, ChatAnswerStatus, ExpectedStatus, AnswerEvaluationResult
from eval.answer.exceptions import ConfigMismatchError
from eval.answer.resumable_runner import C3Runner

@pytest.fixture
def run_config():
    return RunConfig(
        dataset_version="v1",
        corpus_version="v1",
        retrieval_run_id="test_run",
        retrieval_top_k=5,
        retrieval_threshold=0.6,
        generation_model="test-model",
        generation_prompt_version="1.0",
        citation_evaluator_version="1.0",
        c3_evaluator_version="1.0"
    )

@pytest.fixture
def temp_run_dir(tmp_path):
    return str(tmp_path / "test_run_dir")

def test_manifest_creation_and_mismatch(temp_run_dir, run_config):
    runner1 = C3Runner(temp_run_dir, run_config)
    
    assert (Path(temp_run_dir) / "manifest.json").exists()
    
    # Should not raise
    runner2 = C3Runner(temp_run_dir, run_config)
    
    # Should raise mismatch
    bad_config = run_config.model_copy()
    bad_config.generation_model = "changed-model"
    with pytest.raises(ConfigMismatchError):
        C3Runner(temp_run_dir, bad_config)

def test_resume_skips_completed(temp_run_dir, run_config):
    runner = C3Runner(temp_run_dir, run_config)
    
    # Fake a completed case
    po = PipelineOutput(
        case_id="case_1", actual_status=ChatAnswerStatus.ANSWERED,
        answer_markdown="hello", retrieved_eids=[], infrastructure_failed=False
    )
    runner.append_pipeline_output(po)
    
    c3 = AnswerEvaluationResult(
        case_id="case_1", expected_status=ExpectedStatus.ANSWERED,
        actual_status=ChatAnswerStatus.ANSWERED, fact_results=[],
        expected_fact_count=1, matched_fact_count=1, fact_coverage=1.0,
        status_correct=True, answer_correct=True, category="test", infrastructure_failed=False
    )
    runner.append_c3_output(c3)
    
    with patch.object(runner, 'execute_pipeline') as mock_pipeline:
        with patch.object(runner, 'execute_c3') as mock_c3:
            runner.run([{"case_id": "case_1", "retrieved": []}], {"case_1": {"id": "case_1", "expected_status": "ANSWERED", "category": "test"}})
            
            mock_pipeline.assert_not_called()
            mock_c3.assert_not_called()

def test_resume_partially_evaluated(temp_run_dir, run_config):
    runner = C3Runner(temp_run_dir, run_config)
    
    # Fake pipeline output exists, but c3 missing
    po = PipelineOutput(
        case_id="case_1", actual_status=ChatAnswerStatus.ANSWERED,
        answer_markdown="hello", retrieved_eids=[], infrastructure_failed=False
    )
    runner.append_pipeline_output(po)
    
    with patch.object(runner, 'execute_pipeline') as mock_pipeline:
        with patch.object(runner, 'execute_c3') as mock_c3:
            
            # Setup c3 return
            mock_c3.return_value = AnswerEvaluationResult(
                case_id="case_1", expected_status=ExpectedStatus.ANSWERED,
                actual_status=ChatAnswerStatus.ANSWERED, fact_results=[],
                expected_fact_count=1, matched_fact_count=1, fact_coverage=1.0,
                status_correct=True, answer_correct=True, category="test", infrastructure_failed=False
            )
            
            runner.run([{"case_id": "case_1", "retrieved": []}], {"case_1": {"id": "case_1", "expected_status": "ANSWERED", "category": "test"}})
            
            mock_pipeline.assert_not_called()
            mock_c3.assert_called_once()
            
            manifest_status = json.loads((Path(temp_run_dir) / "manifest.json").read_text())["status"]
            assert manifest_status == RunStatus.CERTIFIED_C3_BASELINE.value

def test_failed_case_retried(temp_run_dir, run_config):
    runner = C3Runner(temp_run_dir, run_config)
    
    # Fake pipeline output failed
    po = PipelineOutput(
        case_id="case_1", actual_status=ChatAnswerStatus.FAILED,
        answer_markdown="", retrieved_eids=[], infrastructure_failed=True
    )
    runner.append_pipeline_output(po)
    
    with patch.object(runner, 'execute_pipeline') as mock_pipeline:
        with patch.object(runner, 'execute_c3') as mock_c3:
            
            # Now it succeeds
            po_success = po.model_copy()
            po_success.infrastructure_failed = False
            po_success.actual_status = ChatAnswerStatus.ANSWERED
            mock_pipeline.return_value = po_success
            
            mock_c3.return_value = AnswerEvaluationResult(
                case_id="case_1", expected_status=ExpectedStatus.ANSWERED,
                actual_status=ChatAnswerStatus.ANSWERED, fact_results=[],
                expected_fact_count=1, matched_fact_count=1, fact_coverage=1.0,
                status_correct=True, answer_correct=True, category="test", infrastructure_failed=False
            )
            
            runner.run([{"case_id": "case_1", "retrieved": []}], {"case_1": {"id": "case_1", "expected_status": "ANSWERED", "category": "test"}})
            
            mock_pipeline.assert_called_once()
            mock_c3.assert_called_once()
            
            outputs = runner.load_pipeline_outputs()
            assert not outputs["case_1"].infrastructure_failed
            assert len(outputs) == 1 # Overwritten in dict, file has 2 lines but dict takes latest
