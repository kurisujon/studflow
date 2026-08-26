
import json
import os
import unittest
from pathlib import Path
from eval.schemas import GoldenCase
from pydantic import ValidationError

class TestEvalIntegrity(unittest.TestCase):
    def setUp(self):
        self.eval_dir = Path(__file__).parent
        self.datasets_dir = self.eval_dir / "datasets"
        self.manifest_path = self.datasets_dir / "manifest.json"
        self.cases_path = self.datasets_dir / "golden_cases.jsonl"
        
        with open(self.manifest_path, "r") as f:
            self.manifest = json.load(f)
            
        self.corpora = {}
        for c in self.manifest["corpora"]:
            corpus_path = (self.datasets_dir / c["path"]).resolve()
            with open(corpus_path, "r") as f:
                self.corpora[c["source_id"]] = f.read()
                
        with open(self.cases_path, "r") as f:
            self.lines = f.readlines()

    def test_golden_cases_schema_and_logic(self):
        self.assertEqual(len(self.lines), self.manifest["case_count"])
        
        case_ids = set()
        
        for idx, line in enumerate(self.lines):
            try:
                # 1. Schema Validation
                case = GoldenCase.model_validate_json(line)
                
                # Check duplicates
                self.assertNotIn(case.id, case_ids, f"Duplicate ID: {case.id}")
                case_ids.add(case.id)
                
                # Dataset version match
                self.assertEqual(case.dataset_version, self.manifest["dataset_version"])
                
                # 2. Fact ID Integrity
                defined_fact_ids = {fact.id for fact in case.expected_facts}
                referenced_fact_ids = set()
                for ev in case.expected_evidence:
                    referenced_fact_ids.update(ev.fact_ids)
                    
                self.assertEqual(defined_fact_ids, referenced_fact_ids, f"Fact ID mismatch in case {case.id}")
                
                # 3. Source ID Integrity
                self.assertIn(case.source_id, self.corpora, f"Unknown source_id {case.source_id} in case {case.id}")
                
                # 4. Anchor Integrity
                corpus_text = self.corpora[case.source_id]
                for ev in case.expected_evidence:
                    expected_anchor = f"<!-- anchor: {ev.anchor} -->"
                    self.assertIn(expected_anchor, corpus_text, f"Anchor {ev.anchor} not found in {case.source_id} for case {case.id}")
                    
                # 5. Abstention alignment
                if case.should_abstain:
                    self.assertEqual(case.expected_status, "INSUFFICIENT_EVIDENCE")
                    self.assertEqual(len(case.expected_facts), 0)
                    self.assertEqual(len(case.expected_evidence), 0)
                else:
                    self.assertEqual(case.expected_status, "ANSWERED")
                    self.assertGreater(len(case.expected_facts), 0, f"Case {case.id} must have expected facts if not abstaining.")
                    
            except Exception as e:
                self.fail(f"Validation failed on line {idx} (Case ID: {json.loads(line).get("id")}): {e}")

    def test_negative_invalid_status(self):
        invalid_case = json.loads(self.lines[0])
        invalid_case["expected_status"] = "OUT_OF_SCOPE"
        with self.assertRaises(ValidationError):
            GoldenCase.model_validate_json(json.dumps(invalid_case))
            
    def test_negative_invalid_category(self):
        invalid_case = json.loads(self.lines[0])
        invalid_case["category"] = "unsupported_cat"
        with self.assertRaises(ValidationError):
            GoldenCase.model_validate_json(json.dumps(invalid_case))

if __name__ == "__main__":
    unittest.main()
