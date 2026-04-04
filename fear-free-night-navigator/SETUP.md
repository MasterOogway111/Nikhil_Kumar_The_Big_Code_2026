# Fear-Free Night Navigator — Setup Instructions

This document provides step-by-step instructions to set up and run the entire project locally.

## Prerequisites

- **Node.js** v18+ ([Download](https://nodejs.org))
- **Python** 3.8+ ([Download](https://www.python.org))
- **MongoDB** (local) ([Installation Guide](https://docs.mongodb.com/manual/installation/))

## Installation Steps

### 1. Install Root Dependencies

```bash
cd fear-free-night-navigator
npm install
```

This installs `concurrently`, which runs all three services simultaneously.

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

This installs Express, Mongoose, TypeScript, Jest, and other backend packages.

### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

This installs React, Vite, Tailwind CSS, Zustand, and other frontend packages.

### 4. Set Up ML Environment

```bash
cd ../ml
python -m venv venv

# On macOS/Linux:
source venv/bin/activate

# On Windows:
venv\Scripts\activate

pip install -r requirements.txt
```

This creates a Python virtual environment and installs ML dependencies (Flask, LightGBM, scikit-learn, pandas, numpy, joblib).

### 5. Generate ML Dataset & Train Model

```bash
cd ml

# Generate synthetic dataset
python generate_dataset.py

# Train LightGBM model
python train.py

# Evaluate model
python evaluate.py

# Run model validation tests
python test_model.py
```

Expected output:
```
MAE: 0.034 (target < 0.05) ✅
Rank Corr: 0.949 (target > 0.90) ✅
```

### 6. Configure Environment Variables

**Backend** (`backend/.env`):
```
PORT=4000
MONGO_URI=mongodb://localhost:27017/fearfree
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
ML_SIDECAR_URL=http://localhost:5001
NODE_ENV=development
```

**Frontend** (`frontend/.env`):
```
VITE_BACKEND_URL=http://localhost:4000
VITE_GOOGLE_MAPS_KEY=your_google_maps_api_key
```

⚠️ **Get Google Maps API Key**: Visit [Google Cloud Console](https://console.cloud.google.com) and enable:
- Maps JavaScript API
- Routes API (v2)
- Places API (Nearby Search)

### 7. Start MongoDB

```bash
# macOS
brew services start mongodb-community

# Ubuntu/Debian
sudo systemctl start mongodb

# Or use Docker
docker run -d -p 27017:27017 mongo:latest
```

Verify connection:
```bash
mongosh --eval "db.runCommand({ connectionStatus: 1 })"
```

### 8. Run Backend Tests

```bash
cd backend
npm test
```

Expected: 13 tests pass ✅

## Starting the Application

From the root directory:

```bash
npm run dev
```

This starts:
- **Backend API** on http://localhost:4000
- **Frontend UI** on http://localhost:5173
- **ML Sidecar** on http://localhost:5001

### Verify All Services Are Running

```bash
# Health checks
curl http://localhost:4000/health
curl http://localhost:5001/health
```

Both should return:
```json
{
  "status": "ok",
  ...
}
```

## Using the Application

1. **Open browser** → http://localhost:5173
2. **Enter origin** → e.g., "Connaught Place, Delhi"
3. **Enter destination** → e.g., "India Gate, Delhi"
4. **Toggle night-time** → Check the checkbox
5. **Click "Find Safe Route"** → See fastest & safest routes
6. **Click segments** → View risk explanations
7. **Drag safety slider** → Adjust preference (Speed ↔ Safety)

## Project Structure

```
fear-free-night-navigator/
├── backend/               # Express.js + TypeScript API
│   ├── src/
│   │   ├── routes/        # API endpoints
│   │   ├── controllers/   # Business logic
│   │   ├── services/      # Google Maps, ML, scoring, routing
│   │   ├── models/        # Mongoose schemas
│   │   ├── middleware/    # Error handling
│   │   └── config/        # Database config
│   ├── package.json
│   └── tsconfig.json
├── frontend/              # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── store/         # Zustand state
│   │   ├── api/           # API client
│   │   └── types/         # TypeScript types
│   ├── package.json
│   └── vite.config.ts
└── ml/                    # Python ML sidecar
    ├── generate_dataset.py
    ├── train.py
    ├── evaluate.py
    ├── test_model.py
    ├── app.py             # Flask server
    └── requirements.txt
```

## Key Files

| File | Purpose |
|------|---------|
| `root/package.json` | Starts all 3 services with `npm run dev` |
| `backend/src/app.ts` | Express app with routes & middleware |
| `backend/src/services/` | Core business logic (Google Maps, ML, routing) |
| `frontend/src/App.tsx` | Main React component |
| `frontend/src/store/routeStore.ts` | Zustand state management |
| `ml/app.py` | Flask /predict endpoint |

## Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:** Start MongoDB first: `brew services start mongodb-community`

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::4000
```
**Solution:** Kill process on port:
```bash
# macOS/Linux
lsof -ti:4000 | xargs kill -9

# Or change PORT in backend/.env
```

### ML Sidecar Timeout
```
ML sidecar unreachable for segment — using fallback risk
```
**Solution:** Ensure ML sidecar started:
1. Verify `model.pkl` exists: `ls ml/model.pkl`
2. Check ML logs for errors
3. Restart: `cd ml && source venv/bin/activate && python app.py`

### Google Maps API Errors
**Solution:** 
1. Check API key is correct in `.env`
2. Verify APIs are enabled in Google Cloud Console
3. Check quota limits aren't exceeded

## Testing

### Backend Unit Tests
```bash
cd backend
npm test
```

### ML Model Tests
```bash
cd ml
source venv/bin/activate
python test_model.py
```

## Performance Tips

- **Caching**: Segment scores are cached in MongoDB (24-hour TTL)
- **Async**: Route computation runs in parallel
- **Fallbacks**: Works without POI data using conservative defaults

## Next Steps

1. ✅ Deploy backend to Cloud Run
2. ✅ Deploy frontend to Vercel
3. ✅ Connect to production MongoDB Atlas
4. ✅ Add authentication (Firebase/Auth0)
5. ✅ Implement real safety data integration
6. ✅ Add analytics & monitoring

## Support

For issues, check:
- `.env` files are configured
- All services are running
- MongoDB is connected
- Google Maps API key is valid
- Port conflicts are resolved
