from pathlib import Path

from langchain_community.vectorstores import FAISS

from app.embeddings.embedder import LocalEmbedder


class FAISSStore:
    def __init__(self):
        self.embedder = LocalEmbedder()

    def create(self, documents):
        """
        Create a FAISS index from LangChain Documents.
        """

        texts = [document.page_content for document in documents]

        embeddings = self.embedder.embed_documents(texts)

        vectorstore = FAISS.from_embeddings(
            text_embeddings=list(zip(texts, embeddings)),
            embedding=self.embedder,
            metadatas=[document.metadata for document in documents],
        )

        return vectorstore

    def save(self, vectorstore, path: str):
        Path(path).mkdir(parents=True, exist_ok=True)

        vectorstore.save_local(path)

    def load(self, path: str):
        return FAISS.load_local(
            path,
            self.embedder,
            allow_dangerous_deserialization=True,
        )