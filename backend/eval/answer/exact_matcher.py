import re
import unicodedata
from eval.answer.models import ExpectedFact, FactEvaluationResult

def normalize_text(text: str) -> str:
    if not text:
        return ""
    text = unicodedata.normalize('NFKD', text)
    text = text.casefold()
    text = re.sub(r'[^\w\s]', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def evaluate_exact_fact(fact: ExpectedFact, answer_text: str) -> FactEvaluationResult:
    normalized_answer = normalize_text(answer_text)
    
    if not fact.required_terms:
        # Fallback to canonical if no terms provided
        terms = [fact.canonical]
    else:
        terms = fact.required_terms
        
    missing = []
    for term in terms:
        normalized_term = normalize_text(term)
        if normalized_term not in normalized_answer:
            missing.append(term)
            
    passed = len(missing) == 0
    reason = f"Missing terms: {', '.join(missing)}" if missing else "All required terms present."
    
    return FactEvaluationResult(
        fact_id=fact.id,
        match_type=fact.match_type,
        passed=passed,
        reason=reason
    )
