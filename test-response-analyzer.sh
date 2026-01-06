#!/bin/bash

# Test Response Analyzer webhook
# Usage: ./test-response-analyzer.sh YOUR_WEBHOOK_URL

WEBHOOK_URL="${1:-https://your-n8n-workspace.app.n8n.cloud/webhook/linkedin-response}"

echo "Testing Response Analyzer at: $WEBHOOK_URL"
echo ""

curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "context": "sts",
    "prospect_name": "Jane Doe",
    "company": "TechCorp",
    "our_message": "Hi Jane, noticed TechCorp is hiring DevOps engineers. I help IT leaders modernize their infrastructure with Cisco and Dell solutions. Would love to connect.",
    "their_response": "Thanks for reaching out! We are actually looking to upgrade our data center infrastructure. Can you send me more information about your Cisco solutions?",
    "linkedin_url": "https://linkedin.com/in/janedoe"
  }'

echo ""
echo ""
echo "Check n8n executions to see the AI's analysis!"
