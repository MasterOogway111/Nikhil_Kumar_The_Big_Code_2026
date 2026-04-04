# Fear-Free Night Navigator — Agent Implementation Plan

## Overview
Stack: React (TypeScript) · Node.js + Express (TypeScript) · MongoDB (local) · Python ML sidecar (Flask)

This plan divides the project into **20 discrete, sequential, verifiable steps** that can be executed by an agent.

---

## Part 1: Project Initialization & Environment Setup

### Step 1: Initialize Git Repository & Root Structure
**Deliverable:** Git repo initialized, root package.json with concurrently
**Commands:**
```bash
mkdir fear-free-night-navigator && cd fear-free-night-navigator
git init
npm init -y
npm install -D concurrently
```
**File to create:** `package.json` with dev script
**Verification:** `npm run dev` command should be available

---

### Step 2: Create Backend Directory & TypeScript Config
**Deliverable:** Backend folder with npm packages and tsconfig.json
**Steps:**
- Create `/backend` directory
- Run `npm init -y` in backend
- Install: `express mongoose axios dotenv helmet morgan cors`
- Install dev: `typescript ts-node-dev @types/express @types/node @types/cors @types/morgan jest supertest @types/jest @types/supertest ts-jest`
- Generate `tsconfig.json`
- Create `.env` with PORT, MONGO_URI, GOOGLE_MAPS_API_KEY, ML_SIDECAR_URL
**Verification:** `npx tsc --version` works in backend

---

### Step 3: Create Frontend Directory & Vite Setup
**Deliverable:** Frontend with React + TypeScript + Vite
**Steps:**
- Create `/frontend` directory
- Run `npm create vite@latest . -- --template react-ts`
- Install: `axios zustand @googlemaps/js-api-loader recharts`
- Install dev: `tailwindcss postcss autoprefixer`
- Run `npx tailwindcss init -p`
- Create `.env` with VITE_BACKEND_URL, VITE_GOOGLE_MAPS_KEY
**Verification:** Frontend structure is ready

---

### Step 4: Create ML Directory & Python Environment
**Deliverable:** ML folder with virtual environment & requirements.txt
**Steps:**
- Create `/ml` directory
- Create `requirements.txt` with: flask, lightgbm, scikit-learn, numpy, pandas, joblib
- Create Python venv: `python -m venv venv`
- Create `.gitignore` in ml folder (venv, *.pkl, dataset.csv)
**Verification:** `venv/bin/python --version` works (or `source venv/bin/activate`)

---

## Part 2: ML Model Development

### Step 5: Create ML Dataset Generator
**Deliverable:** `ml/generate_dataset.py` that creates synthetic data
**File:** `ml/generate_dataset.py`
**Input:** None (generates 2000 samples)
**Output:** `ml/dataset.csv`
**Verification:** Run and check dataset.csv has 2001 rows (header + 2000 data rows)

---

### Step 6: Create ML Model Trainer
**Deliverable:** `ml/train.py` that trains LightGBM model
**File:** `ml/train.py`
**Steps:**
- Load dataset.csv
- Split 70/15/15 train/val/test
- Train LightGBM with specified hyperparams
- Save as `model.pkl`
- Print MAE score
**Verification:** Run generates `model.pkl` and outputs MAE < 0.05

---

### Step 7: Create ML Model Evaluator
**Deliverable:** `ml/evaluate.py` for metrics validation
**File:** `ml/evaluate.py`
**Outputs:**
- MAE on full dataset
- Spearman rank correlation
- Feature importances
**Verification:** Run shows all metrics

---

### Step 8: Create Flask ML Sidecar
**Deliverable:** `ml/app.py` with /predict and /health endpoints
**Endpoints:**
- POST `/predict` — accepts feature dict, returns risk_score
- GET `/health` — returns status ok
**Rules in /predict:**
- Apply rule-based adjustments
- Handle missing features gracefully
**Verification:** Flask server starts on port 5001

---

## Part 3: Backend Database & Models

### Step 9: Create MongoDB Connection Config
**Deliverable:** `backend/src/config/db.ts`
**Handles:** Connection to MongoDB, error handling
**Verification:** Can connect to mongodb://localhost:27017/fearfree

---

### Step 10: Create Segment Model
**Deliverable:** `backend/src/models/Segment.ts`
**Schema:**
- segmentId (string, unique, indexed)
- polyline (string)
- features (object with 6 feature fields)
- risk_score (number)
- uncertainty (number)
- cached_at (Date, TTL: 24h)
**Verification:** Model compiles, has proper types

