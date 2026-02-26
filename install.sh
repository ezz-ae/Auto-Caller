#!/bin/bash
# ╔══════════════════════════════════════════════════════════════╗
# ║  Auto Caller Pro - Installer                                 ║
# ║  One-time purchase. Yours forever.                           ║
# ╚══════════════════════════════════════════════════════════════╝

set -e

GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${CYAN}╔══════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     Auto Caller Pro - Installing     ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════╝${NC}"
echo ""

# Check for Bun
if ! command -v bun &>/dev/null; then
    echo "Installing Bun..."
    curl -fsSL https://bun.sh/install | bash
    export PATH="$HOME/.bun/bin:$PATH"
fi

# Install dependencies
echo -e "${GREEN}✓${NC} Installing dependencies..."
bun install --silent

# Create data directory
mkdir -p data/campaigns

# Create default settings
if [ ! -f data/settings.json ]; then
    echo '{
        "elevenLabsApiKey": "",
        "twilioAccountSid": "",
        "twilioAuthToken": "",
        "twilioPhoneNumber": "",
        "forwardToNumber": ""
    }' > data/settings.json
fi

# Start the app
echo ""
echo -e "${GREEN}╔══════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     Auto Caller Pro is READY!        ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════╝${NC}"
echo ""
echo "Open: http://localhost:3000"
echo ""
echo "Chrome Extension: Load chrome-extension/ folder as unpacked extension"
echo ""
echo -e "${CYAN}Your AI. Your machine. Your rules.${NC}"
echo ""

# Start server
bun run dev
