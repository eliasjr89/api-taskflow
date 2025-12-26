#!/bin/bash

# Login
LOGIN_RES=$(curl -s -X POST http://localhost:3000/taskflow/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@taskflow.com", "password": "password123"}')

TOKEN=$(echo $LOGIN_RES | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "Login Failed"
  exit 1
fi

# 1. Create Project
echo "Creating Project..."
PROJ_RES=$(curl -s -X POST http://localhost:3000/taskflow/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Project Auto",
    "description": "Created by automated script",
    "icon": "Zap"
  }')

PROJ_ID=$(echo $PROJ_RES | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -z "$PROJ_ID" ]; then
  echo "Create Project Failed: $PROJ_RES"
  exit 1
fi
echo "Project Created. ID: $PROJ_ID"

# 2. Create Task in Project
echo "Creating Task..."
TASK_RES=$(curl -s -X POST http://localhost:3000/taskflow/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"description\": \"Task in Test Project\",
    \"project_id\": $PROJ_ID, 
    \"status_id\": 16,
    \"priority\": \"medium\",
    \"due_date\": \"2025-12-31\"
  }")

TASK_ID=$(echo $TASK_RES | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -z "$TASK_ID" ]; then
  echo "Create Task Failed: $TASK_RES"
  # Try to delete project
  curl -s -X DELETE http://localhost:3000/taskflow/projects/$PROJ_ID -H "Authorization: Bearer $TOKEN" > /dev/null
  exit 1
fi
echo "Task Created. ID: $TASK_ID"

# 3. Cleanup (Delete Task and Project)
echo "Cleaning up..."
DEL_TASK=$(curl -s -X DELETE http://localhost:3000/taskflow/tasks/$TASK_ID \
  -H "Authorization: Bearer $TOKEN")
echo "Delete Task Response: $DEL_TASK"

DEL_PROJ=$(curl -s -X DELETE http://localhost:3000/taskflow/projects/$PROJ_ID \
  -H "Authorization: Bearer $TOKEN")
echo "Delete Project Response: $DEL_PROJ"

echo "Full Flow Verified (Create Project -> Create Task -> Delete Both)"
