# 🎬 Movie Recommendations (Netflix + Disney+)

The purpose of this **personal project** is to review and strengthen knowledge in **recommendation systems, natural language processing (NLP), and data analysis**.  
To practice an **end-to-end workflow**—including **data preprocessing, text embedding, vector-based similarity search**, and **building a backend API and user interface**—the project leverages real-world data from streaming platforms (**Netflix** and **Disney+**).

The development process focuses on gaining a deeper understanding of the **design and operation of a content-based recommendation system** by applying widely used tools and techniques.  
Feedback and suggestions for improvement are highly appreciated.

---

## 📌 Summary

This project delivers a **content-based recommendation system** for the Netflix and Disney+ catalogs.  
Users can:

- Select titles they like (seed items)
- Apply filters (platform, type, country, release year)
- Receive similar titles based on **sentence embeddings** and **FAISS nearest-neighbor search**

---

## ❓ Problem & Solution

### Problem
- Large content catalogs make it difficult to discover relevant new titles.
- Public APIs provide limited support for customized filtering and similarity search.

### Solution
- Clean and normalize raw Netflix + Disney datasets into a unified format.
- Encode title metadata using **`sentence-transformers`** to generate dense embeddings.
- Build a **FAISS index** for fast similarity retrieval.
- Provide a unified **API + UI** that allows users to filter, select seed titles, and fetch recommendations.

---

## 🏗️ Architecture & Flow

### 1️⃣ Data Pipeline (`pipeline/`)

- **`preprocess.py`**  
  Merges Netflix and Disney CSV files, normalizes text fields, extracts genre/country lists, and builds a unified `search_text`.

- **`embedder.py`**  
  Encodes `search_text` using the `all-MiniLM-L6-v2` model and outputs:
  - `title_embeddings.npy`
  - `titles_metadata.parquet`

- **`indexer.py`**  
  Builds the FAISS index (`titles_faiss.index`) and writes an index manifest.

> All generated outputs are stored in **`artifacts/`** and consumed directly by the backend.

---

### 2️⃣ Backend (`backend/`)

- Built with **FastAPI**
- Key endpoints:
  - `GET /api/titles` — returns titles matching applied filters
  - `POST /api/recommend` — accepts seed IDs + filters and returns recommendations (similarity scores)

- **`recommender_core.py`**  
  Loads embeddings, metadata, and FAISS index; applies filters; queries nearest neighbors; formats responses.

---

### 3️⃣ Frontend (`frontend/`)

- Built with **React + TypeScript + Fluent UI**
- Pages:
  - **Home** — hero section with filter dialog
  - **Results** — grid of filtered titles, seed selection, and recommendation count
  - **Recommendations** — final recommendation list

- State management via **Zustand**:
  - `filters`
  - `filteredTitles`
  - `selectedSeedIds`
  - `recommendations`

---

## 🧰 Key Technologies

- **Languages**
  - Python 3.12 (pipeline, backend)
  - TypeScript (frontend)

- **Libraries & Frameworks**
  - FastAPI, Uvicorn
  - Pandas, NumPy
  - FAISS
  - sentence-transformers
  - React, Vite, Fluent UI

- **Vector Store**
  - FAISS `IndexFlatIP` (cosine similarity)

- **State Management**
  - Zustand

- **Containerization**
  - `Dockerfile.backend`
  - `frontend/Dockerfile`
  - `docker-compose.yml`

---

## 🗂️ Data Preparation

### 1️⃣ Place raw datasets
```text
Movie_DA/
├── netflix_titles.csv
└── disney_plus_titles.csv
```
### 2️⃣ Run the pipeline

  python pipeline/preprocess.py
  python pipeline/embedder.py
  python pipeline/indexer.py

### 3️⃣ Expected outputs (artifacts/)
```text
artifacts/
├── titles_clean.parquet
├── titles_clean.csv
├── title_embeddings.npy
├── titles_metadata.parquet
├── titles_faiss.index
└── index_manifest.json
```
### ▶️ Manual Run (Local)
 ## Backend
  ```text
  cd backend
  python -m venv .venv
  source .venv/bin/activate        # Windows: .venv\Scripts\activate
  pip install -r requirements.txt
  uvicorn backend.app:app --reload

  - API: http://127.0.0.1:8000
```
  ## Frontend
  ```text
  cd frontend
  npm install
  npm run dev -- --host 0.0.0.0 --port 5173

  - UI: http://127.0.0.1:5173
  - Ensure VITE_API_BASE_URL points to the backend URL.
```

## User Flow:
Open UI → apply filters → view Results → select seeds → click Recommend → view Recommendations

### 🐳 Docker Compose
## Requirements

- artifacts/ must already exist (not version-controlled)

## Configuration

- Backend: Dockerfile.backend
- Frontend: frontend/Dockerfile
- API base URL: http://localhost:8000

## Build & Run
- docker compose up --build

## Access

- Frontend: http://localhost:5173
- API: http://localhost:8000/api/...

### 📁 Project Structure
```text
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
  ├── artifacts/        # generated outputs (not tracked)
  ├── Movie_DA/         # raw datasets (not tracked)
  ├── Dockerfile.backend
  ├── docker-compose.yml
  └── .gitignore
```

### 🚀 Deployment Notes

- Do not commit Movie_DA/ and artifacts/; provide instructions or download links instead.
- When updating filter schemas, ensure pipeline, backend, and frontend are updated consistently.
- Set VITE_API_BASE_URL to a browser-accessible host.
- For production, consider building the frontend (npm run build) and serving dist/ via the backend or a reverse proxy.
