#!/bin/bash
# test-announcements.sh

BASE_URL="http://localhost:3000/taskflow"
EMAIL="admin@taskflow.com"
PASSWORD="Admin123"

echo "Logging in as Admin..."
LOGIN_RES=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\", \"password\":\"$PASSWORD\"}")

TOKEN=$(echo $LOGIN_RES | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Login Failed"
  exit 1
fi
echo "✅ Admin Login Successful"

# 1. Create Announcement
echo -e "\nCreating Announcement..."
CREATE_RES=$(curl -s -X POST "$BASE_URL/announcements" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Maintenance", "message": "System down in 5 mins", "type": "warning"}')

if [[ $CREATE_RES == *"created"* ]]; then
  echo "✅ Announcement Created"
else
  echo "❌ Creation Failed"
  echo $CREATE_RES
fi

# 2. Get Active
echo -e "\nFetching Active Announcements..."
GET_RES=$(curl -s -X GET "$BASE_URL/announcements/active" \
  -H "Authorization: Bearer $TOKEN")

if [[ $GET_RES == *"Maintenance"* ]]; then
  echo "✅ Active Announcements Fetched"
else
  echo "❌ Fetch Failed"
  echo $GET_RES
fi
