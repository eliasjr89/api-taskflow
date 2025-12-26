#!/bin/bash

# 1. Login as Admin
echo "Logging in as Admin..."
ADMIN_RES=$(curl -s -X POST http://localhost:3000/taskflow/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@taskflow.com", "password": "password123"}')

ADMIN_TOKEN=$(echo $ADMIN_RES | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$ADMIN_TOKEN" ]; then
  echo "Admin Login Failed"
  exit 1
fi
echo "Admin Login Successful."

# 2. Get DB Stats
echo "Fetching DB Stats..."
STATS_RES=$(curl -s -X GET http://localhost:3000/taskflow/admin/stats \
  -H "Authorization: Bearer $ADMIN_TOKEN")
# Expecting success
echo $STATS_RES | grep "uptime" > /dev/null
if [ $? -eq 0 ]; then
  echo "✅ DB Stats Verified"
else
  echo "❌ DB Stats Failed: $STATS_RES"
fi

# 3. Create Activity Log (implicitly done by logging in)
# 4. Clear Activity Log
echo "Clearing Activity Log..."
CLEAR_RES=$(curl -s -X DELETE http://localhost:3000/taskflow/admin/activity \
  -H "Authorization: Bearer $ADMIN_TOKEN")
echo "Clear Logs Response: $CLEAR_RES"

# 5. Access Control Test (Login as User and try Admin route)
echo "Logging in as Regular User..."
USER_RES=$(curl -s -X POST http://localhost:3000/taskflow/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@taskflow.com", "password": "password123"}')
USER_TOKEN=$(echo $USER_RES | grep -o '"token":"[^"]*' | cut -d'"' -f4)

echo "Attempting Admin Route as User..."
ACCESS_RES=$(curl -s -X GET http://localhost:3000/taskflow/admin/stats \
  -H "Authorization: Bearer $USER_TOKEN")

# Expecting 403 or 401
echo $ACCESS_RES | grep "You do not have permission" > /dev/null
if [ $? -eq 0 ] || [[ "$ACCESS_RES" == *"permission"* ]]; then
  echo "✅ Access Control Verified: Regular User was correctly BLOCKED (Received expected 403)"
else
  echo "❌ SECURITY FAILURE: Regular User was able to access Admin route!"
fi

echo "Admin Tests Completed."
