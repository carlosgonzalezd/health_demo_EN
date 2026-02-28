#!/bin/bash

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Dell AI Healthcare Assistant (Health Demo EN) ===${NC}"

# Navigate to project directory (portable)
cd "$(dirname "$0")" || exit
echo "Working directory: $(pwd)"

# 1. Ensure Ollama (AI) is running
echo -e "\n${BLUE}[1/5] Checking AI inference service (Ollama)...${NC}"
if [ ! "$(docker ps -q -f name=ollama-api)" ]; then
    if [ "$(docker ps -aq -f status=exited -f name=ollama-api)" ]; then
        echo "Starting ollama-api container..."
        docker start ollama-api
    else
        echo -e "${RED}Warning: Container 'ollama-api' not found. Make sure Ollama is available.${NC}"
    fi
else
    echo -e "${GREEN}Ollama is already running.${NC}"
fi

# 2. GB10 Performance Monitor (Host Stats)
echo -e "\n${BLUE}[2/5] Starting GB10 Performance Monitor...${NC}"
if ps aux | grep -v grep | grep "host_stats_server.py" > /dev/null; then
    echo -e "${GREEN}Performance Monitor is already running.${NC}"
else
    nohup python3 host_stats_server.py > stats_server.log 2>&1 &
    sleep 2
    if ps aux | grep -v grep | grep "host_stats_server.py" > /dev/null; then
        echo -e "${GREEN}Performance Monitor started successfully (Port 4102).${NC}"
    else
        echo -e "${RED}Error: Could not start Performance Monitor. Check stats_server.log${NC}"
    fi
fi

# 3. Check ports
echo -e "\n${BLUE}[3/5] Checking port availability...${NC}"
if netstat -tunlp 2>/dev/null | grep -E ':4101|:4201' > /dev/null; then
    echo -e "${RED}Warning: Ports 4101 or 4201 are already in use.${NC}"
fi

# 4. Launch Health Demo EN
echo -e "\n${BLUE}[4/5] Starting Health Demo EN containers...${NC}"
docker compose up -d --build

# 5. Verification
echo -e "\n${BLUE}[5/5] Verifying status...${NC}"
sleep 5
if [ "$(docker ps -q -f name=health_demo_EN_frontend)" ]; then
    echo -e "${GREEN}Health Demo EN launched successfully!${NC}"
    echo -e "\n${BLUE}Access the demo at:${NC}"
    echo -e "  Frontend:  ${BLUE}http://localhost:4101${NC}"
    echo -e "  Backend:   ${BLUE}http://localhost:4201${NC}"
else
    echo -e "${RED}There was an issue starting the demo. Check logs with: docker compose logs${NC}"
fi
