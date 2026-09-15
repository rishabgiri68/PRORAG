from pathlib import Path

from app.ingestion.pdf_loader import load_pdf
from app.ingestion.chunker import split_documents
from app.vectorstore.faiss_store import FAISSStore


PROJECT_ROOT = Path(__file__).resolve().parents[2]

PDF_PATH = PROJECT_ROOT / "data" / "documents" / "sample.pdf"

INDEX_PATH = PROJECT_ROOT / "data" / "vectorstore" / "faiss"


# 1. Load PDF
documents = load_pdf(str(PDF_PATH))

# 2. Split into chunks
chunks = split_documents(documents)

print(f"Pages: {len(documents)}")
print(f"Chunks: {len(chunks)}")


# 3. Create FAISS index
store = FAISSStore()

vectorstore = store.create(chunks)

print("FAISS index created successfully.")


# 4. Save index
store.save(vectorstore, str(INDEX_PATH))

print(f"FAISS index saved to: {INDEX_PATH}")