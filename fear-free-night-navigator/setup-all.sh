#!/bin/bash

# Fear-Free Night Navigator — Automated Setup Script
# This removes ALL red dots by installing all dependencies

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║   Fear-Free Night Navigator — Automated Setup                ║"
echo "║   Removing Red Dots by Installing All Dependencies           ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Navigate to project
cd /home/nikhil/Desktop/big_code/fear-free-night-navigator || exit 1

# Step 1: Root dependencies
echo "📦 Step 1/7: Installing root dependencies..."
npm install --silent || exit 1
echo "✅ Root dependencies installed"
echo ""

# Step 2: Backend dependencies
echo "📦 Step 2/7: Installing backend dependencies..."
cd backend || exit 1
npm install --silent || exit 1
echo "✅ Backend dependencies installed"
cd .. || exit 1
echo ""

# Step 3: Frontend dependencies
echo "📦 Step 3/7: Installing frontend dependencies..."
cd frontend || exit 1
npm install --silent || exit 1
echo "✅ Frontend dependencies installed"
cd .. || exit 1
echo ""

# Step 4: ML virtual environment
echo "🐍 Step 4/7: Setting up Python virtual environment..."
cd ml || exit 1
python3 -m venv venv || exit 1
echo "✅ Python virtual environment created"
echo ""

# Step 5: ML dependencies
echo "📦 Step 5/7: Installing ML dependencies..."
source venv/bin/activate || exit 1
pip install -r requirements.txt -q || exit 1
echo "✅ ML dependencies installed"
echo ""

# Step 6: Generate ML dataset
echo "🤖 Step 6/7: Generating ML dataset..."
python3 generate_dataset.py > /dev/null 2>&1 || exit 1
echo "✅ ML dataset generated (dataset.csv)"
echo ""

# Step 7: Train ML model
echo "🤖 Step 7/7: Training ML model..."
python3 train.py > /dev/null 2>&1 || exit 1
echo "✅ ML model trained (model.pkl)"
echo ""

# Deactivate venv
deactivate 2>/dev/null || true

# Return to root
cd .. || exit 1

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                    ✅ ALL SETUP COMPLETE!                    ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "🎉 SUCCESS! All red dots should now be GONE!"
echo ""
echo "What was installed:"
echo "  ✅ Backend dependencies (Express, TypeScript, Jest, etc)"
echo "  ✅ Frontend dependencies (React, Vite, Tailwind, etc)"
echo "  ✅ ML dependencies (Flask, LightGBM, scikit-learn, etc)"
echo "  ✅ ML dataset (2000 samples)"
echo "  ✅ ML model (trained LightGBM)"
echo ""
echo "Next steps:"
echo "  1. Verify no red dots in VS Code"
echo "  2. Run: npm run dev"
echo "  3. Open: http://localhost:5173"
echo ""
