from pathlib import Path

from app.ingestion.pdf_loader import load_pdf
from app.ingestion.chunker import split_documents


PROJECT_ROOT = Path(__file__).resolve().parents[2]
PDF_PATH = PROJECT_ROOT / "data" / "documents" / "sample.pdf"

documents = load_pdf(str(PDF_PATH))
chunks = split_documents(documents)

print(f"Pages loaded: {len(documents)}")
print(f"Chunks created: {len(chunks)}")

for i, chunk in enumerate(chunks[:3]):
    print(f"\n--- Chunk {i + 1} ---")
    print(chunk.page_content)
    print("\nMetadata:", chunk.metadata)