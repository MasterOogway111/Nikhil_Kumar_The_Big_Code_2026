#!/bin/bash

# Fear-Free Night Navigator — Startup Verification Script
# This script verifies that all three services can start correctly

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   Fear-Free Night Navigator — Startup Verification        ║"
echo "║   Checking all services can initialize                    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check MongoDB
echo -n "Checking MongoDB... "
if command -v mongosh &> /dev/null; then
    if mongosh --eval "db.runCommand({ connectionStatus: 1 })" &> /dev/null; then
        echo -e "${GREEN}✅ Running${NC}"
    else
        echo -e "${RED}❌ Not running${NC}"
        echo "   Start MongoDB with: brew services start mongodb-community"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  Not installed${NC}"
    echo "   Install with: brew tap mongodb/brew && brew install mongodb-community"
fi
echo ""

# Check Node.js
echo -n "Checking Node.js... "
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ ${NODE_VERSION}${NC}"
else
    echo -e "${RED}❌ Not installed${NC}"
    exit 1
fi
echo ""

# Check Python
echo -n "Checking Python... "
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo -e "${GREEN}✅ ${PYTHON_VERSION}${NC}"
else
    echo -e "${RED}❌ Not installed${NC}"
    exit 1
fi
echo ""

# Check backend dependencies
echo -n "Checking backend dependencies... "
if [ -d "backend/node_modules" ]; then
    echo -e "${GREEN}✅ Installed${NC}"
else
    echo -e "${YELLOW}⚠️  Not installed${NC}"
    echo "   Run: cd backend && npm install"
fi
echo ""

# Check frontend dependencies
echo -n "Checking frontend dependencies... "
if [ -d "frontend/node_modules" ]; then
    echo -e "${GREEN}✅ Installed${NC}"
else
    echo -e "${YELLOW}⚠️  Not installed${NC}"
    echo "   Run: cd frontend && npm install"
fi
echo ""

# Check ML environment
echo -n "Checking ML environment... "
if [ -d "ml/venv" ] || [ -d "ml/env" ]; then
    echo -e "${GREEN}✅ Virtual env exists${NC}"
else
    echo -e "${YELLOW}⚠️  Not created${NC}"
    echo "   Run: cd ml && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt"
fi
echo ""

# Check environment files
echo "Checking environment files..."
echo -n "  backend/.env... "
if [ -f "backend/.env" ]; then
    echo -e "${GREEN}✅${NC}"
else
    echo -e "${RED}❌${NC}"
fi

echo -n "  frontend/.env... "
if [ -f "frontend/.env" ]; then
    echo -e "${GREEN}✅${NC}"
else
    echo -e "${RED}❌${NC}"
fi
echo ""

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   STARTUP VERIFICATION COMPLETE                           ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "To start all services, run:"
echo ""
echo "  npm run dev"
echo ""
echo "Services will start on:"
echo "  • Backend:  http://localhost:4000"
echo "  • Frontend: http://localhost:5173"
echo "  • ML API:   http://localhost:5001"
echo ""
