# 🔧 Configuración de Variables de Entorno en Vercel

## Variables Requeridas para el Backend

Configura **SOLO estas 4 variables** en el Dashboard de Vercel (Settings → Environment Variables):

### 1. Base de Datos PostgreSQL (Supabase)

```bash
POSTGRES_PRISMA_URL=postgres://postgres.dhqyffhuiqwnsjgmzkax:8n6mjxzBTiTph02l@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
```

**Nota:** Esta URL está optimizada para pgBouncer y es la recomendada para Vercel.

### 2. JWT Secret (OBLIGATORIO)

```bash
JWT_SECRET=IBm/Qdb+LNYTTJOOQIHht+slenIQy6bMtRVuS8NWs19jy5wHrDHuviI+BXFh4fGisq2LPja+tQrgLizqxtmjiQ==
```

### 3. Environment (Recomendado)

```bash
NODE_ENV=production
```

### 4. JWT Expiration (Opcional)

```bash
JWT_EXPIRES_IN=1h
```

---

## ⚠️ Variables que NO necesitas en el backend

**NO agregues estas variables en Vercel para el backend:**

- ❌ `NEXT_PUBLIC_SUPABASE_*` (son para frontend)
- ❌ `SUPABASE_PUBLISHABLE_KEY` (frontend)
- ❌ `SUPABASE_SECRET_KEY` (frontend)
- ❌ `POSTGRES_HOST`, `POSTGRES_USER`, `POSTGRES_PASSWORD` (ya están en POSTGRES_PRISMA_URL)
- ❌ `POSTGRES_URL` (usamos POSTGRES_PRISMA_URL que es mejor)

---

## Variables para el Frontend (Si aplica)

Si tienes un frontend separado que usa Supabase directamente:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://dhqyffhuiqwnsjgmzkax.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRocXlmZmh1aXF3bnNqZ216a2F4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3NDkyNTUsImV4cCI6MjA4MTMyNTI1NX0.fLPVAAQAGbvHFKRAkRS6AKXbNm258xTflpQw67HTEQ8
```

---

## 📝 Pasos para Configurar en Vercel

1. Ve a tu proyecto en Vercel Dashboard
2. Settings → Environment Variables
3. Agrega cada variable con su valor
4. Selecciona los entornos: Production, Preview, Development
5. Guarda los cambios
6. Redeploy tu aplicación

---

## ✅ Verificación

Después de configurar las variables y hacer redeploy, verifica:

1. Los logs de Vercel para confirmar la conexión a la base de datos
2. Busca el mensaje: `✅ Database initialized for serverless function`
3. Prueba un endpoint de tu API

---

## 🔍 URLs Disponibles

Tienes estas opciones de conexión a PostgreSQL:

- **POSTGRES_PRISMA_URL** (Recomendada): Con pgBouncer, puerto 6543
- **POSTGRES_URL**: Pooler estándar, puerto 6543
- **POSTGRES_URL_NON_POOLING**: Conexión directa, puerto 5432

**Recomendación:** Usa `POSTGRES_PRISMA_URL` para mejor rendimiento en Vercel.