---

### Step 11: Create Route Model
**Deliverable:** `backend/src/models/Route.ts`
**Schema:**
- origin, destination (string)
- fastest, safest (objects with avg_risk, duration_seconds, segments[])
- created_at (Date)
**Verification:** Model compiles

---

## Part 4: Backend Services & Utilities

### Step 12: Create Google Maps Service
**Deliverable:** `backend/src/services/googleMaps.ts`
**Functions:**
- `fetchRouteAlternatives(origin, destination)` → returns SegmentData[][]
- `fetchPOIDensity(lat, lng)` → returns 0–1 or -1
**Verification:** Functions export properly, handle API structure

---

### Step 13: Create Segment Scorer Service
**Deliverable:** `backend/src/services/segmentScorer.ts`
**Functions:**
- `scoreSegment(segmentId, polyline, features)` → calls ML sidecar, caches to MongoDB
- Fallback: returns conservative defaults if ML unreachable
- Caching: checks MongoDB before calling ML
**Verification:** Caching logic works, fallback activates on timeout

---

### Step 14: Create Graph Router (Dijkstra)
**Deliverable:** `backend/src/services/graphRouter.ts`
**Exports:**
- Types: GraphNode, GraphEdge
- `dijkstra(nodes, edges, startId, endId, lambda)` → returns path & cost
- Cost function: λ1*risk + λ2*time_norm + λ3*uncertainty
**Verification:** Algorithm compiles, types are correct

---

## Part 5: Backend Controllers & Routes

### Step 15: Create Route Controller
**Deliverable:** `backend/src/controllers/routeController.ts`
**Function:** `computeRoutes(req, res)`
**Logic:**
1. Get alternatives from Google Maps
2. Score each segment (fetching POI data)
3. Return fastest & safest routes
**Verification:** Function compiles, handles errors

---

### Step 16: Create Segment Controller
**Deliverable:** `backend/src/controllers/segmentController.ts`
**Function:** `scoreOne(req, res)`
**Logic:** Score a single segment, return risk_score & uncertainty
**Verification:** Function compiles

---

### Step 17: Create Express Routes
**Deliverable:** Create all 4 route files:
- `backend/src/routes/health.ts` — GET /health
- `backend/src/routes/route.ts` — POST /route
- `backend/src/routes/segmentScore.ts` — POST /segment-score
- `backend/src/routes/explain.ts` — GET /explain/:segmentId
**Verification:** All routes exist and export properly

---

### Step 18: Create Middleware & Main App
**Deliverable:**
- `backend/src/middleware/errorHandler.ts`
- Update `backend/src/app.ts` with all middleware, routes, DB connection
**Verification:** `npm run dev` starts backend on port 4000

---

## Part 6: Frontend Components & Store

### Step 19: Create Frontend Types, Store & API Client
**Deliverables:**
1. `frontend/src/types/index.ts` — Type definitions
2. `frontend/src/store/routeStore.ts` — Zustand store
3. `frontend/src/api/client.ts` — Axios API calls

**Verification:** All imports resolve, types are used correctly

---

### Step 20: Create Frontend Components (Iterative)
**Deliverable:** Build components in this order:
1. MapView.tsx — Google Maps with polyline overlays
2. LocationInput.tsx — Search inputs + night toggle
3. RouteComparison.tsx — Fastest vs Safest buttons
4. SafetySlider.tsx — λ weight slider
5. ExplanationPanel.tsx — Risk explanations
6. App.tsx — Main layout

**Verification:** Each compiles, imports resolve, no TypeScript errors

---

## Part 7: Testing & Validation

### Step 21: Create & Run Backend Tests
**Files:**
- `backend/jest.config.ts`
- `backend/src/__tests__/health.test.ts`
- `backend/src/__tests__/route.test.ts`
- `backend/src/__tests__/segmentScore.test.ts`

**Verification:** `npm test` passes all 6+ test cases

---

### Step 22: Create & Run ML Tests
**File:** `ml/test_model.py`
**Tests:**
- Predictions in [0, 1]
- High isolation → high risk
- Busy area → low risk

**Verification:** `python test_model.py` passes all tests

---

## Part 8: Integration & End-to-End

