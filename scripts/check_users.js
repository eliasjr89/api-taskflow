import { prisma } from '../src/lib/prisma.js';

async function main() {
  try {
    const users = await prisma.user.findMany({
      include: {
        _count: {
          select: { tasks: true },
        },
      },
    });

    console.log('--- User Data Summary ---');
    if (users.length === 0) {
      console.log('No users found.');
    } else {
      users.forEach((u) => {
        console.log(
          `User: ${u.email} | Role: ${u.role} | ID: ${u.id} | Tasks: ${u._count.tasks}`,
        );
      });
    }
    console.log('-------------------------');
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
