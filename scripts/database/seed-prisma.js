import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed local con Prisma...");

  const adminId = 1;

  // 1. Crear Estados
  const statuses = [
    { id: 1, name: "pending" },
    { id: 2, name: "in_progress" },
    { id: 3, name: "review" },
    { id: 4, name: "completed" },
  ];

  for (const s of statuses) {
    await prisma.taskStatus.upsert({
      where: { id: s.id },
      update: {},
      create: s,
    });
  }

  // 2. Crear Proyectos asignados al Admin
  const projects = [
    {
      name: "Rediseño Web",
      description: "Nueva interfaz 2024",
      creatorId: adminId,
    },
    {
      name: "App Móvil v2",
      description: "Migración a React Native",
      creatorId: adminId,
    },
    {
      name: "Integración API",
      description: "Conexión con CRM externo",
      creatorId: adminId,
    },
  ];

  for (const p of projects) {
    const createdProject = await prisma.project.create({
      data: {
        ...p,
        users: {
          create: { userId: adminId },
        },
      },
    });

    // 3. Crear Tareas para cada proyecto
    await prisma.task.create({
      data: {
        description: `Tarea inicial para ${createdProject.name}`,
        projectId: createdProject.id,
        statusId: 1,
        priority: "medium",
        users: {
          create: { userId: adminId },
        },
      },
    });
  }

  console.log(
    "✅ Seed completado: Proyectos y tareas asignados al Admin (ID: 1)",
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
