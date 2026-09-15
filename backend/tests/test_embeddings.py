from app.embeddings.embedder import LocalEmbedder


embedder = LocalEmbedder()

text = "Retrieval-Augmented Generation combines retrieval with language models."

vector = embedder.embed_text(text)

print(f"Embedding dimensions: {len(vector)}")
print(f"First 5 values: {vector[:5]}")
