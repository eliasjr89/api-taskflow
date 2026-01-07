import 'dotenv/config';
import { pool } from '../../src/db/database.js';
import bcrypt from 'bcrypt';

async function resetUsers() {
  try {
    console.log('🗑️  Limpiando base de datos...\n');

    // 1. Eliminar todos los usuarios y datos referenciales
    // 1. Eliminar todos los usuarios y datos referenciales (Ordered by dependency)
    await pool.query('DELETE FROM role_permissions');
    await pool.query('DELETE FROM permissions');
    // Roles deletions might fail if users reference them, so update users first or rely on cascade if configured?
    // Users reference Roles. So delete Users first, then Roles.

    await pool.query('DELETE FROM audit_logs');
    await pool.query('DELETE FROM active_sessions'); // New
    await pool.query('DELETE FROM announcements'); // New
    await pool.query('DELETE FROM webhooks'); // New
    await pool.query('DELETE FROM tasks_tags');
    await pool.query('DELETE FROM tags');
    await pool.query('DELETE FROM tasks');
    await pool.query('DELETE FROM task_statuses');
    await pool.query('DELETE FROM projects');

    // Now safe to delete users and roles
    await pool.query('DELETE FROM users');
    await pool.query('DELETE FROM roles');

    await pool.query('DELETE FROM system_settings'); // New
    console.log('✅ Datos eliminados');

    // 2. Resetear el contador de IDs
    await pool.query('ALTER SEQUENCE users_id_seq RESTART WITH 1');
    // También resetear secuencias de proyectos y tareas si existen (para consistencia en tests)
    try {
      await pool.query('ALTER SEQUENCE projects_id_seq RESTART WITH 1');
      await pool.query('ALTER SEQUENCE tasks_id_seq RESTART WITH 1');
      await pool.query('ALTER SEQUENCE tags_id_seq RESTART WITH 1');
      await pool.query('ALTER SEQUENCE task_statuses_id_seq RESTART WITH 1');
    } catch {
      console.log('⚠️  Nota: No se pudieron resetear algunas secuencias');
    }
    console.log('✅ Secuencias reseteadas\n');

    // 3. Crear los 3 usuarios de prueba
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

      const result = await pool.query(
        `INSERT INTO users (username, email, password, name, lastname, role, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) 
         RETURNING id, username, email, name, lastname, role`,
        [
          user.username,
          user.email,
          hashedPassword,
          user.name,
          user.lastname,
          user.role,
        ],
      );

      console.log(`✅ ${user.role.toUpperCase().padEnd(8)} creado:`);
      console.log(`   ID: ${result.rows[0].id}`);
      console.log(`   Username: ${result.rows[0].username}`);
      console.log(`   Email: ${result.rows[0].email}`);
      console.log(`   Password: ${user.password}`);
      console.log(`   Role: ${result.rows[0].role}\n`);
    }

    console.log('╔════════════════════════════════════════════════╗');
    console.log('║     ✅ BASE DE DATOS RESETEADA EXITOSAMENTE    ║');
    console.log('╚════════════════════════════════════════════════╝\n');

    console.log('📝 Credenciales de acceso:\n');
    console.log('ADMIN:');
    console.log('  Email: admin@taskflow.com');
    console.log('  Password: Admin123\n');

    console.log('MANAGER:');
    console.log('  Email: manager@taskflow.com');
    console.log('  Password: Manager123\n');

    console.log('USER 1:');
    console.log('  Email: user@taskflow.com');
    console.log('  Password: User123\n');

    console.log('USER 2:');
    console.log('  Email: user2@taskflow.com');
    console.log('  Password: User123\n');

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
    process.exit(1);
  }
}

resetUsers();
