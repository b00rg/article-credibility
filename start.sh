# Start FastAPI backend
uvicorn backend.main:app --reload &

# Start React frontend
cd frontend
npm start