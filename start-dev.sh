#!/bin/bash

# Kill any existing processes on ports 3000 and 8000
kill $(lsof -t -i:3000) 2>/dev/null
kill $(lsof -t -i:8000) 2>/dev/null

# Start the backend
echo "Starting backend server..."
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload &

# Start the frontend
echo "Starting frontend server..."
npm start &

# Wait for servers to start
sleep 5

# Start ngrok tunnels
echo "Creating ngrok tunnels..."
ngrok http --log=stdout 8000 > ngrok_backend.log &
ngrok http --log=stdout 3000 > ngrok_frontend.log &

# Wait a bit for ngrok to establish connections
sleep 5

# Display the ngrok URLs
echo "\nNgrok URLs:"
echo "Backend URL: $(grep -o 'https://.*\.ngrok-free\.app' ngrok_backend.log | head -n1)"
echo "Frontend URL: $(grep -o 'https://.*\.ngrok-free\.app' ngrok_frontend.log | head -n1)"
echo "\nPress Ctrl+C to stop all services"

# Wait for Ctrl+C
wait 