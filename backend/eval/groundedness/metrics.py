from eval.groundedness.models import CaseGroundednessResult, GroundednessCategoryMetrics, GroundednessMetrics

def _calc_category_metrics(cases: list[CaseGroundednessResult]) -> GroundednessCategoryMetrics:
    if not cases:
        return GroundednessCategoryMetrics(
            strict_groundedness_rate=0.0,
            fully_grounded_answer_rate=0.0,
            partial_claim_rate=0.0,
            ungrounded_claim_rate=0.0,
            contradiction_rate=0.0,
            applicable_case_count=0,
            evaluated_claim_count=0,
            infrastructure_failure_count=0
        )
        
    applicable_cases = [c for c in cases if c.strict_groundedness_rate is not None]
    
    # We only count infrastructure failures if they prevented the claim evaluations?
    # Actually, a claim with infrastructure failure might cause the case to not be fully evaluated.
    # We'll just count total claims evaluated.
    total_claims = 0
    grounded = 0
    partial = 0
    ungrounded = 0
    contradicted = 0
    
    for case in applicable_cases:
        for claim in case.claim_results:
            if not claim.infrastructure_failed:
                total_claims += 1
                if claim.judgment == "GROUNDED": grounded += 1
                elif claim.judgment == "PARTIAL": partial += 1
                elif claim.judgment == "UNGROUNDED": ungrounded += 1
                elif claim.judgment == "CONTRADICTED": contradicted += 1

    infra_failures = sum(1 for c in cases for cr in c.claim_results if cr.infrastructure_failed)
    
    strict_rate = (grounded / total_claims) if total_claims > 0 else 0.0
    partial_rate = (partial / total_claims) if total_claims > 0 else 0.0
    ungrounded_rate = (ungrounded / total_claims) if total_claims > 0 else 0.0
    contradiction_rate = (contradicted / total_claims) if total_claims > 0 else 0.0
    
    fully_grounded_cases = sum(1 for c in applicable_cases if c.fully_grounded)
    fully_grounded_rate = (fully_grounded_cases / len(applicable_cases)) if applicable_cases else 0.0
    
    return GroundednessCategoryMetrics(
        strict_groundedness_rate=strict_rate,
        fully_grounded_answer_rate=fully_grounded_rate,
        partial_claim_rate=partial_rate,
        ungrounded_claim_rate=ungrounded_rate,
        contradiction_rate=contradiction_rate,
        applicable_case_count=len(applicable_cases),
        evaluated_claim_count=total_claims,
        infrastructure_failure_count=infra_failures
    )

def calculate_groundedness_metrics(cases: list[CaseGroundednessResult]) -> GroundednessMetrics:
    overall = _calc_category_metrics(cases)
    
    categories = set(c.category for c in cases)
    per_category = {}
    for cat in categories:
        cat_cases = [c for c in cases if c.category == cat]
        per_category[cat] = _calc_category_metrics(cat_cases)
        
    return GroundednessMetrics(overall=overall, per_category=per_category)
