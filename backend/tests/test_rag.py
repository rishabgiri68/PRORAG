from pathlib import Path

from app.generation.llm import OmniRouteLLM
from app.rag.pipeline import RAGPipeline


PROJECT_ROOT = Path(__file__).resolve().parents[2]

INDEX_PATH = PROJECT_ROOT / "data" / "vectorstore" / "faiss"


llm = OmniRouteLLM(
    model="kr/claude-sonnet-4.5"
)

rag = RAGPipeline(
    index_path=str(INDEX_PATH),
    llm=llm,
)


query = "What is Retrieval-Augmented Generation?"

result = rag.ask(query, k=2)


print("\n==============================")
print("RAG ANSWER")
print("==============================")
print(result["answer"])


print("\n==============================")
print("SOURCES")
print("==============================")

for i, source in enumerate(result["sources"], start=1):
    print(f"\n--- Source {i} ---")
    print(f"Score: {source['score']}")
    print(f"Metadata: {source['metadata']}")
    print(f"Content: {source['content']}")