print("Starting imports...")
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent / "backend"))
print("Importing core.database...")
from core.database import Session, engine
print("Importing models...")
from models import User, Document, DocumentChunk, DocumentStatus
print("Importing document_processing...")
from services.document_processing import chunk_text
print("Importing llm_provider...")
from services.llm_provider import _embed_contents
print("Importing ai_service...")
from services.ai_service import generate_query_embedding
print("All imports successful!")
