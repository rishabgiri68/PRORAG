from app.retrieval.retriever import Retriever


class RAGPipeline:
    def __init__(self, index_path: str, llm):
        self.retriever = Retriever(index_path)
        self.llm = llm

    def ask(self, query: str, k: int = 3):

        # Retrieve relevant chunks
        results = self.retriever.search(
            query,
            k=k
        )

        # Build numbered context for citations
        context = "\n\n".join(
            f"[{i}] {document.page_content}"
            for i, (document, _) in enumerate(results, start=1)
        )

        # Build grounded prompt
        prompt = f"""
You are a document question-answering assistant.

Answer the question using ONLY the context provided below.

When using information from the context, cite the source number
using citations like [1], [2], or [3].

Every factual statement from the context should include the
appropriate citation.

If the answer is not present in the context, say:
"I couldn't find the answer in the provided documents."

Do not invent information.
Do not create citations that are not present in the context.

Context:
----------------
{context}
----------------

Question:
{query}

Answer:
"""

        # Generate answer
        answer = self.llm.generate(prompt)

        return {
            "answer": answer,
            "sources": [
                {
                    "content": document.page_content,
                    "score": float(score),
                    "metadata": document.metadata,
                }
                for document, score in results
            ],
        }