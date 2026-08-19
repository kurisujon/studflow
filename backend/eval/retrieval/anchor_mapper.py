
import re

class AnchorMapper:
    def __init__(self, corpus_text: str):
        self.corpus_text = corpus_text
        self.anchors = []  # list of (start_idx, end_idx, anchor_name)
        self._parse_anchors()

    def _parse_anchors(self):
        pattern = re.compile(r"<!--\s*anchor:\s*(.*?)\s*-->")
        matches = list(pattern.finditer(self.corpus_text))
        
        for i, match in enumerate(matches):
            anchor_name = match.group(1)
            start_idx = match.end()
            
            if i + 1 < len(matches):
                end_idx = matches[i+1].start()
            else:
                end_idx = len(self.corpus_text)
                
            self.anchors.append((start_idx, end_idx, anchor_name))

    def map_chunk(self, chunk_text: str) -> set[str]:
        chunk_start = self.corpus_text.find(chunk_text)
        if chunk_start == -1:
            # Fallback for whitespace issues
            normalized_chunk = " ".join(chunk_text.split())
            normalized_corpus = " ".join(self.corpus_text.split())
            # For simplicity in evaluation, if we can't find exact offset, we look for string inclusion
            mapped = set()
            for start_idx, end_idx, anchor_name in self.anchors:
                anchor_text = self.corpus_text[start_idx:end_idx]
                if chunk_text.strip() in anchor_text or anchor_text.strip() in chunk_text:
                    mapped.add(anchor_name)
            return mapped

        chunk_end = chunk_start + len(chunk_text)
        mapped = set()
        
        for a_start, a_end, a_name in self.anchors:
            overlap = max(0, min(chunk_end, a_end) - max(chunk_start, a_start))
            if overlap > 0:
                mapped.add(a_name)
                
        return mapped
