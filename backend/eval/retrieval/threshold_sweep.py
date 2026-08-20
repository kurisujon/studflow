import json
import statistics

def main():
    cases_file = "backend/eval/results/live_72b513d6/retrieval_cases.jsonl"
    
    answerable_scores = []
    negative_scores = []
    
    cases = []
    
    with open(cases_file, "r") as f:
        for line in f:
            case = json.loads(line)
            cases.append(case)
            score = case["top_score"]
            if case["should_abstain"]:
                negative_scores.append(score)
            else:
                answerable_scores.append(score)
                
    def print_stats(name, scores):
        print(f"**{name}**")
        if not scores:
            print("No scores.")
            return
        print(f"- Min top score: {min(scores):.3f}")
        print(f"- Median top score: {statistics.median(scores):.3f}")
        print(f"- Mean top score: {statistics.mean(scores):.3f}")
        print(f"- Max top score: {max(scores):.3f}")
        print()

    print_stats("Answerable Cases", answerable_scores)
    print_stats("Negative/Abstention Cases", negative_scores)
    
    print("| Threshold | Correct Proceed | False Abstain | Missed Abstain | Correct Abstain | Proceed Acc | Abstain Acc | Abstain Prec | Abstain Recall | Abstain F1 | Overall Acc |")
    print("|-----------|-----------------|---------------|----------------|-----------------|-------------|-------------|--------------|----------------|------------|-------------|")
    
    thresholds = [0.40, 0.45, 0.50, 0.55, 0.60, 0.65, 0.67, 0.68, 0.69, 0.70, 0.71, 0.72, 0.73, 0.74, 0.75, 0.80, 0.85, 0.90]
    
    for t in thresholds:
        tp = 0 # Correct Proceed
        fn = 0 # False Abstain
        fp = 0 # Missed Abstain
        tn = 0 # Correct Abstain
        
        for case in cases:
            score = case["top_score"]
            passed = score >= t
            
            if not case["should_abstain"]:
                if passed:
                    tp += 1
                else:
                    fn += 1
            else:
                if passed:
                    fp += 1
                else:
                    tn += 1
                    
        total_answerable = tp + fn
        total_negative = tn + fp
        
        proceed_acc = (tp / total_answerable) if total_answerable > 0 else 0
        abstain_acc = (tn / total_negative) if total_negative > 0 else 0
        
        # Abstention is treated as the "positive" class for precision/recall/F1 as requested logically
        abstain_prec = (tn / (tn + fn)) if (tn + fn) > 0 else 0
        abstain_recall = (tn / (tn + fp)) if (tn + fp) > 0 else 0
        abstain_f1 = (2 * abstain_prec * abstain_recall) / (abstain_prec + abstain_recall) if (abstain_prec + abstain_recall) > 0 else 0
        
        overall_acc = (tp + tn) / (total_answerable + total_negative)
        
        print(f"| {t:.2f} | {tp} | {fn} | {fp} | {tn} | {proceed_acc:.1%} | {abstain_acc:.1%} | {abstain_prec:.1%} | {abstain_recall:.1%} | {abstain_f1:.1%} | {overall_acc:.1%} |")

if __name__ == "__main__":
    main()
