#!/bin/bash

# Quick Agent Testing Script
# Usage: ./test-agent.sh [agent-type] [options]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
else
  echo -e "${RED}Error: .env file not found${NC}"
  exit 1
fi

# Check if API_KEY is set
if [ -z "$API_KEY" ]; then
  echo -e "${RED}Error: API_KEY not set in .env${NC}"
  exit 1
fi

# Server URL (default to localhost, or use RAILWAY_URL if set)
SERVER_URL="${SERVER_URL:-http://localhost:3000}"

echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   AI Agent Testing Tool                        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""

# Function to test health
test_health() {
  echo -e "${YELLOW}Testing health endpoint...${NC}"
  curl -s "${SERVER_URL}/health" | jq .
  echo ""
}

# Function to test personal research
test_personal() {
  echo -e "${YELLOW}Testing Personal Lead Research Agent...${NC}"
  curl -s -X POST "${SERVER_URL}/trigger/research/personal" \
    -H "Content-Type: application/json" \
    -H "X-API-Key: ${API_KEY}" \
    -d '{
      "name": "Andrej Karpathy",
      "company": "OpenAI",
      "context": "AI researcher and educator"
    }' | jq .
  echo ""
}

# Function to test PDC athlete research
test_pdc_athlete() {
  echo -e "${YELLOW}Testing PDC Athlete Research Agent...${NC}"
  curl -s -X POST "${SERVER_URL}/trigger/research/pdc" \
    -H "Content-Type: application/json" \
    -H "X-API-Key: ${API_KEY}" \
    -d '{
      "researchType": "athlete",
      "athleteName": "Travis Hunter",
      "sport": "football",
      "location": "Colorado"
    }' | jq .
  echo ""
}

# Function to test PDC collaboration research
test_pdc_collab() {
  echo -e "${YELLOW}Testing PDC Collaboration Research Agent...${NC}"
  curl -s -X POST "${SERVER_URL}/trigger/research/pdc" \
    -H "Content-Type: application/json" \
    -H "X-API-Key: ${API_KEY}" \
    -d '{
      "researchType": "collaboration",
      "organizationName": "Opendorse",
      "organizationType": "NIL platform"
    }' | jq .
  echo ""
}

# Function to test STS research
test_sts() {
  echo -e "${YELLOW}Testing STS Lead Research Agent...${NC}"
  curl -s -X POST "${SERVER_URL}/trigger/research/sts" \
    -H "Content-Type: application/json" \
    -H "X-API-Key: ${API_KEY}" \
    -d '{
      "companyName": "Acme Healthcare",
      "industry": "Healthcare",
      "employeeCount": 500
    }' | jq .
  echo ""
}

# Function to test PDC content
test_pdc_content() {
  echo -e "${YELLOW}Testing PDC Content Generation Agent...${NC}"
  curl -s -X POST "${SERVER_URL}/trigger/content/pdc" \
    -H "Content-Type: application/json" \
    -H "X-API-Key: ${API_KEY}" \
    -d '{
      "action": "generate",
      "topic": "NIL opportunities for college athletes",
      "platform": "instagram"
    }' | jq .
  echo ""
}

# Function to test STS content
test_sts_content() {
  echo -e "${YELLOW}Testing STS Content Generation Agent...${NC}"
  curl -s -X POST "${SERVER_URL}/trigger/content/sts" \
    -H "Content-Type: application/json" \
    -H "X-API-Key: ${API_KEY}" \
    -d '{
      "action": "generate",
      "topic": "Cloud migration best practices",
      "platform": "linkedin"
    }' | jq .
  echo ""
}

# Main menu
case "$1" in
  health)
    test_health
    ;;
  personal)
    test_personal
    ;;
  pdc-athlete)
    test_pdc_athlete
    ;;
  pdc-collab)
    test_pdc_collab
    ;;
  sts)
    test_sts
    ;;
  pdc-content)
    test_pdc_content
    ;;
  sts-content)
    test_sts_content
    ;;
  all)
    test_health
    echo -e "${BLUE}─────────────────────────────────────────────────${NC}"
    test_personal
    echo -e "${BLUE}─────────────────────────────────────────────────${NC}"
    test_pdc_athlete
    echo -e "${BLUE}─────────────────────────────────────────────────${NC}"
    test_sts
    echo -e "${BLUE}─────────────────────────────────────────────────${NC}"
    test_pdc_content
    echo -e "${BLUE}─────────────────────────────────────────────────${NC}"
    test_sts_content
    ;;
  *)
    echo "Usage: ./test-agent.sh [command]"
    echo ""
    echo "Commands:"
    echo "  health         - Test health endpoint"
    echo "  personal       - Test personal lead research"
    echo "  pdc-athlete    - Test PDC athlete research"
    echo "  pdc-collab     - Test PDC collaboration research"
    echo "  sts            - Test STS company research"
    echo "  pdc-content    - Test PDC content generation"
    echo "  sts-content    - Test STS content generation"
    echo "  all            - Run all tests"
    echo ""
    echo "Examples:"
    echo "  ./test-agent.sh health"
    echo "  ./test-agent.sh personal"
    echo "  ./test-agent.sh all"
    echo ""
    echo "To test production:"
    echo "  SERVER_URL=https://your-app.up.railway.app ./test-agent.sh health"
    ;;
esac
