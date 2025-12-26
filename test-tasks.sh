#!/bin/bash

# Login to get token
echo "Logging in..."
LOGIN_RES=$(curl -s -X POST http://localhost:3000/taskflow/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@taskflow.com", "password": "password123"}')

TOKEN=$(echo $LOGIN_RES | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
  echo "Login Failed: $LOGIN_RES"
  exit 1
fi
echo "Login Successful."

# 1. Create Task
echo "Creating Task..."
CREATE_RES=$(curl -s -X POST http://localhost:3000/taskflow/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Test Task via Script",
    "project_id": 1, 
    "status_id": 1,
    "priority": "high",
    "due_date": "2025-12-31"
  }')
# Note: project_id 1 might not exist or verify. Assuming project 1 exists from seed.

TASK_ID=$(echo $CREATE_RES | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -z "$TASK_ID" ]; then
  echo "Create Task Failed: $CREATE_RES"
  # Try to create project first?
  exit 1
fi
echo "Task Created. ID: $TASK_ID"

# 2. Get Task
echo "Fetching Task..."
GET_RES=$(curl -s -X GET http://localhost:3000/taskflow/tasks/$TASK_ID \
  -H "Authorization: Bearer $TOKEN")
echo "Get Response: $GET_RES"

# 3. Update Task
echo "Updating Task (Status & Priority)..."
UPDATE_RES=$(curl -s -X PUT http://localhost:3000/taskflow/tasks/$TASK_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Updated Task Description",
    "status_id": 2,
    "priority": "low"
  }')
echo "Update Response: $UPDATE_RES"

# 4. Delete Task
echo "Deleting Task..."
DELETE_RES=$(curl -s -X DELETE http://localhost:3000/taskflow/tasks/$TASK_ID \
  -H "Authorization: Bearer $TOKEN")
echo "Delete Response: $DELETE_RES"

# 5. Verify Deletion
echo "Verifying Deletion..."
CHECK_RES=$(curl -s -X GET http://localhost:3000/taskflow/tasks/$TASK_ID \
  -H "Authorization: Bearer $TOKEN")
echo "Check Response (Expected 404/Error): $CHECK_RES"

echo "Task Flow Test Completed."
