# 🔧 SOLUCIÓN ALTERNATIVA - Usar Conexión Directa

El problema es que el **pooler de Supabase** (puerto 6543) usa certificados que causan problemas con Node.js en Vercel.

## ✅ Solución: Cambiar a Conexión Directa

Necesitas cambiar la variable de entorno en Vercel para usar la conexión **directa** en lugar del pooler.

### Pasos:

1. Ve a: https://vercel.com/eliasjr89/api-taskflow/settings/environment-variables

2. **Edita** la variable `POSTGRES_PRISMA_URL`

3. **Reemplaza** el valor actual con esta URL (conexión directa, puerto 5432):

```
postgres://postgres.dhqyffhuiqwnsjgmzkax:8n6mjxzBTiTph02l@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require
```

**Cambios**:

- Puerto: `6543` → `5432` (conexión directa)
- Removido: `&pgbouncer=true`

4. **Guarda** la variable

5. **Redeploy** el proyecto:
   - Ve a: https://vercel.com/eliasjr89/api-taskflow
   - Click en los 3 puntos del deployment más reciente
   - Click en "Redeploy"

### ¿Por qué funciona?

- Puerto **5432** = Conexión directa a PostgreSQL (certificados estándar)
- Puerto **6543** = Pooler/PgBouncer (certificados problemáticos)

La conexión directa usa certificados SSL estándar que Node.js acepta sin problemas.

---

**IMPORTANTE**: Después de cambiar la variable y hacer redeploy, la API debería funcionar inmediatamente.
