# 🚀 Guía de Deploy a Vercel - API TaskFlow

**Estado**: ✅ Código subido a GitHub  
**Commit**: `8f5409b` - Complete API implementation  
**Fecha**: 15 de Diciembre de 2025

---

## 📋 Pre-requisitos Completados

- ✅ Código subido a GitHub (https://github.com/eliasjr89/api-taskflow)
- ✅ Base de datos PostgreSQL creada en Vercel/Supabase
- ✅ Variables de entorno identificadas
- ✅ Código optimizado para serverless

---

## 🎯 Pasos para Deploy en Vercel

### Paso 1: Acceder a Vercel Dashboard

1. Ve a [vercel.com](https://vercel.com)
2. Inicia sesión con tu cuenta
3. Click en **"Add New..."** → **"Project"**

### Paso 2: Importar Repositorio

1. Selecciona **"Import Git Repository"**
2. Busca y selecciona: `eliasjr89/api-taskflow`
3. Click en **"Import"**

### Paso 3: Configurar el Proyecto

**Framework Preset**: Other (o None)

**Build Settings**:

- Build Command: `npm install` (o déjalo vacío)
- Output Directory: `.` (déjalo vacío)
- Install Command: `npm install`

**Root Directory**: `.` (raíz del proyecto)

### Paso 4: Configurar Variables de Entorno

Click en **"Environment Variables"** y agrega las siguientes:

#### Variables OBLIGATORIAS:

```bash
# Database (Auto-configurada si conectaste Supabase desde Vercel)
POSTGRES_PRISMA_URL=postgres://postgres.dhqyffhuiqwnsjgmzkax:8n6mjxzBTiTph02l@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true

# JWT Authentication (IMPORTANTE)
JWT_SECRET=IBm/Qdb+LNYTTJOOQIHht+slenIQy6bMtRVuS8NWs19jy5wHrDHuviI+BXFh4fGisq2LPja+tQrgLizqxtmjiQ==

# JWT Expiration
JWT_EXPIRES_IN=1h

# Node Environment
NODE_ENV=production
```

#### Cómo agregar cada variable:

1. **Name**: `POSTGRES_PRISMA_URL`

   - **Value**: `postgres://postgres.dhqyffhuiqwnsjgmzkax:8n6mjxzBTiTph02l@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true`
   - **Environment**: Production, Preview, Development (seleccionar todos)

2. **Name**: `JWT_SECRET`

   - **Value**: `IBm/Qdb+LNYTTJOOQIHht+slenIQy6bMtRVuS8NWs19jy5wHrDHuviI+BXFh4fGisq2LPja+tQrgLizqxtmjiQ==`
   - **Environment**: Production, Preview, Development

3. **Name**: `JWT_EXPIRES_IN`

   - **Value**: `1h`
   - **Environment**: Production, Preview, Development

4. **Name**: `NODE_ENV`
   - **Value**: `production`
   - **Environment**: Production

### Paso 5: Deploy

1. Click en **"Deploy"**
2. Espera a que Vercel construya y despliegue tu aplicación (1-3 minutos)
3. ✅ Una vez completado, verás el mensaje "Congratulations!"

---

## 🔍 Verificación Post-Deploy

### 1. Obtener la URL de tu API

Vercel te asignará una URL como:

```
https://api-taskflow-xxx.vercel.app
```

### 2. Probar los Endpoints

#### Test 1: Ping

```bash
curl https://api-taskflow-xxx.vercel.app/ping
```

**Respuesta esperada**: `pong`

#### Test 2: Registro

```bash
curl -X POST https://api-taskflow-xxx.vercel.app/taskflow/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Test123456",
    "name": "Test",
    "lastname": "User"
  }'
```

#### Test 3: Login

```bash
curl -X POST https://api-taskflow-xxx.vercel.app/taskflow/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456"
  }'
```

### 3. Verificar Logs

1. En el Dashboard de Vercel, ve a tu proyecto
2. Click en **"Deployments"**
3. Click en el deployment más reciente
4. Ve a **"Functions"** → **"Logs"**
5. Busca el mensaje: `✅ Database initialized for serverless function`

---

## 🐛 Solución de Problemas

### Error: "Database connection failed"

**Solución**:

1. Verifica que `POSTGRES_PRISMA_URL` esté correctamente configurada
2. Asegúrate de que la base de datos de Supabase esté activa
3. Revisa los logs en Vercel para más detalles

### Error: "JWT_SECRET must be at least 10 chars long"

**Solución**:

1. Verifica que `JWT_SECRET` esté configurada en las variables de entorno
2. Asegúrate de que tenga al menos 10 caracteres

### Error: "Cannot find module"

**Solución**:

1. Verifica que `package.json` tenga todas las dependencias
2. Haz un redeploy forzado desde Vercel

---

## 📊 Checklist de Verificación

Antes de considerar el deploy exitoso, verifica:

- [ ] ✅ La URL de Vercel está activa
- [ ] ✅ `/ping` responde con "pong"
- [ ] ✅ El registro de usuarios funciona
- [ ] ✅ El login retorna un token JWT
- [ ] ✅ Los logs muestran "Database initialized"
- [ ] ✅ No hay errores en los logs de Vercel
- [ ] ✅ Las rutas protegidas requieren autenticación

---

## 🎉 Deploy Exitoso

Una vez que todos los checks estén ✅, tu API está **LISTA PARA PRODUCCIÓN**.

### URLs Importantes:

- **API Base URL**: `https://api-taskflow-xxx.vercel.app`
- **Swagger Docs**: `https://api-taskflow-xxx.vercel.app/api-docs`
- **Dashboard Vercel**: `https://vercel.com/dashboard`

### Próximos Pasos:

1. Actualiza tu frontend con la nueva URL de la API
2. Configura un dominio personalizado (opcional)
3. Configura alertas y monitoreo
4. Implementa rate limiting adicional si es necesario

---

## 📝 Notas Adicionales

### Dominio Personalizado (Opcional)

1. Ve a tu proyecto en Vercel
2. Settings → Domains
3. Agrega tu dominio personalizado
4. Sigue las instrucciones de DNS

### Monitoreo

Vercel proporciona:

- Analytics automático
- Logs en tiempo real
- Métricas de rendimiento
- Alertas de errores

### Escalabilidad

Tu API en Vercel escala automáticamente:

- Sin límite de requests (plan Pro)
- Serverless functions optimizadas
- CDN global incluido
- SSL/HTTPS automático

---

**¿Necesitas ayuda?** Consulta la [documentación de Vercel](https://vercel.com/docs) o los logs de tu deployment.
# Trigger redeploy - lun 15 dic 2025 17:44:08 CET
