#!/bin/bash
# test-admin-features.sh

BASE_URL="http://localhost:3000/taskflow"
EMAIL="admin@taskflow.com"
PASSWORD="Admin123"

# 1. Login as Admin
echo "Logging in as Admin..."
LOGIN_RES=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\", \"password\":\"$PASSWORD\"}")

TOKEN=$(echo $LOGIN_RES | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Login Failed"
  echo $LOGIN_RES
  exit 1
fi
echo "✅ Admin Login Successful"

# 2. Test System Health
echo -e "\nTesting System Health (/admin/health)..."
HEALTH_RES=$(curl -s -X GET "$BASE_URL/admin/health" \
  -H "Authorization: Bearer $TOKEN")

if [[ $HEALTH_RES == *"uptime"* ]]; then
  echo "✅ System Health OK"
else
  echo "❌ System Health Failed"
  echo $HEALTH_RES
fi

# 3. Test Dashboard Stats
echo -e "\nTesting Dashboard Stats (/admin/dashboard)..."
STATS_RES=$(curl -s -X GET "$BASE_URL/admin/dashboard" \
  -H "Authorization: Bearer $TOKEN")

if [[ $STATS_RES == *"counts"* ]]; then
  echo "✅ Dashboard Stats OK"
else
  echo "❌ Dashboard Stats Failed"
  echo $STATS_RES
fi

# 4. Test Impersonation
TARGET_USER_ID=3 # User 1
echo -e "\nTesting Impersonation (Admin -> User $TARGET_USER_ID)..."
IMP_RES=$(curl -s -X POST "$BASE_URL/admin/impersonate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"userId\": $TARGET_USER_ID}")

NEW_TOKEN=$(echo $IMP_RES | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -n "$NEW_TOKEN" ]; then
  echo "✅ Impersonation Successful. Got new token."
else
  echo "❌ Impersonation Failed"
  echo $IMP_RES
fi
