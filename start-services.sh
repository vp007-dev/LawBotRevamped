#!/usr/bin/env zsh

# Colors for terminal output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "${BLUE}====================================================${NC}"
echo "${BLUE}🚀 Starting LawBot360 Full Ecosystem Services${NC}"
echo "${BLUE}====================================================${NC}"

PROJECT_DIR="/Users/mohitupraity/projects/lawbot360"
cd "$PROJECT_DIR" || exit 1

# Cleanup function to kill all child processes on Ctrl+C
cleanup() {
    echo -e "\n${RED}🛑 Stopping all LawBot360 services...${NC}"
    pkill -P $$ 2>/dev/null
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# 1. Clear old processes on ports 20128, 8000, 5173
echo "${YELLOW}🧹 Clearing any running instances on ports 20128, 8000, 5173...${NC}"
kill -9 $(lsof -t -i:20128 2>/dev/null) 2>/dev/null
kill -9 $(lsof -t -i:8000 2>/dev/null) 2>/dev/null
kill -9 $(lsof -t -i:5173 2>/dev/null) 2>/dev/null
sleep 1

# 2. Source NVM if available and select system Node (Node 24)
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
    source "$NVM_DIR/nvm.sh"
    nvm use system >/dev/null 2>&1
fi

# 3. Start OmniRoute AI Gateway (Port 20128)
echo "${PURPLE}⚡ [1/3] Starting OmniRoute AI Gateway (http://localhost:20128)...${NC}"
INITIAL_PASSWORD=admin123 omniroute &
sleep 3

# 4. Start Python FastAPI Backend (Port 8000)
if [ -d "$PROJECT_DIR/backend" ]; then
    echo "${GREEN}🐍 [2/3] Starting FastAPI Python Backend (http://localhost:8000)...${NC}"
    (
        cd "$PROJECT_DIR/backend" || exit
        if [ -d ".venv" ]; then
            source .venv/bin/activate
        fi
        python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
    ) &
    sleep 2
fi

# 5. Start Vite React Frontend (Port 5173)
echo "${BLUE}🌐 [3/3] Starting React Vite Frontend (http://localhost:5173)...${NC}"
npm run dev
