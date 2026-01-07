#!/bin/bash

BASE_URL="http://localhost:3000/taskflow"
EMAIL="testuser_$(date +%s)@example.com"
PASSWORD="SecurePass123!"

echo "=========================================="
echo "   STARTING COMPREHENSIVE API TEST"
echo "=========================================="

# 1. REGISTER
echo -e "\n[1] Registering new user: $EMAIL"
REG_RES=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"testuser_$(date +%s)\",
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\",
    \"name\": \"Test\",
    \"lastname\": \"User\"
  }")

# Check if register was successful (expecting token or success message)
# Assuming it returns token or we need to login.
# Based on auth.routes.js: responses: 201: description: Usuario creado exitosamente
if echo "$REG_RES" | grep -q "token" || echo "$REG_RES" | grep -q "id"; then
  echo "✅ Register Successful"
else
  echo "❌ Register Failed: $REG_RES"
  # Try login if user already exists (for re-run ability)
fi

# 2. LOGIN
echo -e "\n[2] Logging in..."
LOGIN_RES=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\"
  }")

TOKEN=$(echo $LOGIN_RES | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
  echo "❌ Login Failed: $LOGIN_RES"
  exit 1
else
  echo "✅ Login Successful"
fi

# 3. PROJECTS CRUD
echo -e "\n[3] Testing Projects CRUD"
# Create Project
echo "   -> Creating Project..."
PROJ_RES=$(curl -s -X POST "$BASE_URL/projects" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "API Test Project",
    "description": "Project created by test script",
    "start_date": "2024-01-01T00:00:00Z"
  }')

PROJ_ID=$(echo $PROJ_RES | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -n "$PROJ_ID" ]; then
  echo "   ✅ Project Created (ID: $PROJ_ID)"
else
  echo "   ❌ Create Project Failed: $PROJ_RES"
  exit 1
fi

# Get Project
echo "   -> Fetching Project..."
GET_PROJ=$(curl -s -X GET "$BASE_URL/projects/$PROJ_ID" -H "Authorization: Bearer $TOKEN")
if echo "$GET_PROJ" | grep -q "API Test Project"; then
  echo "   ✅ Get Project Successful"
else
  echo "   ❌ Get Project Failed: $GET_PROJ"
fi

# Update Project
echo "   -> Updating Project..."
UPD_PROJ=$(curl -s -X PUT "$BASE_URL/projects/$PROJ_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "API Test Project Updated"
  }')
if echo "$UPD_PROJ" | grep -q "API Test Project Updated"; then
  echo "   ✅ Update Project Successful"
else
  echo "   ❌ Update Project Failed: $UPD_PROJ"
fi

# 4. TAGS CRUD
echo -e "\n[4] Testing Tags CRUD"
echo "   -> Creating Tag..."
TAG_RES=$(curl -s -X POST "$BASE_URL/tags" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "TestTag"
  }')

TAG_ID=$(echo $TAG_RES | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -n "$TAG_ID" ]; then
  echo "   ✅ Tag Created (ID: $TAG_ID)"
else
  # If tag exists, try to fetch it? Or just ignore/fail.
  echo "   ⚠️ Create Tag Failed (might exist): $TAG_RES"
  # Try to continue if we can't get ID, simpler to just skip tag specific task tests if this fails
fi

# 5. TASKS CRUD
echo -e "\n[5] Testing Tasks CRUD"
# Create Task
echo "   -> Creating Task..."
TASK_RES=$(curl -s -X POST "$BASE_URL/tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"description\": \"Test Task Description\",
    \"project_id\": $PROJ_ID,
    \"status_id\": 1,
    \"priority\": \"medium\",
    \"due_date\": \"2024-12-31T00:00:00Z\"
  }")

TASK_ID=$(echo $TASK_RES | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -n "$TASK_ID" ]; then
  echo "   ✅ Task Created (ID: $TASK_ID)"
else
  echo "   ❌ Create Task Failed: $TASK_RES"
  exit 1
fi

# Update Task
echo "   -> Updating Task..."
UPD_TASK=$(curl -s -X PUT "$BASE_URL/tasks/$TASK_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Updated Task Description",
    "priority": "high"
  }')
if echo "$UPD_TASK" | grep -q "Updated Task Description"; then
  echo "   ✅ Update Task Successful"
else
  echo "   ❌ Update Task Failed: $UPD_TASK"
fi

# Add Tag to Task
if [ -n "$TAG_ID" ]; then
  echo "   -> Adding Tag to Task..."
  ADD_TAG=$(curl -s -X POST "$BASE_URL/tasks/$TASK_ID/tags" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{ \"tagId\": $TAG_ID }")
  # Assuming 200/201
  if echo "$ADD_TAG" | grep -q "success" || echo "$ADD_TAG" | grep -q "id"; then
     echo "   ✅ Tag added to Task"
  else
     echo "   ⚠️ Add Tag Failed: $ADD_TAG"
  fi
fi

# 6. ERROR HANDLING
echo -e "\n[6] Testing Error Handling"
echo "   -> Sending Invalid Login..."
INVALID_LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{ "email": "wrong@example.com", "password": "wrong" }')
echo "      Response: $INVALID_LOGIN"

# 7. CLEANUP
echo -e "\n[7] Cleanup"
echo "   -> Deleting Task..."
del_task=$(curl -s -X DELETE "$BASE_URL/tasks/$TASK_ID" -H "Authorization: Bearer $TOKEN")
echo "      $del_task"

echo "   -> Deleting Project..."
del_proj=$(curl -s -X DELETE "$BASE_URL/projects/$PROJ_ID" -H "Authorization: Bearer $TOKEN")
echo "      $del_proj"

if [ -n "$TAG_ID" ]; then
  echo "   -> Deleting Tag..."
  del_tag=$(curl -s -X DELETE "$BASE_URL/tags/$TAG_ID" -H "Authorization: Bearer $TOKEN")
  echo "      $del_tag"
fi

# Optionally Delete User (if endpoint exists/allowed)
# Not strictly required but good for hygiene.
# User ID is in login response usually.
USER_ID=$(echo $LOGIN_RES | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
if [ -n "$USER_ID" ]; then
    echo "   -> Deleting User..."
    del_user=$(curl -s -X DELETE "$BASE_URL/users/$USER_ID" -H "Authorization: Bearer $TOKEN")
    echo "      $del_user"
fi


echo -e "\n=========================================="
echo "   TEST COMPLETE"
echo "=========================================="
