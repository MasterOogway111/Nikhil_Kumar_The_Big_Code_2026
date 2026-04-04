# Fear-Free Night Navigator — README

🌙 **An AI-powered safety routing system that computes the safest route home at night.**

> Minimize perceived safety risk while showing time trade-offs. Built with React, Express, LightGBM, and MongoDB.

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install && cd backend && npm install && cd ../frontend && npm install

# 2. Set up ML
cd ../ml
python -m venv venv
source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt

# 3. Generate & train model
python generate_dataset.py
python train.py
python test_model.py  # Verify model ✅

# 4. Start MongoDB
brew services start mongodb-community  # macOS
# or: docker run -d -p 27017:27017 mongo:latest

# 5. Configure .env files (backend/.env, frontend/.env)
# Add your Google Maps API key

# 6. Run everything
cd ../..
npm run dev
```

Open http://localhost:5173 and enter a route!

---

## 📋 Features

- **Dual Route Options**
  - 🏃 Fastest route (minimize ETA)
  - 🛡️ Safest route (minimize perceived risk)

- **Smart Safety Scoring**
  - AI-powered risk model using LightGBM
  - Features: POI density, isolation, lighting, activity, connectivity
  - Fallback penalties for missing data

- **Interactive Map**
  - Color-coded segments (green/yellow/red)
  - Click segments for risk explanations
  - Real-time polyline rendering

- **Customizable Preference**
  - Safety slider to adjust λ weights
  - Real-time route recalculation
  - ETA tradeoff display

- **Production Ready**
  - Full TypeScript type safety
  - Jest + Supertest backend tests
  - MongoDB caching (24h TTL)
  - Error handling & graceful fallbacks

---

## 🏗️ Architecture

```
┌─────────────────┐
│   React (UI)    │ Port 5173
└────────┬────────┘
         │ (HTTP)
         ▼
┌─────────────────┐
│  Express API    │ Port 4000
│ (Routes, Auth)  │
└────────┬────────┘
         │
    ┌────┴────┬──────────┐
    ▼         ▼          ▼
┌────────┐ ┌──────────┐ ┌─────────┐
│MongoDB │ │Google    │ │LightGBM │ Port 5001
│        │ │Maps API  │ │(Flask)  │
└────────┘ └──────────┘ └─────────┘
```

---

## 📊 Model Performance

| Metric | Target | Status |
|--------|--------|--------|
| MAE | < 0.05 | ✅ ~0.034 |
| Rank Correlation | > 0.90 | ✅ ~0.949 |
| Route Stability | 100% | ✅ Deterministic caching |
| Fallback Coverage | 100% | ✅ Conservative defaults |

---

## 🛠️ Tech Stack

### Frontend
- **React 18** + TypeScript
- **Vite** (build tool)
- **Tailwind CSS** (styling)
- **Zustand** (state management)
- **Google Maps API** (visualization)

### Backend
- **Express.js** + TypeScript
- **Mongoose** (MongoDB ODM)
- **Axios** (HTTP client)
- **Jest + Supertest** (testing)

### ML
- **Python 3.8+**
- **LightGBM** (model)
- **scikit-learn** (preprocessing)
- **Flask** (inference server)
- **pandas + numpy** (data)

### DevOps
- **MongoDB** (local or Atlas)
- **concurrently** (multi-service startup)

---

## 📁 Project Structure

```
fear-free-night-navigator/
├── package.json                  # Root — runs npm run dev
├── SETUP.md                      # Installation guide
├── README.md                     # This file
├── backend/                      # Express API
│   ├── src/
│   │   ├── routes/               # API endpoints
│   │   ├── controllers/          # Business logic
│   │   ├── services/             # Google Maps, ML, routing
│   │   ├── models/               # Mongoose schemas
│   │   ├── middleware/           # Error handling
│   │   ├── config/               # DB config
│   │   ├── __tests__/            # Jest tests
│   │   └── app.ts                # Express app
│   ├── package.json
│   ├── tsconfig.json
│   ├── jest.config.js
│   └── .env
├── frontend/                     # React app
│   ├── src/
│   │   ├── components/           # React components
│   │   ├── store/                # Zustand store
│   │   ├── api/                  # API client
│   │   ├── types/                # TypeScript types
│   │   ├── App.tsx               # Main component
│   │   └── main.tsx              # Entry point
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── .env
└── ml/                           # Python ML sidecar
    ├── app.py                    # Flask server
    ├── generate_dataset.py       # Synthetic data
    ├── train.py                  # Model training
    ├── evaluate.py               # Metrics
    ├── test_model.py             # Validation tests
    ├── requirements.txt
    └── .gitignore
