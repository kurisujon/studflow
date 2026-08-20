import unittest
from eval.answer.exact_matcher import evaluate_exact_fact
from eval.answer.models import ExpectedFact, MatchType

class TestExactMatcher(unittest.TestCase):
    def test_exact_match(self):
        fact = ExpectedFact(
            id="f1",
            canonical="HTTP 429 means Too Many Requests.",
            required_terms=["429", "Too Many Requests"],
            match_type=MatchType.EXACT
        )
        # Should pass with normal case variation
        res = evaluate_exact_fact(fact, "A 429 response indicates too many requests.")
        self.assertTrue(res.passed)
        
        # Should pass even with punctuation issues
        res = evaluate_exact_fact(fact, "429: too   many  requests!!!")
        self.assertTrue(res.passed)
        
        # Should fail if missing term
        res = evaluate_exact_fact(fact, "A 429 response indicates an error.")
        self.assertFalse(res.passed)
        self.assertIn("Missing terms", res.reason)

if __name__ == '__main__':
    unittest.main()
