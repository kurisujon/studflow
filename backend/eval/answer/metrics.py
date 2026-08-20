from eval.answer.models import AnswerEvaluationResult, CategoryMetrics, AnswerMetrics, SemanticFactJudgment, ExpectedStatus, ChatAnswerStatus

def _calc_category_metrics(results: list[AnswerEvaluationResult]) -> CategoryMetrics:
    if not results:
        return CategoryMetrics(
            exact_accuracy=0.0, semantic_accuracy=0.0, overall_accuracy=0.0,
            mean_fact_coverage=0.0, complete_answer_rate=0.0, partial_answer_rate=0.0,
            status_accuracy=0.0, correct_abstention_rate=0.0, incorrect_answer_rate=0.0,
            contradiction_rate=0.0, case_count=0, infrastructure_failure_count=0
        )
        
    failures = sum(1 for r in results if r.actual_status == ChatAnswerStatus.FAILED)
    valid_results = [r for r in results if r.actual_status != ChatAnswerStatus.FAILED]
    
    if not valid_results:
        return CategoryMetrics(
            exact_accuracy=0.0, semantic_accuracy=0.0, overall_accuracy=0.0,
            mean_fact_coverage=0.0, complete_answer_rate=0.0, partial_answer_rate=0.0,
            status_accuracy=0.0, correct_abstention_rate=0.0, incorrect_answer_rate=0.0,
            contradiction_rate=0.0, case_count=len(results), infrastructure_failure_count=failures
        )
    
    answerable_cases = [r for r in valid_results if r.expected_status == ExpectedStatus.ANSWERED]
    abstention_cases = [r for r in valid_results if r.expected_status == ExpectedStatus.INSUFFICIENT_EVIDENCE]
    
    exact_facts_total = 0
    exact_facts_passed = 0
    semantic_facts_total = 0
    semantic_facts_passed = 0
    semantic_facts_contradicted = 0
    
    for r in answerable_cases:
        for f in r.fact_results:
            if f.match_type == "exact":
                exact_facts_total += 1
                if f.passed: exact_facts_passed += 1
            else:
                semantic_facts_total += 1
                if f.passed: semantic_facts_passed += 1
                if f.judgment == SemanticFactJudgment.CONTRADICTED:
                    semantic_facts_contradicted += 1

    overall_total = exact_facts_total + semantic_facts_total
    overall_passed = exact_facts_passed + semantic_facts_passed
    
    exact_acc = (exact_facts_passed / exact_facts_total) if exact_facts_total > 0 else 0.0
    semantic_acc = (semantic_facts_passed / semantic_facts_total) if semantic_facts_total > 0 else 0.0
    overall_acc = (overall_passed / overall_total) if overall_total > 0 else 0.0
    contradiction_rate = (semantic_facts_contradicted / semantic_facts_total) if semantic_facts_total > 0 else 0.0
    
    coverages = [r.fact_coverage for r in answerable_cases if r.fact_coverage is not None]
    mean_coverage = sum(coverages) / len(coverages) if coverages else 0.0
    
    complete_cases = sum(1 for c in coverages if c == 1.0)
    partial_cases = sum(1 for c in coverages if 0.0 < c < 1.0)
    complete_rate = (complete_cases / len(answerable_cases)) if answerable_cases else 0.0
    partial_rate = (partial_cases / len(answerable_cases)) if answerable_cases else 0.0
    
    status_correct_count = sum(1 for r in valid_results if r.status_correct)
    status_acc = status_correct_count / len(valid_results)
    
    correct_abstentions = sum(1 for r in abstention_cases if r.status_correct)
    correct_abstention_rate = (correct_abstentions / len(abstention_cases)) if abstention_cases else 0.0
    
    incorrect_answers = sum(1 for r in abstention_cases if not r.status_correct and r.actual_status in (ChatAnswerStatus.ANSWERED, ChatAnswerStatus.PARTIALLY_ANSWERED))
    incorrect_answer_rate = (incorrect_answers / len(abstention_cases)) if abstention_cases else 0.0
    
    return CategoryMetrics(
        exact_accuracy=exact_acc,
        semantic_accuracy=semantic_acc,
        overall_accuracy=overall_acc,
        mean_fact_coverage=mean_coverage,
        complete_answer_rate=complete_rate,
        partial_answer_rate=partial_rate,
        status_accuracy=status_acc,
        correct_abstention_rate=correct_abstention_rate,
        incorrect_answer_rate=incorrect_answer_rate,
        contradiction_rate=contradiction_rate,
        case_count=len(results),
        infrastructure_failure_count=failures
    )

def calculate_answer_metrics(results: list[AnswerEvaluationResult]) -> AnswerMetrics:
    overall = _calc_category_metrics(results)
    
    categories = set(r.category for r in results)
    per_category = {}
    for cat in categories:
        cat_results = [r for r in results if r.category == cat]
        per_category[cat] = _calc_category_metrics(cat_results)
        
    return AnswerMetrics(overall=overall, per_category=per_category)
