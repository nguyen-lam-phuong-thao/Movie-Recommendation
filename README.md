# Movie Recommendations (Netflix + Disney+)
The purpose of this **personal project** is to review and strengthen knowledge in recommendation systems, natural language processing (NLP), and data analysis.  
In order to practice an end-to-end workflow, including **data preprocessing, text embedding, vector-based similarity search** and **building a backend API and user interface**, the project makes use of real-world data from streaming platforms (Netflix & Disney+).

The goal of the development process is to gain a better understanding of the design and operation of a **content-based recommendation system** by using widely used tools and techniques.  
We greatly value comments and recommendations for enhancements.

## Summary
This project delivers a content-based recommendation system for the Netflix + Disney+ catalog. Users can pick titles they like, apply filters (platform/type/country/year), and receive similar titles based on sentence embeddings and FAISS nearest-neighbor search.

## Problem & Solution
- **Problem**: Navigating large catalogs to find new titles is hard; public APIs don’t provide customized filters.
- **Solution**:
  - Clean/normalize raw Netflix + Disney datasets and build a consolidated search text.
  - Encode titles using `sentence-transformers` to produce dense embeddings.
  - Build a FAISS index to retrieve similar titles quickly.
  - Provide API + UI so users can filter, select seeds, and fetch recommendations within a single interface.

## Architecture & Flow
1. **Pipeline** (`pipeline/`)
   - `preprocess.py`: merges Netflix/Disney CSVs, normalizes text fields, extracts genre/country lists, builds `search_text`.
   - `embedder.py`: encodes search_text via `all-MiniLM-L6-v2`, outputs `title_embeddings.npy` and `titles_metadata.parquet`.
   - `indexer.py`: builds the FAISS index (`titles_faiss.index`) and writes a manifest.
   - Artifacts are written into `artifacts/` and consumed by the backend.

2. **Backend** (`backend/`)
   - FastAPI (`app.py`) exposing:
     - `GET /api/titles`: list titles matching filters.
     - `POST /api/recommend`: takes seed IDs + filters → returns recommendations (score hidden).
   - `recommender_core.py`: loads embeddings/metadata/index, applies filters, queries FAISS, formats output.

3. **Frontend** (`frontend/`)
   - React + TypeScript + Fluent UI.
   - Home page hero with filter dialog.
   - Results page: card grid, seed selection, “number of recommendations” control.
   - Recommendations page: final list with navigation.
   - State management via Zustand (`filters`, `filteredTitles`, `selectedSeedIds`, `recommendations`).

## Key Technologies
- **Languages**: Python 3.12 (backend/pipeline), TypeScript (frontend).
- **Libraries**: FastAPI, Uvicorn, Pandas, NumPy, FAISS, sentence-transformers, React, Vite, Fluent UI.
- **Vector store**: FAISS `IndexFlatIP`.
- **State management**: Zustand.
- **Containerization**: `Dockerfile.backend`, `frontend/Dockerfile`, `docker-compose.yml`.

## Data Preparation
1. Place raw CSVs in `Movie_DA/netflix_titles.csv` and `Movie_DA/disney_plus_titles.csv`.
2. Run pipeline scripts:
   ```bash
   python pipeline/preprocess.py
   python pipeline/embedder.py
   python pipeline/indexer.py

3. After completion, artifacts/ should contain:
   titles_clean.parquet, titles_clean.csv
   title_embeddings.npy
   titles_metadata.parquet
   titles_faiss.index
   index_manifest.json
   
## Manual Run (local)
1. Backend
  cd backend
  python -m venv .venv && source .venv/bin/activate
  pip install -r requirements.txt
  uvicorn backend.app:app --reload
  API: http://127.0.0.1:8000.

2. Frontend
  cd frontend
  npm install
  npm run dev -- --host 0.0.0.0 --port 5173
  UI: http://127.0.0.1:5173 (ensure VITE_API_BASE_URL points to the backend URL).

3. Open the UI, apply filters → Results → select seeds → Recommend → view Recommendations.

## Docker Compose

1. Ensure artifacts/ is available (not version-controlled).
2. Docker Compose references:
  - Backend: Dockerfile.backend
  - Frontend: frontend/Dockerfile
  - localhost (line 8000)
3. Launch:
    docker compose up --build
4. Access:
  Frontend: http://localhost:5173
  API: http://localhost:8000/api/...

## Project Structure
    Week 6/
    ├── backend/
    │   ├── app.py
    │   ├── recommender_core.py
    │   ├── schemas.py
    │   ├── recommender.py
    │   ├── settings.py
    │   └── requirements.txt
    ├── frontend/
    │   ├── src/
    │   ├── package.json
    │   └── Dockerfile
    ├── pipeline/
    │   ├── preprocess.py
    │   ├── embedder.py
    │   └── indexer.py
    ├── artifacts/      # generated artifacts (not tracked)
    ├── Movie_DA/       # raw data (not tracked)
    ├── Dockerfile.backend
    ├── docker-compose.yml
    └── .gitignore
    
## Deployment Notes
- Don’t commit Movie_DA/ and artifacts/; provide instructions or download links for others to generate them.
- When changing filter schema, update pipeline + backend + frontend consistently.
- Set VITE_API_BASE_URL to a host the browser can reach (http://localhost:8000, production domain, etc.).
- For production, consider building the frontend (npm run build) and serving dist/ via backend or a reverse proxy.
