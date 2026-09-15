from pathlib import Path
import shutil

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.generation.llm import OmniRouteLLM
from app.rag.pipeline import RAGPipeline
from app.ingestion.pdf_loader import load_pdf
from app.ingestion.chunker import split_documents
from app.vectorstore.faiss_store import FAISSStore


# ==================================================
# FastAPI App
# ==================================================

app = FastAPI(
    title="ProRAG API",
    description="Advanced RAG Knowledge Assistant API",
    version="1.0.0",
)


# ==================================================
# CORS
# ==================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================================================
# Project Paths
# ==================================================

PROJECT_ROOT = Path(__file__).resolve().parents[2]

DOCUMENTS_DIR = PROJECT_ROOT / "data" / "documents"

INDEX_PATH = (
    PROJECT_ROOT
    / "data"
    / "vectorstore"
    / "faiss"
)

DOCUMENTS_DIR.mkdir(
    parents=True,
    exist_ok=True,
)


# ==================================================
# LLM + RAG Pipeline
# ==================================================

llm = OmniRouteLLM(
    model="kr/claude-sonnet-4.5"
)

rag = RAGPipeline(
    index_path=str(INDEX_PATH),
    llm=llm,
)


# ==================================================
# Request Models
# ==================================================

class AskRequest(BaseModel):
    query: str
    k: int = 3


# ==================================================
# Health Endpoint
# ==================================================

@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "ProRAG",
    }


# ==================================================
# Ask RAG Endpoint
# ==================================================

@app.post("/ask")
def ask(request: AskRequest):

    result = rag.ask(
        query=request.query,
        k=request.k,
    )

    return result


# ==================================================
# Upload + Index PDF Endpoint
# ==================================================

@app.post("/upload")
async def upload_document(
    file: UploadFile = File(...)
):

    global rag

    # ----------------------------------------------
    # Validate file
    # ----------------------------------------------

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No file provided.",
        )

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported.",
        )


    # ----------------------------------------------
    # Safe filename
    # ----------------------------------------------

    safe_filename = Path(file.filename).name

    file_path = (
        DOCUMENTS_DIR
        / safe_filename
    )


    # ----------------------------------------------
    # Save PDF
    # ----------------------------------------------

    try:

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(
                file.file,
                buffer,
            )

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=f"File saving failed: {str(error)}",
        )


    # ----------------------------------------------
    # Process + Index PDF
    # ----------------------------------------------

    try:

        # 1. Load PDF
        documents = load_pdf(
            str(file_path)
        )


        # 2. Create chunks
        chunks = split_documents(
            documents
        )


        # 3. Load FAISS store
        store = FAISSStore()

        vectorstore = store.load(
            str(INDEX_PATH)
        )


        # 4. Add new chunks
        vectorstore.add_documents(
            chunks
        )


        # 5. Save updated FAISS index
        store.save(
            vectorstore,
            str(INDEX_PATH),
        )


        # 6. Refresh active RAG pipeline
        rag = RAGPipeline(
            index_path=str(INDEX_PATH),
            llm=llm,
        )


        return {
            "message": "Document uploaded and indexed successfully",
            "filename": safe_filename,
            "pages": len(documents),
            "chunks": len(chunks),
        }


    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=f"Indexing failed: {str(error)}",
        )


# ==================================================
# Documents Endpoint
# ==================================================

@app.get("/documents")
def get_documents():

    documents = []

    for file_path in sorted(
        DOCUMENTS_DIR.glob("*.pdf")
    ):

        documents.append({
            "name": file_path.name,
            "type": "PDF",
            "size": file_path.stat().st_size,
        })


    return {
        "count": len(documents),
        "documents": documents,
    }