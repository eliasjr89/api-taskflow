import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetUsers() {
  try {
    console.log('🗑️  Limpiando base de datos...\n');

    // 1. Eliminar todos los datos (el orden importa si no hay cascade, pero deleteMany es eficiente)
    await prisma.rolePermission.deleteMany();
    await prisma.permission.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.activeSession.deleteMany();
    await prisma.announcement.deleteMany();
    await prisma.webhook.deleteMany();
    await prisma.tasksOnTags.deleteMany();
    await prisma.tag.deleteMany();
    await prisma.tasksOnUsers.deleteMany();
    await prisma.task.deleteMany();
    await prisma.taskStatus.deleteMany();
    await prisma.projectsOnUsers.deleteMany();
    await prisma.project.deleteMany();
    await prisma.user.deleteMany();
    await prisma.role.deleteMany();
    await prisma.systemSetting.deleteMany();

    console.log('✅ Datos eliminados');
    console.log(
      '✅ Base de datos limpia (SQLite maneja IDs automáticamente)\n',
    );

    // 2. Crear Roles básicos
    console.log('🛡️  Creando roles...');
    const roles = [
      { name: 'admin', description: 'Super Administrator', isSystem: true },
      { name: 'manager', description: 'Project Manager', isSystem: true },
      { name: 'user', description: 'Standard User', isSystem: true },
      { name: 'auditor', description: 'System Auditor', isSystem: false },
    ];

    for (const r of roles) {
      await prisma.role.create({ data: r });
    }
    console.log('✅ Roles creados\n');

    // 3. Crear los usuarios de prueba
    console.log('👥 Creando usuarios de prueba...\n');

    const users = [
      {
        username: 'admin',
        email: 'admin@taskflow.com',
        password: 'Admin123',
        name: 'Admin',
        lastname: 'TaskFlow',
        role: 'admin',
      },
      {
        username: 'manager',
        email: 'manager@taskflow.com',
        password: 'Manager123',
        name: 'Manager',
        lastname: 'TaskFlow',
        role: 'manager',
      },
      {
        username: 'user',
        email: 'user@taskflow.com',
        password: 'User123',
        name: 'User',
        lastname: 'Alpha',
        role: 'user',
      },
      {
        username: 'user2',
        email: 'user2@taskflow.com',
        password: 'User123',
        name: 'User',
        lastname: 'Beta',
        role: 'user',
      },
    ];

    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);

      const roleRecord = await prisma.role.findUnique({
        where: { name: user.role },
      });

      // Validación explícita: si no se encuentra el rol, lanzar error en lugar de asignar null
      if (!roleRecord) {
        throw new Error(
          `❌ No se encontró el rol '${user.role}' en la tabla roles. Verifica la configuración RBAC.`,
        );
      }

      const createdUser = await prisma.user.create({
        data: {
          username: user.username,
          email: user.email,
          password: hashedPassword,
          name: user.name,
          lastname: user.lastname,
          role: user.role,
          roleId: roleRecord.id, // Usar directamente, ya validado arriba
        },
      });

      console.log(`✅ ${user.role.toUpperCase().padEnd(8)} creado:`);
      console.log(`   ID: ${createdUser.id}`);
      console.log(`   Username: ${createdUser.username}`);
      console.log(`   Email: ${createdUser.email}`);
      console.log(`   Password: ${user.password}`);
      console.log(
        `   Role: ${createdUser.role} (roleId: ${createdUser.roleId})\n`,
      );
    }

    // 4. Verificación de integridad: confirmar que TODOS los usuarios tienen el roleId correcto
    console.log('🔍 Verificando integridad de roles...');
    const usersWithRoles = await prisma.user.findMany({
      include: { roleRel: { select: { name: true } } },
    });

    let integrityPassed = true;
    for (const u of usersWithRoles) {
      const expectedMatchesActual = u.roleRel?.name === u.role;
      if (!expectedMatchesActual) {
        console.error(
          `   ❌ MISMATCH: ${u.email} - legacy role='${u.role}', pero roleRel.name='${u.roleRel?.name}' (roleId=${u.roleId})`,
        );
        integrityPassed = false;
      } else {
        console.log(
          `   ✅ ${u.email.padEnd(28)} role='${u.role}' → roleId=${u.roleId} (${u.roleRel?.name})`,
        );
      }
    }

    if (!integrityPassed) {
      throw new Error(
        '❌ Verificación de integridad de roles fallida. Revisa los datos.',
      );
    }
    console.log('✅ Integridad verificada correctamente\n');

    console.log('╔════════════════════════════════════════════════╗');
    console.log('║     ✅ BASE DE DATOS RESETEADA EXITOSAMENTE    ║');
    console.log('╚════════════════════════════════════════════════╝\n');

    console.log('📝 Credenciales de acceso:\n');
    console.log('ADMIN:');
    console.log('  Email:    admin@taskflow.com');
    console.log('  Password: Admin123');
    console.log('  Role:     admin (panel de administración)\n');

    console.log('MANAGER:');
    console.log('  Email:    manager@taskflow.com');
    console.log('  Password: Manager123');
    console.log('  Role:     manager (panel de administración)\n');

    console.log('USER 1:');
    console.log('  Email:    user@taskflow.com');
    console.log('  Password: User123');
    console.log('  Role:     user (panel de usuario)\n');

    console.log('USER 2:');
    console.log('  Email:    user2@taskflow.com');
    console.log('  Password: User123');
    console.log('  Role:     user (panel de usuario)\n');

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

resetUsers();
