from pathlib import Path

from app.embeddings.embedder import LocalEmbedder
from app.vectorstore.faiss_store import FAISSStore


class Retriever:
    def __init__(self, index_path: str):
        self.embedder = LocalEmbedder()
        self.store = FAISSStore()
        self.vectorstore = self.store.load(index_path)

    def search(self, query: str, k: int = 3):
        """
        Retrieve the top-k most relevant document chunks.
        """

        results = self.vectorstore.similarity_search_with_score(
            query,
            k=k,
        )

        return results