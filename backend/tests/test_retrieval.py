from pathlib import Path

from app.retrieval.retriever import Retriever


PROJECT_ROOT = Path(__file__).resolve().parents[2]
INDEX_PATH = PROJECT_ROOT / "data" / "vectorstore" / "faiss"

retriever = Retriever(str(INDEX_PATH))

query = "What is Retrieval-Augmented Generation?"

results = retriever.search(query, k=2)

print(f"Query: {query}")
print(f"Results found: {len(results)}")

for i, (document, score) in enumerate(results, start=1):
    print(f"\n--- Result {i} ---")
    print(f"Score: {score}")
    print(f"Text:\n{document.page_content}")
    print(f"Metadata: {document.metadata}")