#!/bin/bash

# Configuration
API_URL="http://localhost:3000/taskflow"
ADMIN_EMAIL="admin@taskflow.com"
ADMIN_PASSWORD="Admin123"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "---------------------------------------------------"
echo "  TaskFlow Phase 4 Verification (RBAC, Audit, Settings)"
echo "---------------------------------------------------"

# 1. Login
echo -e "\n1. Logging in as Admin..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.token')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo -e "${RED}Login Failed!${NC}"
  echo $LOGIN_RESPONSE
  exit 1
else
  echo -e "${GREEN}Login Successful! Token acquired.${NC}"
fi

# 2. Check Roles Endpoint
echo -e "\n2. Testing GET /admin/roles..."
ROLES_RES=$(curl -s -X GET "$API_URL/admin/roles" \
  -H "Authorization: Bearer $TOKEN")

if echo "$ROLES_RES" | grep -q "success\":true"; then
  echo -e "${GREEN}Roles Endpoint OK${NC}"
else
  echo -e "${RED}Roles Endpoint FAILED${NC}"
  echo "$ROLES_RES"
fi

# 3. Check Settings Endpoint
echo -e "\n3. Testing GET /admin/settings..."
SETTINGS_RES=$(curl -s -X GET "$API_URL/admin/settings" \
  -H "Authorization: Bearer $TOKEN")

if echo "$SETTINGS_RES" | grep -q "success\":true"; then
  echo -e "${GREEN}Settings Endpoint OK${NC}"
else
  echo -e "${RED}Settings Endpoint FAILED${NC}"
  echo "$SETTINGS_RES"
fi

# 4. Check Audit Endpoint
echo -e "\n4. Testing GET /admin/activity..."
AUDIT_RES=$(curl -s -X GET "$API_URL/admin/activity" \
  -H "Authorization: Bearer $TOKEN")

if echo "$AUDIT_RES" | grep -q "success\":true"; then
  echo -e "${GREEN}Audit Endpoint OK${NC}"
else
  echo -e "${RED}Audit Endpoint FAILED${NC}"
  echo "$AUDIT_RES"
fi

# 5. Check Webhooks Endpoint
echo -e "\n5. Testing GET /admin/webhooks..."
WEBHOOKS_RES=$(curl -s -X GET "$API_URL/admin/webhooks" \
  -H "Authorization: Bearer $TOKEN")

if echo "$WEBHOOKS_RES" | grep -q "success\":true"; then
  echo -e "${GREEN}Webhooks Endpoint OK${NC}"
else
  echo -e "${RED}Webhooks Endpoint FAILED${NC}"
  echo "$WEBHOOKS_RES"
fi

echo -e "\n---------------------------------------------------"
echo "Verification Complete"
echo "---------------------------------------------------"
