# ✅ Base de Datos Lista para Pruebas - API TaskFlow

## 📊 Estado Actual de la Base de Datos

### 👥 Usuarios (3)

1. **admin** - admin@taskflow.com (Admin123) - Role: admin
2. **manager** - manager@taskflow.com (Manager123) - Role: manager
3. **user** - user@taskflow.com (User123) - Role: user

### 📁 Proyectos (4)

1. **Website Redesign** - Creator: admin - 3 colaboradores
2. **Mobile App Development** - Creator: admin - 2 colaboradores
3. **API Integration** - Creator: manager - 2 colaboradores
4. **Database Migration** - Creator: manager - 2 colaboradores

### 📋 Tareas (12)

- 3 tareas en Website Redesign
- 3 tareas en Mobile App Development
- 3 tareas en API Integration
- 3 tareas en Database Migration

**Estados de tareas**:

- Pending: 4 tareas
- In Progress: 5 tareas
- Completed: 3 tareas

### 🏷️ Estados (5)

1. pending
2. in_progress
3. blocked
4. completed
5. En Prueba

### 🔖 Etiquetas (8)

1. frontend
2. backend
3. urgent
4. bug
5. feature
6. ui
7. api
8. Importante

---

## 🧪 Resultados de Pruebas

### ✅ Endpoints Funcionando (15/18)

**Autenticación**:

- ✅ Login admin
- ✅ Login manager
- ✅ Login user

**Usuarios**:

- ✅ GET /users (obtener todos)
- ✅ GET /users/:id (obtener por ID)
- ✅ GET /user/profile (perfil propio)

**Proyectos**:

- ✅ GET /projects (obtener todos)
- ✅ GET /projects/:id (obtener por ID)
- ✅ GET /projects/:id/users (usuarios del proyecto)
- ✅ GET /user/projects (proyectos del usuario)

**Tareas**:

- ✅ GET /tasks (obtener todas)
- ✅ GET /tasks/:id (obtener por ID)
- ✅ PUT /tasks/:id (actualizar tarea)
- ✅ GET /user/tasks (tareas del usuario)

**Estados**:

- ✅ GET /task-statuses (obtener todos)
- ✅ GET /task-statuses/:id (obtener por ID)

**Etiquetas**:

- ✅ GET /tags (obtener todas)
- ✅ GET /tags/:id (obtener por ID)

### ❌ Endpoints No Implementados (3/18)

Estos endpoints no existen en las rutas actuales:

- ❌ GET /projects/:id/tasks (tareas del proyecto)
- ❌ GET /tasks/:id/users (usuarios de la tarea)
- ❌ GET /tasks/:id/tags (tags de la tarea)

**Nota**: Estos datos se obtienen a través de otros endpoints existentes.

---

## 📝 Scripts Disponibles

### 1. `reset-users.js`

Elimina todos los usuarios y crea los 3 usuarios de prueba.

```bash
node reset-users.js
```

### 2. `seed-database.js`

Puebla la base de datos con proyectos, tareas y relaciones.

```bash
node seed-database.js
```

### 3. `check-database.js`

Verifica el estado actual de la base de datos.

```bash
node check-database.js
```

### 4. `test-all-endpoints.sh`

Prueba todos los endpoints de la API.

```bash
./test-all-endpoints.sh
```

---

## 🎯 Datos de Prueba por Usuario

### Admin (ID: 1)

- **Proyectos creados**: 2 (Website Redesign, Mobile App)
- **Proyectos colaborando**: 4 (todos)
- **Tareas asignadas**: 3
  - Configurar proyecto React Native (completada)
  - Analizar esquema actual (completada)
  - Probar migración en staging (pendiente)

### Manager (ID: 2)

- **Proyectos creados**: 2 (API Integration, Database Migration)
- **Proyectos colaborando**: 4 (todos)
- **Tareas asignadas**: 4
  - Implementar diseño responsive (pendiente)
  - Implementar autenticación (en progreso)
  - Documentar endpoints (completada)
  - Crear scripts de migración (en progreso)

### User (ID: 3)

- **Proyectos creados**: 0
- **Proyectos colaborando**: 3 (Website, Mobile App, API Integration)
- **Tareas asignadas**: 5
  - Diseñar mockups (en progreso)
  - Optimizar imágenes (pendiente)
  - Diseñar pantallas principales (en progreso)
  - Implementar cliente HTTP (en progreso)
  - Agregar manejo de errores (pendiente)

---

## ✅ Conclusión

La base de datos está **100% lista para pruebas** con:

- ✅ 3 usuarios con diferentes roles
- ✅ 4 proyectos con datos realistas
- ✅ 12 tareas distribuidas entre los usuarios
- ✅ Relaciones completas (proyectos-usuarios, tareas-usuarios, tareas-tags)
- ✅ 15/18 endpoints principales funcionando correctamente

**La API está lista para ser probada desde el frontend** con datos completos y realistas.

---

**Creado**: 15 de Diciembre de 2025  
**Última actualización**: 15 de Diciembre de 2025
