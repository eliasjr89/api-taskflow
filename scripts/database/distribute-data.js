import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Iniciando distribución de carga de trabajo...');

  const users = await prisma.user.findMany();
  const admin = users.find((u) => u.role === 'admin') || users[0];
  const manager = users.find((u) => u.role === 'manager') || users[1];

  // 1. Crear Proyectos Variados
  const projectData = [
    {
      name: 'Infraestructura Cloud',
      description: 'Migración a AWS',
      creatorId: admin.id,
    },
    {
      name: 'Campaña Marketing',
      description: 'Lanzamiento Q3',
      creatorId: manager.id,
    },
    {
      name: 'Seguridad Operativa',
      description: 'Auditoría de accesos',
      creatorId: admin.id,
    },
    {
      name: 'Portal de Clientes',
      description: 'Nueva área privada',
      creatorId: manager.id,
    },
  ];

  const createdProjects = [];
  for (const p of projectData) {
    const proj = await prisma.project.create({ data: p });
    createdProjects.push(proj);
  }

  // 2. Tareas por Usuario (asegurar más de 3 para probar la UI expandible)
  for (const user of users) {
    console.log(`📦 Asignando contenido a: ${user.email} (${user.role})`);

    // Asignar al usuario a 2 proyectos al azar
    const userProjects = createdProjects.slice(0, 2);
    for (const p of userProjects) {
      await prisma.projectsOnUsers.upsert({
        where: { projectId_userId: { projectId: p.id, userId: user.id } },
        update: {},
        create: { projectId: p.id, userId: user.id },
      });
    }

    // Crear 5 tareas distintas para cada usuario
    for (let i = 1; i <= 5; i++) {
      await prisma.task.create({
        data: {
          description: `Tarea ${i} de alta prioridad para ${user.username}`,
          projectId: userProjects[i % 2].id,
          statusId: (i % 4) + 1,
          priority: i % 2 === 0 ? 'high' : 'medium',
          users: {
            create: { userId: user.id },
          },
        },
      });
    }
  }

  console.log(
    '✅ Distribución terminada. Cada usuario tiene al menos 5 tareas y 2 proyectos.',
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
