#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "Installing Python dependencies..."
pip install -r backend/requirements.txt

echo "Building React Vite frontend..."
cd frontend
npm install
npm run build
cd ..

echo "Build complete! AgentVerse ready to launch."
