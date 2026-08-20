from eval.citation.models import CaseCitationResult, CitationCategoryMetrics, CitationMetrics

def _calc_category_metrics(cases: list[CaseCitationResult]) -> CitationCategoryMetrics:
    if not cases:
        return CitationCategoryMetrics(
            strict_citation_accuracy=0.0,
            fully_cited_claim_rate=0.0,
            missing_citation_rate=0.0,
            partial_citation_rate=0.0,
            incorrect_citation_rate=0.0,
            citation_precision=0.0,
            applicable_claim_count=0,
            evaluated_citation_count=0,
            infrastructure_failure_count=0
        )

    total_citations = 0
    correct = 0
    partial = 0
    incorrect = 0
    
    total_applicable_claims = 0
    missing_claims = 0
    fully_cited_claims = 0
    
    sum_precision = 0.0
    precision_count = 0
    
    infra_failures = 0

    for case in cases:
        if case.infrastructure_failed:
            continue
            
        for claim in case.claim_results:
            if claim.infrastructure_failed:
                infra_failures += 1
                continue
                
            total_applicable_claims += 1
            
            if claim.missing_citation:
                missing_claims += 1
            else:
                if claim.fully_cited:
                    fully_cited_claims += 1
                    
                if claim.citation_precision is not None:
                    sum_precision += claim.citation_precision
                    precision_count += 1
                    
            for cit in claim.citation_results:
                if cit.judgment != "MISSING":
                    total_citations += 1
                    if cit.judgment == "CORRECT": correct += 1
                    elif cit.judgment == "PARTIAL": partial += 1
                    elif cit.judgment == "INCORRECT": incorrect += 1

    strict_acc = (correct / total_citations) if total_citations > 0 else 0.0
    partial_rate = (partial / total_citations) if total_citations > 0 else 0.0
    incorrect_rate = (incorrect / total_citations) if total_citations > 0 else 0.0
    
    missing_rate = (missing_claims / total_applicable_claims) if total_applicable_claims > 0 else 0.0
    fully_cited_rate = (fully_cited_claims / total_applicable_claims) if total_applicable_claims > 0 else 0.0
    
    avg_precision = (sum_precision / precision_count) if precision_count > 0 else 0.0

    return CitationCategoryMetrics(
        strict_citation_accuracy=strict_acc,
        fully_cited_claim_rate=fully_cited_rate,
        missing_citation_rate=missing_rate,
        partial_citation_rate=partial_rate,
        incorrect_citation_rate=incorrect_rate,
        citation_precision=avg_precision,
        applicable_claim_count=total_applicable_claims,
        evaluated_citation_count=total_citations,
        infrastructure_failure_count=infra_failures
    )

def calculate_citation_metrics(cases: list[CaseCitationResult]) -> CitationMetrics:
    overall = _calc_category_metrics(cases)
    
    categories = set(c.category for c in cases)
    per_category = {}
    for cat in categories:
        cat_cases = [c for c in cases if c.category == cat]
        per_category[cat] = _calc_category_metrics(cat_cases)
        
    return CitationMetrics(overall=overall, per_category=per_category)
