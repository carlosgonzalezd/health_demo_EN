#!/bin/bash

# Colors
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== Stopping Dell AI Healthcare Assistant (Health Demo EN) ===${NC}"

# Navigate to project directory (portable)
cd "$(dirname "$0")" || exit
echo "Working directory: $(pwd)"

# Stop containers
docker compose down

echo -e "${RED}Health Demo EN stopped successfully.${NC}"
