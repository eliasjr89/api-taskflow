import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Limpiando base de datos para repoblación limpia...');

  // Limpiar relaciones y tablas dependientes primero
  await prisma.auditLog.deleteMany();
  await prisma.tasksOnUsers.deleteMany();
  await prisma.projectsOnUsers.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  const salt = await bcrypt.genSalt(10);
  const password = await bcrypt.hash('Admin123', salt);

  const roleConfigs = [
    {
      role: 'admin',
      email: 'admin@taskflow.com',
      name: 'Admin',
      lastname: 'Total',
      countRange: [5, 10],
    },
    {
      role: 'manager',
      email: 'manager@taskflow.com',
      name: 'Manager',
      lastname: 'General',
      countRange: [8, 15],
    },
    {
      role: 'user',
      email: 'user@taskflow.com',
      name: 'User',
      lastname: 'Standard',
      countRange: [3, 7],
    },
    {
      role: 'auditor',
      email: 'auditor@taskflow.com',
      name: 'Auditor',
      lastname: 'System',
      countRange: [2, 5],
    },
  ];

  console.log('👥 Creando un usuario por cada rol...');

  const createdUsers = [];
  for (const cfg of roleConfigs) {
    const user = await prisma.user.create({
      data: {
        email: cfg.email,
        username: cfg.role,
        name: cfg.name,
        lastname: cfg.lastname,
        password: password,
        role: cfg.role,
      },
    });
    createdUsers.push({ ...user, range: cfg.countRange });
  }

  console.log('🏗️ Creando proyectos y tareas aleatorias...');

  const projectsBase = [
    'Sistema de Seguridad',
    'Rediseño Modular',
    'Optimización SQL',
    'App Mobile v3',
    'Integración ERP',
    'Dashboard Ejecutivo',
    'Auditoría Anual',
    'Campaña Primavera',
    'Backup Global',
  ];

  const createdProjects = [];
  for (const name of projectsBase) {
    const p = await prisma.project.create({
      data: {
        name,
        description: `Descripción del proyecto ${name}`,
        creatorId: createdUsers[0].id, // Admin como creador por defecto
      },
    });
    createdProjects.push(p);
  }

  for (const user of createdUsers) {
    const numItems =
      Math.floor(Math.random() * (user.range[1] - user.range[0] + 1)) +
      user.range[0];
    console.log(`✨ Generando ${numItems} elementos para ${user.email}...`);

    // Asignar a 2-4 proyectos al azar
    const numProj = Math.floor(Math.random() * 3) + 2;
    const shuffledProj = createdProjects
      .sort(() => 0.5 - Math.random())
      .slice(0, numProj);

    for (const p of shuffledProj) {
      await prisma.projectsOnUsers.create({
        data: { projectId: p.id, userId: user.id },
      });
    }

    // Crear tareas aleatorias
    for (let i = 1; i <= numItems; i++) {
      const proj =
        shuffledProj[Math.floor(Math.random() * shuffledProj.length)];
      await prisma.task.create({
        data: {
          description: `Tarea ${i} de ${user.username}: ${proj.name}`,
          projectId: proj.id,
          statusId: Math.floor(Math.random() * 4) + 1,
          priority: ['low', 'medium', 'high', 'urgent'][
            Math.floor(Math.random() * 4)
          ],
          users: {
            create: { userId: user.id },
          },
        },
      });
    }
  }

  console.log('✅ Repoblación finalizada con éxito.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
