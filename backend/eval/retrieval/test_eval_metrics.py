
import unittest
from eval.retrieval.models import RetrievedChunkMatch, RetrievalCaseResult
from eval.retrieval.metrics import calculate_answerable_metrics
from eval.retrieval.threshold_analysis import calculate_confusion_matrix

class TestRetrievalMetrics(unittest.TestCase):
    def test_answerable_metrics(self):
        cases = [
            RetrievalCaseResult(
                case_id="case1",
                category="multi_chunk",
                difficulty="easy",
                expected_anchors={"A", "B"},
                retrieved=[
                    RetrievedChunkMatch(chunk_id="c1", rank=1, score=0.9, text="...", anchors={"C"}),
                    RetrievedChunkMatch(chunk_id="c2", rank=2, score=0.8, text="...", anchors={"A", "D"}),
                    RetrievedChunkMatch(chunk_id="c3", rank=3, score=0.7, text="...", anchors={"E"})
                ]
            )
        ]
        
        metrics = calculate_answerable_metrics(cases, k=5)
        self.assertEqual(metrics.hit_rate_at_k, 1.0)
        self.assertEqual(metrics.anchor_coverage_at_k, 0.5)
        self.assertEqual(metrics.complete_evidence_rate_at_k, 0.0)
        self.assertEqual(metrics.mrr, 0.5) # Rank 2
        self.assertEqual(metrics.precision_at_k, 1/3) # 1 chunk out of 3 had an expected anchor

    def test_complete_evidence(self):
        cases = [
            RetrievalCaseResult(
                case_id="case2",
                category="multi_chunk",
                difficulty="easy",
                expected_anchors={"A", "B"},
                retrieved=[
                    RetrievedChunkMatch(chunk_id="c1", rank=1, score=0.9, text="...", anchors={"A", "B"})
                ]
            )
        ]
        metrics = calculate_answerable_metrics(cases, k=5)
        self.assertEqual(metrics.hit_rate_at_k, 1.0)
        self.assertEqual(metrics.anchor_coverage_at_k, 1.0)
        self.assertEqual(metrics.complete_evidence_rate_at_k, 1.0)
        self.assertEqual(metrics.mrr, 1.0)
        self.assertEqual(metrics.precision_at_k, 1.0)

    def test_confusion_matrix(self):
        cases = [
            RetrievalCaseResult(case_id="1", category="", difficulty="", should_abstain=False, top_score=0.6), # True Pass
            RetrievalCaseResult(case_id="2", category="", difficulty="", should_abstain=False, top_score=0.4), # False Abstention
            RetrievalCaseResult(case_id="3", category="", difficulty="", should_abstain=True, top_score=0.4), # Correct Abstention
            RetrievalCaseResult(case_id="4", category="", difficulty="", should_abstain=True, top_score=0.6), # Missed Abstention
        ]
        
        cm = calculate_confusion_matrix(cases, threshold=0.50)
        self.assertEqual(cm.correct_proceed, 1)
        self.assertEqual(cm.false_abstention, 1)
        self.assertEqual(cm.missed_abstention, 1)
        self.assertEqual(cm.correct_abstention, 1)

if __name__ == "__main__":
    unittest.main()