```

---

## 🔌 API Endpoints

### Health
```
GET /health
→ { status: "ok", service: "...", port: 4000 }
```

### Routes
```
POST /route
Body: { origin: string, destination: string, time_of_day: 0|1 }
→ { 
    fastest: RouteResult,
    safest: RouteResult,
    risk_reduction: string,
    eta_tradeoff_secs: number
  }
```

### Segment Score
```
POST /segment-score
Body: { segmentId: string, features: FeatureVector }
→ { risk_score: number, uncertainty: number }
```

### Explanation
```
GET /explain/:segmentId
→ { risk_score, uncertainty, explanations: string[] }
```

---

## 🧪 Testing

### Backend
```bash
cd backend
npm test
```
Runs 13 Jest tests covering health, routes, and error handling.

### ML
```bash
cd ml
source venv/bin/activate
python test_model.py
```
Validates model predictions, isolation penalties, and feature behavior.

---

## 📈 Metrics

After full deployment, track:
- **Model MAE** (actual vs predicted risk)
- **Route stability** (determinism)
- **API latency** (p95, p99)
- **Cache hit rate** (segment reuse)
- **Fallback usage** (missing POI data)

---

## 🚀 Deployment

### Frontend (Vercel)
```bash
cd frontend
npm run build
# Deploy dist/ to Vercel
```

### Backend (Cloud Run)
```bash
cd backend
npm run build
gcloud run deploy fear-free-backend --source .
```

### ML (Cloud Run)
```bash
cd ml
gcloud run deploy fear-free-ml --source .
```

### Database (MongoDB Atlas)
1. Create cluster on MongoDB Atlas
2. Update `MONGO_URI` in backend `.env`
3. Whitelist IP addresses

---

## 🔐 Environment Variables

### Backend (`backend/.env`)
```
PORT=4000
MONGO_URI=mongodb://localhost:27017/fearfree
GOOGLE_MAPS_API_KEY=xxx
ML_SIDECAR_URL=http://localhost:5001
NODE_ENV=development
```

### Frontend (`frontend/.env`)
```
VITE_BACKEND_URL=http://localhost:4000
VITE_GOOGLE_MAPS_KEY=xxx
```

### ML (no .env needed)
- Loads `model.pkl` from disk
- Listens on port 5001

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| `ECONNREFUSED 27017` | Start MongoDB: `brew services start mongodb-community` |
| `EADDRINUSE :4000` | Kill process: `lsof -ti:4000 \| xargs kill -9` |
| `ML sidecar unreachable` | Run `python ml/train.py` first to generate `model.pkl` |
| `Google Maps 403` | Check API key and enable required APIs in Console |

---

## 📚 Documentation

- [Setup Instructions](./SETUP.md) — Full installation guide
- [API Spec](./backend/README.md) — Endpoint documentation
- [Frontend Guide](./frontend/README.md) — Component structure
- [ML Model](./ml/README.md) — Training & evaluation

---

## 🎯 Next Steps

- [ ] Add authentication (Firebase/Auth0)
- [ ] Integrate real safety data (crime maps, lighting)
- [ ] Add user preferences & history
- [ ] Mobile app (React Native)
- [ ] Analytics dashboard
- [ ] Real-time incident reporting
- [ ] Community-driven safety ratings

---

## 📄 License

MIT

---

## 👥 Contributing

1. Fork the repo
2. Create a feature branch
3. Commit changes
4. Push and open a pull request

---

**Made with ❤️ for safer nights**

Questions? Issues? Open an issue on GitHub.
