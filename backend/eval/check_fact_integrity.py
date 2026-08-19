import json
from pathlib import Path

eval_dir = Path("backend/eval")
cases_path = eval_dir / "datasets" / "golden_cases.jsonl"
manifest_path = eval_dir / "datasets" / "manifest.json"

with open(manifest_path, "r") as f:
    manifest = json.load(f)

corpora = {}
for c in manifest["corpora"]:
    with open(eval_dir / "datasets" / c["path"], "r") as f:
        content = f.read()
        corpora[c["source_id"]] = content

# Extract anchor blocks
anchor_blocks = {}
for source_id, text in corpora.items():
    anchor_blocks[source_id] = {}
    lines = text.split('\n')
    current_anchor = None
    current_block = []
    
    for line in lines:
        if line.startswith("<!-- anchor:"):
            if current_anchor:
                anchor_blocks[source_id][current_anchor] = "\n".join(current_block)
            current_anchor = line.split("<!-- anchor:")[1].split("-->")[0].strip()
            current_block = []
        else:
            if current_anchor:
                current_block.append(line)
    if current_anchor:
        anchor_blocks[source_id][current_anchor] = "\n".join(current_block)

errors = []

with open(cases_path, "r") as f:
    for line in f:
        case = json.loads(line)
        source_id = case["source_id"]
        
        # Map facts
        facts = {fact["id"]: fact for fact in case["expected_facts"]}
        
        for ev in case["expected_evidence"]:
            anchor = ev["anchor"]
            block_text = anchor_blocks.get(source_id, {}).get(anchor, "")
            
            for fact_id in ev["fact_ids"]:
                fact = facts[fact_id]
                
                # Check if exact terms appear in the block text
                for term in fact.get("required_terms", []):
                    if term.lower() not in block_text.lower():
                        errors.append(f"Case {case['id']}: Required term '{term}' not found in anchor text '{anchor}'")
                        
if errors:
    print("ERRORS FOUND:")
    for e in errors:
        print(e)
else:
    print("ALL ANCHORS AND EXACT TERMS MATHEMATICALLY VERIFIED AGAINST SOURCE TEXT!")
