
from typing import List
from .models import RetrievalCaseResult, ConfusionMatrix

def calculate_confusion_matrix(cases: List[RetrievalCaseResult], threshold: float) -> ConfusionMatrix:
    correct_proceed = 0
    false_abstention = 0
    missed_abstention = 0
    correct_abstention = 0

    for case in cases:
        passed = case.top_score >= threshold
        
        if not case.should_abstain:
            # Answerable case
            if passed:
                correct_proceed += 1
            else:
                false_abstention += 1
        else:
            # Negative case
            if passed:
                missed_abstention += 1
            else:
                correct_abstention += 1

    return ConfusionMatrix(
        correct_proceed=correct_proceed,
        false_abstention=false_abstention,
        missed_abstention=missed_abstention,
        correct_abstention=correct_abstention
    )
