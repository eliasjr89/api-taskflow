import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function listUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        lastname: true,
        role: true,
      },
      take: 20,
    });

    console.log("\n📋 Usuarios en la base de datos:\n");
    users.forEach((user) => {
      console.log(`👤 ${user.role.toUpperCase()}: ${user.email}`);
      console.log(`   Nombre: ${user.name} ${user.lastname}`);
      console.log(`   Username: ${user.username}`);
      console.log(`   ID: ${user.id}\n`);
    });

    console.log(`\n✅ Total: ${users.length} usuarios\n`);
    console.log("💡 Las contraseñas están hasheadas en la BD.");
    console.log(
      "💡 Si no recuerdas las contraseñas, puedes usar reset-passwords.js\n"
    );
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers();
