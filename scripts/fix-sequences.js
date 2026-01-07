import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Sincronizando secuencias de la base de datos...');

  const tables = [
    'users',
    'projects',
    'tasks',
    'tags',
    'task_statuses',
    'audit_logs',
  ];

  for (const table of tables) {
    try {
      // PostgreSQL specific: Reset sequence to MAX(id) + 1
      await prisma.$executeRawUnsafe(`
        SELECT setval(pg_get_serial_sequence('${table}', 'id'), COALESCE(MAX(id), 0) + 1, false) FROM "${table}";
      `);
      console.log(`✅ Secuencia sincronizada para: ${table}`);
    } catch (error) {
      console.warn(
        `⚠️ Error sincronizando ${table} (puede que no tenga secuencia o IDs explícitos):`,
        error.message,
      );
    }
  }

  console.log('🏁 Sincronización completada.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
