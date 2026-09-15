# PRORAG

**PRORAG** is a full-stack Retrieval-Augmented Generation (RAG) knowledge assistant that allows users to upload PDF documents and ask questions based on their content.

The system retrieves relevant document passages using semantic search and generates grounded answers with numbered source citations.

## Architecture

```text
PDF Upload
    ↓
PyPDFLoader
    ↓
Text Chunking
    ↓
MiniLM Embeddings
    ↓
FAISS Vector Store
    ↓
Semantic Retrieval (Top-K)
    ↓
Claude Sonnet 4.5 via OmniRoute
    ↓
Grounded Answer + Citations
```

## Features

- PDF document upload and indexing
- Automatic text extraction and chunking
- Local sentence-transformer embeddings
- FAISS semantic vector search
- Top-K document retrieval
- RAG-based question answering
- Grounded responses using retrieved context
- Numbered source citations `[1]`, `[2]`, `[3]`
- Source inspection with filename, page and FAISS distance
- Real document library
- Light and dark interface
- FastAPI REST API
- Interactive Swagger API documentation

## Tech Stack

### Frontend
- React
- Vite
- Tailwind CSS
- Lucide React

### Backend
- Python 3.12
- FastAPI
- Pydantic
- LangChain

### RAG Pipeline
- PyPDFLoader
- RecursiveCharacterTextSplitter
- Sentence Transformers
- `all-MiniLM-L6-v2`
- 384-dimensional embeddings
- FAISS

### LLM
- Claude Sonnet 4.5
- OmniRoute OpenAI-compatible API

## Retrieval Configuration

| Setting | Value |
|---|---|
| Vector Store | FAISS |
| Embedding Model | all-MiniLM-L6-v2 |
| Embedding Dimensions | 384 |
| Top-K | 3 |
| Chunk Size | 1000 |
| Chunk Overlap | 200 |
| LLM | Claude Sonnet 4.5 |
| Citations | Enabled |

## Project Structure

```text
PRORAG/
├── backend/
│   ├── app/
│   │   ├── ingestion/
│   │   ├── embeddings/
│   │   ├── vectorstore/
│   │   ├── retrieval/
│   │   ├── generation/
│   │   ├── rag/
│   │   └── api.py
│   ├── tests/
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── data/
└── README.md
```

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Check API status |
| POST | `/upload` | Upload and index a PDF |
| GET | `/documents` | List uploaded documents |
| POST | `/ask` | Ask questions using RAG |

## Running Locally

### Backend

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
uvicorn app.api:app --reload
```

Backend:

```text
http://127.0.0.1:8000
```

Swagger documentation:

```text
http://127.0.0.1:8000/docs
```

### Frontend

Open another terminal:

```powershell
cd frontend
npm install
npm run dev
```

Frontend:

```text
http://localhost:5173
```

> OmniRoute must be running locally for LLM generation.

## How It Works

1. A user uploads a PDF.
2. PRORAG extracts the document text.
3. The text is divided into overlapping chunks.
4. MiniLM converts the chunks into vector embeddings.
5. FAISS stores and searches the vectors.
6. The most relevant chunks are retrieved for a question.
7. Claude receives only the retrieved context with the question.
8. The generated answer includes numbered citations corresponding to retrieved sources.

## Current Scope

PRORAG currently focuses on a clean and understandable RAG implementation using PDF ingestion, semantic retrieval, FAISS and grounded LLM generation.

Future improvements can include hybrid retrieval, reranking, additional document formats, streaming responses and deployment.

## Author

**Rishab Kumar Giri**

GitHub: [rishabgiri68](https://github.com/rishabgiri68)