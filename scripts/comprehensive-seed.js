import { pool } from '../src/db/database.js';
import bcrypt from 'bcrypt';

async function seedDatabase() {
  const client = await pool.connect();

  try {
    console.log('🚀 Iniciando seed de base de datos...\n');
    await client.query('BEGIN');
    console.log('🧹 Limpiando datos existentes...');
    await client.query(
      'TRUNCATE TABLE tasks_tags, tasks_users, projects_users, tasks, projects, tags, task_statuses, users RESTART IDENTITY CASCADE',
    );

    // 2. Crear usuarios
    console.log('👥 Creando usuarios...');
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
        username: 'auditor',
        email: 'auditor@taskflow.com',
        password: 'Auditor123',
        name: 'Auditor',
        lastname: 'TaskFlow',
        role: 'manager',
      }, // Role manager per request/legacy
      {
        username: 'manager',
        email: 'manager@taskflow.com',
        password: 'Manager123',
        name: 'Manager',
        lastname: 'TaskFlow',
        role: 'manager',
      },
      {
        username: 'user1',
        email: 'user1@taskflow.com',
        password: 'User123',
        name: 'User',
        lastname: 'One',
        role: 'user',
      },
      {
        username: 'user2',
        email: 'user2@taskflow.com',
        password: 'User123',
        name: 'User',
        lastname: 'Two',
        role: 'user',
      },
    ];

    const userIds = [];
    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      const result = await client.query(
        `INSERT INTO users (username, email, password, name, lastname, role) 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [
          user.username,
          user.email,
          hashedPassword,
          user.name,
          user.lastname,
          user.role,
        ],
      );
      userIds.push(result.rows[0].id);
      console.log(`  ✓ ${user.username} (${user.role})`);
    }

    // 3. Crear estados
    console.log('\n📊 Creando estados...');
    const statuses = [
      { name: 'Pendiente' },
      { name: 'En Progreso' },
      { name: 'Completada' },
      { name: 'Bloqueada' },
      { name: 'En Revisión' },
    ];
    const statusIds = [];
    for (const s of statuses) {
      const res = await client.query(
        'INSERT INTO task_statuses (name) VALUES ($1) RETURNING id',
        [s.name],
      );
      statusIds.push(res.rows[0].id);
    }

    // 4. Crear etiquetas
    console.log('\n🏷️  Creando etiquetas...');
    const tags = [
      { name: 'Frontend', color: '#3b82f6' },
      { name: 'Backend', color: '#10b981' },
      { name: 'Database', color: '#8b5cf6' },
      { name: 'Bug', color: '#ef4444' },
      { name: 'Feature', color: '#06b6d4' },
      { name: 'Urgent', color: '#f59e0b' },
      { name: 'Training', color: '#ec4899' },
      { name: 'DevOps', color: '#6366f1' },
    ];
    const tagIds = [];
    for (const t of tags) {
      const res = await client.query(
        'INSERT INTO tags (name, color) VALUES ($1, $2) RETURNING id',
        [t.name, t.color],
      );
      tagIds.push(res.rows[0].id);
    }

    // 5. Crear Proyectos (Mixed ownership)
    console.log('\n📁 Creando proyectos...');
    const projectData = [
      { name: 'Admin Project Alpha', creator_id: userIds[0] },
      { name: 'Admin Infrastructure', creator_id: userIds[0] },
      { name: 'Manager Sales', creator_id: userIds[2] },
      { name: 'Manager Marketing', creator_id: userIds[2] },
      { name: 'Auditor Compliance', creator_id: userIds[1] },
      { name: 'Auditor Review', creator_id: userIds[1] },
      { name: 'Shared Initiative', creator_id: userIds[0] },
      { name: 'User1 Project', creator_id: userIds[3] },
      { name: 'User2 Project', creator_id: userIds[4] },
    ];
    const projectIds = [];
    for (const p of projectData) {
      const res = await client.query(
        'INSERT INTO projects (name, description, creator_id) VALUES ($1, $2, $3) RETURNING id',
        [p.name, 'Generated project', p.creator_id],
      );
      projectIds.push(res.rows[0].id);
    }

    // Asignar usuarios a proyectos (crucial for visibility)
    // Admin sees all? Or just theirs. Seed implies isolation verified by login.
    // Admin owns 0,1,6.
    // Manager owns 2,3.
    // Auditor owns 4,5.
    // Let's add Manager to Shared Initiative (6)
    await client.query(
      'INSERT INTO projects_users (project_id, user_id) VALUES ($1, $2)',
      [projectIds[6], userIds[2]],
    );
    // User1 owns 7
    // User2 owns 8

    // 6. Generar Tareas (5-10 per user)
    console.log('\n✅ Generando tareas (5-10 por usuario)...');

    const createTask = async (title, projectId, statusId, assigneeId) => {
      const date = new Date();
      date.setDate(date.getDate() + Math.random() * 30);
      const res = await client.query(
        `INSERT INTO tasks (description, project_id, status_id, priority, due_date, completed)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [title, projectId, statusId, 'medium', date, statusId === statusIds[2]],
      );
      const taskId = res.rows[0].id;
      // Assign
      await client.query(
        'INSERT INTO tasks_users (task_id, user_id) VALUES ($1, $2)',
        [taskId, assigneeId],
      );

      // Add random tag
      const randomTag = tagIds[Math.floor(Math.random() * tagIds.length)];
      await client.query(
        'INSERT INTO tasks_tags (task_id, tag_id) VALUES ($1, $2)',
        [taskId, randomTag],
      );
    };

    // Tasks for Admin (userIds[0]) - Projects 0, 1, 6
    for (let i = 0; i < 8; i++) {
      await createTask(
        `Admin Task ${i + 1}`,
        projectIds[i % 2],
        statusIds[i % 5],
        userIds[0],
      );
    }
    // Tasks for Auditor (userIds[1]) - Projects 4, 5
    for (let i = 0; i < 7; i++) {
      await createTask(
        `Auditor Task ${i + 1}`,
        projectIds[4 + (i % 2)],
        statusIds[i % 5],
        userIds[1],
      );
    }
    // Tasks for Manager (userIds[2]) - Projects 2, 3, 6
    for (let i = 0; i < 9; i++) {
      await createTask(
        `Manager Task ${i + 1}`,
        projectIds[2 + (i % 2)],
        statusIds[i % 5],
        userIds[2],
      );
    }
    // Tasks for User1 (userIds[3]) - Project 7
    for (let i = 0; i < 6; i++) {
      await createTask(
        `User1 Task ${i + 1}`,
        projectIds[7],
        statusIds[i % 5],
        userIds[3],
      );
    }
    // Tasks for User2 (userIds[4]) - Project 8
    for (let i = 0; i < 6; i++) {
      await createTask(
        `User2 Task ${i + 1}`,
        projectIds[8],
        statusIds[i % 5],
        userIds[4],
      );
    }

    // Shared Project Tasks
    await createTask(
      'Shared Admin Task',
      projectIds[6],
      statusIds[0],
      userIds[0],
    );
    await createTask(
      'Shared Manager Task',
      projectIds[6],
      statusIds[1],
      userIds[2],
    );

    await client.query('COMMIT');
    console.log('\n✨ Seed completado con éxito.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seedDatabase().then(() => process.exit(0));
