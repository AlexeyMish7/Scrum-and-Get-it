#!/bin/bash
# Development startup script for Scrum-and-Get-it (macOS/Linux)
# Opens two separate terminal windows for frontend and backend

echo "🚀 Starting Scrum-and-Get-it Development Environment..."
echo ""

# Get the script directory (project root)
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Detect OS and terminal
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS - use Terminal.app
    echo "📦 Launching Backend Server..."
    osascript <<EOF
tell application "Terminal"
    do script "cd '$PROJECT_ROOT/server' && echo '🔧 Backend Server' && echo 'Installing dependencies...' && npm install && echo '' && echo 'Starting dev server...' && npm run dev"
    activate
end tell
EOF

    sleep 0.5

    echo "🎨 Launching Frontend..."
    osascript <<EOF
tell application "Terminal"
    do script "cd '$PROJECT_ROOT/frontend' && echo '🎨 Frontend' && echo 'Installing dependencies...' && npm install && echo '' && echo 'Starting dev server...' && npm run dev"
    activate
end tell
EOF

elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux - try common terminal emulators
    if command -v gnome-terminal &> /dev/null; then
        TERMINAL="gnome-terminal --"
    elif command -v konsole &> /dev/null; then
        TERMINAL="konsole -e"
    elif command -v xfce4-terminal &> /dev/null; then
        TERMINAL="xfce4-terminal -e"
    elif command -v xterm &> /dev/null; then
        TERMINAL="xterm -e"
    else
        echo "❌ No supported terminal emulator found"
        exit 1
    fi

    echo "📦 Launching Backend Server..."
    $TERMINAL bash -c "cd '$PROJECT_ROOT/server' && echo '🔧 Backend Server' && echo 'Installing dependencies...' && npm install && echo '' && echo 'Starting dev server...' && npm run dev; exec bash" &

    sleep 0.5

    echo "🎨 Launching Frontend..."
    $TERMINAL bash -c "cd '$PROJECT_ROOT/frontend' && echo '🎨 Frontend' && echo 'Installing dependencies...' && npm install && echo '' && echo 'Starting dev server...' && npm run dev; exec bash" &

else
    echo "❌ Unsupported OS: $OSTYPE"
    exit 1
fi

echo ""
echo "✅ Development terminals launched!"
echo "   - Backend: http://localhost:3000"
echo "   - Frontend: http://localhost:5173"
echo ""
