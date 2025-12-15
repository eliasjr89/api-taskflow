# 👥 Usuarios de Prueba - API TaskFlow

## 📊 Base de Datos Reseteada

La base de datos ha sido limpiada y ahora contiene **solo 3 usuarios** para pruebas.

---

## 🔑 Credenciales de Acceso

### 1. ADMIN (Administrador)

**Rol**: `admin`  
**Email**: `admin@taskflow.com`  
**Password**: `Admin123`  
**ID**: 1

**Permisos**:

- ✅ Acceso completo al dashboard HTML (administración)
- ✅ Acceso al frontend como creador
- ✅ Puede ejecutar TODAS las acciones (CRUD completo)
- ✅ Gestión total de usuarios, proyectos y tareas
- ✅ Puede ver y modificar todos los datos

---

### 2. MANAGER (Gestor)

**Rol**: `manager`  
**Email**: `manager@taskflow.com`  
**Password**: `Manager123`  
**ID**: 2

**Permisos**:

- ✅ Acceso al frontend
- ✅ Puede gestionar proyectos y tareas asignadas
- ✅ Puede asignar tareas a usuarios
- ⚠️ No puede eliminar usuarios
- ⚠️ Acceso limitado a funciones administrativas

---

### 3. USER (Usuario)

**Rol**: `user`  
**Email**: `user@taskflow.com`  
**Password**: `User123`  
**ID**: 3

**Permisos**:

- ✅ Acceso al frontend
- ✅ Puede ver sus proyectos y tareas
- ✅ Puede actualizar el estado de sus tareas
- ⚠️ No puede crear/eliminar proyectos
- ⚠️ No puede gestionar otros usuarios
- ⚠️ Solo ve sus propios datos

---

## 🧪 Pruebas de Login

### Probar en Local:

```bash
# ADMIN
curl -X POST http://localhost:3000/taskflow/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@taskflow.com","password":"Admin123"}'

# MANAGER
curl -X POST http://localhost:3000/taskflow/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"manager@taskflow.com","password":"Manager123"}'

# USER
curl -X POST http://localhost:3000/taskflow/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@taskflow.com","password":"User123"}'
```

### Probar en Producción (Vercel):

```bash
# ADMIN
curl -X POST https://api-taskflow-eight.vercel.app/taskflow/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@taskflow.com","password":"Admin123"}'

# MANAGER
curl -X POST https://api-taskflow-eight.vercel.app/taskflow/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"manager@taskflow.com","password":"Manager123"}'

# USER
curl -X POST https://api-taskflow-eight.vercel.app/taskflow/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@taskflow.com","password":"User123"}'
```

---

## 📝 Notas Importantes

1. **Dashboard HTML**: Solo el usuario `admin` puede acceder al dashboard de administración
2. **Frontend**: Los 3 usuarios pueden acceder, pero con diferentes permisos
3. **Passwords**: Todas las contraseñas siguen el formato `[Role]123` para facilitar las pruebas
4. **Producción**: Recuerda cambiar estas credenciales en producción por seguridad

---

## 🔄 Resetear Usuarios

Si necesitas volver a resetear los usuarios, ejecuta:

```bash
node reset-users.js
```

Este script:

1. Elimina todos los usuarios existentes
2. Resetea el contador de IDs
3. Crea los 3 usuarios de prueba

---

**Creado**: 15 de Diciembre de 2025  
**Base de Datos**: Supabase PostgreSQL  
**Entorno**: Development & Production
