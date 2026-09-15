from fastapi import FastAPI

app = FastAPI(
    title="ProRAG",
    description="Advanced RAG Knowledge Assistant",
    version="0.1.0",
)


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "ProRAG API",
    }