### Step 23: Verify Concurrent Startup
**Command:** `npm run dev` from root
**Checks:**
- Backend starts on :4000 ✓
- ML sidecar starts on :5001 ✓
- Frontend starts on :5173 ✓
- No port conflicts

**Verification:** All three services running simultaneously

---

### Step 24: End-to-End Test & Metrics Collection
**Steps:**
1. Open frontend in browser
2. Enter: Origin = "Connaught Place, Delhi", Destination = "India Gate, Delhi"
3. Toggle night-time checkbox
4. Click "Find Safe Route"
5. Verify:
   - Map loads with polylines
   - Both fastest & safest routes displayed
   - Risk scores visible
   - Can click segments for explanation

**Metrics to log:**
- Model MAE (from evaluate.py output)
- Rank correlation (from evaluate.py output)
- Route risk reduction %
- ETA tradeoff in minutes
- Response time for route computation

**Verification:** All 6 metrics collected, documented

---

## Execution Checklist

```
PHASE 1: SCAFFOLDING
─────────────────────────────────────────────────────────────
[✓] Step 1  — Root package.json + Git
[✓] Step 2  — Backend directory + TypeScript
[✓] Step 3  — Frontend directory + Vite
[✓] Step 4  — ML directory + Python venv

PHASE 2: ML MODEL
─────────────────────────────────────────────────────────────
[✓] Step 5  — generate_dataset.py
[✓] Step 6  — train.py
[✓] Step 7  — evaluate.py
[✓] Step 8  — ml/app.py (Flask sidecar)

PHASE 3: BACKEND MODELS
─────────────────────────────────────────────────────────────
[✓] Step 9  — MongoDB config
[✓] Step 10 — Segment model
[✓] Step 11 — Route model

PHASE 4: BACKEND SERVICES
─────────────────────────────────────────────────────────────
[✓] Step 12 — Google Maps service
[✓] Step 13 — Segment scorer service
[✓] Step 14 — Graph router (Dijkstra)

PHASE 5: BACKEND API
─────────────────────────────────────────────────────────────
[✓] Step 15 — Route controller
[✓] Step 16 — Segment controller
[✓] Step 17 — Route handlers
[✓] Step 18 — Middleware + Express app

PHASE 6: FRONTEND
─────────────────────────────────────────────────────────────
[✓] Step 19 — Types + store + API client
[✓] Step 20 — UI components (MapView, LocationInput, etc.)

PHASE 7: TESTING
─────────────────────────────────────────────────────────────
[✓] Step 21 — Backend Jest tests
[✓] Step 22 — ML validation tests

PHASE 8: INTEGRATION
─────────────────────────────────────────────────────────────
[✓] Step 23 — Concurrent startup verification
[✓] Step 24 — End-to-end test + metrics
```

---

## Success Criteria

After completing all 24 steps:

| Criteria | Status |
|---|---|
| All 3 services start with `npm run dev` | ✓ |
| Backend at http://localhost:4000 | ✓ |
| ML sidecar at http://localhost:5001 | ✓ |
| Frontend at http://localhost:5173 | ✓ |
| All Jest tests pass (6+) | ✓ |
| All ML tests pass (3) | ✓ |
| Model MAE < 0.05 | ✓ |
| Rank correlation > 0.90 | ✓ |
| Routes computed with risk reduction > 0% | ✓ |
| UI renders map + routes + explanations | ✓ |

---

## Notes for Agent Implementation

1. **Always verify each step** before moving to the next — don't assume
2. **Check for errors** after file creation (use get_errors tool)
3. **Test imports** — use read_file to verify syntax after writing
4. **Environment variables** — set .env files before starting services
5. **Database** — ensure MongoDB is running locally before backend tests
6. **API Keys** — use placeholder values initially; actual Google Maps key needed for full testing
7. **Python activation** — remember to activate venv before running ml scripts
8. **Port conflicts** — verify all ports (4000, 5001, 5173, 27017) are free

---

## Estimated Time (per step)

- Steps 1–4: ~10 min (scaffolding)
- Steps 5–8: ~20 min (ML model)
- Steps 9–11: ~10 min (DB models)
- Steps 12–14: ~15 min (services)
- Steps 15–18: ~20 min (controllers + routes)
- Steps 19–20: ~30 min (frontend)
- Steps 21–22: ~15 min (testing)
- Steps 23–24: ~15 min (integration)

**Total: ~2 hours for complete implementation**

