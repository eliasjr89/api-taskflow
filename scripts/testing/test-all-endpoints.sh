#!/bin/bash

echo "╔════════════════════════════════════════════════╗"
echo "║   🧪 PRUEBA COMPLETA DE TODOS LOS ENDPOINTS    ║"
echo "╚════════════════════════════════════════════════╝"
echo ""

BASE_URL="http://localhost:3000/taskflow"

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

test_count=0
pass_count=0
fail_count=0

# Función para probar endpoints
test_endpoint() {
  local method=$1
  local endpoint=$2
  local data=$3
  local token=$4
  local description=$5
  
  test_count=$((test_count + 1))
  echo -n "Test $test_count: $description... "
  
  if [ -z "$token" ]; then
    response=$(curl -s -X $method "$BASE_URL$endpoint" \
      -H "Content-Type: application/json" \
      -d "$data")
  else
    response=$(curl -s -X $method "$BASE_URL$endpoint" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $token" \
      -d "$data")
  fi
  
  if echo "$response" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ PASS${NC}"
    pass_count=$((pass_count + 1))
  else
    echo -e "${RED}❌ FAIL${NC}"
    echo "   Response: $response"
    fail_count=$((fail_count + 1))
  fi
}

echo "═══════════════════════════════════════════════"
echo "1️⃣  AUTENTICACIÓN"
echo "═══════════════════════════════════════════════"

# Login como ADMIN
ADMIN_TOKEN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@taskflow.com","password":"Admin123"}' | jq -r '.data.token')
echo "✅ Admin token obtenido"

# Login como MANAGER
MANAGER_TOKEN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"manager@taskflow.com","password":"Manager123"}' | jq -r '.data.token')
echo "✅ Manager token obtenido"

# Login como USER
USER_TOKEN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@taskflow.com","password":"User123"}' | jq -r '.data.token')
echo "✅ User token obtenido: ${USER_TOKEN:0:10}..."

echo ""
echo "═══════════════════════════════════════════════"
echo "2️⃣  USUARIOS"
echo "═══════════════════════════════════════════════"

test_endpoint "GET" "/users" "" "$ADMIN_TOKEN" "Obtener todos los usuarios (admin)"
test_endpoint "GET" "/users/1" "" "$ADMIN_TOKEN" "Obtener usuario por ID (admin)"
test_endpoint "GET" "/user/profile" "" "$USER_TOKEN" "Obtener perfil propio (user)"

echo ""
echo "═══════════════════════════════════════════════"
echo "3️⃣  PROYECTOS"
echo "═══════════════════════════════════════════════"

test_endpoint "GET" "/projects" "" "$ADMIN_TOKEN" "Obtener todos los proyectos (admin)"
test_endpoint "GET" "/projects/1" "" "$ADMIN_TOKEN" "Obtener proyecto por ID (admin)"
test_endpoint "GET" "/projects/1/users" "" "$ADMIN_TOKEN" "Obtener usuarios del proyecto (admin)"
test_endpoint "GET" "/projects/1/tasks" "" "$ADMIN_TOKEN" "Obtener tareas del proyecto (admin)"
test_endpoint "GET" "/user/projects" "" "$USER_TOKEN" "Obtener proyectos del usuario (user)"

echo ""
echo "═══════════════════════════════════════════════"
echo "4️⃣  TAREAS"
echo "═══════════════════════════════════════════════"

test_endpoint "GET" "/tasks" "" "$ADMIN_TOKEN" "Obtener todas las tareas (admin)"
# Debug response
echo "Response for ID extraction: $response"
# Dynamically get ID from response (using jq to parse the JSON response stored in variable response)
TASK_ID=$(echo $response | jq -r '.data[0].id')
echo "ℹ️  Usando Task ID dinámico: $TASK_ID"

test_endpoint "GET" "/tasks/$TASK_ID" "" "$ADMIN_TOKEN" "Obtener tarea por ID (admin)"
test_endpoint "GET" "/tasks/$TASK_ID/users" "" "$ADMIN_TOKEN" "Obtener usuarios de la tarea (admin)"
test_endpoint "GET" "/tasks/$TASK_ID/tags" "" "$ADMIN_TOKEN" "Obtener tags de la tarea (admin)"
test_endpoint "GET" "/user/tasks" "" "$USER_TOKEN" "Obtener tareas del usuario (user)"

# Actualizar tarea
test_endpoint "PUT" "/tasks/$TASK_ID" '{"description":"Diseñar mockups actualizados","priority":"high"}' "$MANAGER_TOKEN" "Actualizar tarea (manager)"

echo ""
echo "═══════════════════════════════════════════════"
echo "5️⃣  ESTADOS"
echo "═══════════════════════════════════════════════"

test_endpoint "GET" "/task-statuses" "" "$USER_TOKEN" "Obtener todos los estados (user)"
test_endpoint "GET" "/task-statuses/1" "" "$USER_TOKEN" "Obtener estado por ID (user)"

echo ""
echo "═══════════════════════════════════════════════"
echo "6️⃣  ETIQUETAS"
echo "═══════════════════════════════════════════════"

test_endpoint "GET" "/tags" "" "$USER_TOKEN" "Obtener todas las etiquetas (user)"
test_endpoint "GET" "/tags/1" "" "$USER_TOKEN" "Obtener etiqueta por ID (user)"

echo ""
echo "╔════════════════════════════════════════════════╗"
echo "║              RESUMEN DE PRUEBAS                ║"
echo "╚════════════════════════════════════════════════╝"
echo ""
echo "Total de pruebas: $test_count"
echo -e "Exitosas: ${GREEN}$pass_count${NC}"
echo -e "Fallidas: ${RED}$fail_count${NC}"
echo ""

if [ $fail_count -eq 0 ]; then
  echo -e "${GREEN}✅ TODAS LAS PRUEBAS PASARON${NC}"
  exit 0
else
  echo -e "${RED}❌ ALGUNAS PRUEBAS FALLARON${NC}"
  exit 1
fi
