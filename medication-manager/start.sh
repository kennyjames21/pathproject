#!/bin/bash
# Start both backend and frontend servers

echo "🚀 Starting MedManager..."

# Start backend
cd "$(dirname "$0")/backend"
node src/app.js &
BACKEND_PID=$!
echo "✅ Backend running on http://localhost:3001 (PID: $BACKEND_PID)"

# Start frontend
cd "$(dirname "$0")/frontend"
npx vite &
FRONTEND_PID=$!
echo "✅ Frontend running on http://localhost:5173 (PID: $FRONTEND_PID)"

echo ""
echo "📱 Open http://localhost:5173 in your browser"
echo ""
echo "Press Ctrl+C to stop both servers"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM
wait
