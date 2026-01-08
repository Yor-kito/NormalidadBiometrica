#!/bin/bash
echo "Setting up Biometric Analysis App..."

# Backend Setup
echo "Installing Backend Dependencies..."
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..

# Frontend Setup (Instructions)
echo "------------------------------------------------"
echo "Backend ready."
echo "To start the Backend:"
echo "  cd backend"
echo "  source venv/bin/activate"
echo "  uvicorn main:app --reload"
echo ""
echo "To start the Frontend (requires Node.js):"
echo "  cd frontend"
echo "  npm install"
echo "  npm run dev"
echo "------------------------------------------------"
