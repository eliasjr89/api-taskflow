import 'dotenv/config';
import { pool } from '../../src/db/database.js';

async function seedDatabase() {
  try {
    console.log('🌱 Poblando base de datos con datos de prueba...\n');

    // 0. CREAR DATOS DE REFERENCIA (STATUSES Y TAGS)
    console.log('📚 Creando datos de referencia...');

    const statuses = [
      { id: 1, name: 'pending' },
      { id: 2, name: 'in_progress' },
      { id: 3, name: 'review' },
      { id: 4, name: 'completed' },
    ];

    for (const status of statuses) {
      await pool.query(
        'INSERT INTO task_statuses (id, name) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING',
        [status.id, status.name],
      );
    }
    console.log(`   ✅ ${statuses.length} estados creados`);

    const tags = [
      { id: 1, name: 'frontend' },
      { id: 2, name: 'backend' },
      { id: 3, name: 'urgent' },
      { id: 4, name: 'bug' },
      { id: 5, name: 'feature' },
      { id: 6, name: 'ui' },
      { id: 7, name: 'api' },
    ];

    for (const tag of tags) {
      await pool.query(
        'INSERT INTO tags (id, name) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING',
        [tag.id, tag.name],
      );
    }
    console.log(`   ✅ ${tags.length} etiquetas creadas\n`);

    // 0.5. CREAR ROLES Y PERMISOS (RBAC)
    console.log('🛡️  Configurando Roles y Permisos (RBAC)...');

    // Define Permissions
    const permissions = [
      {
        action: 'manage',
        resource: 'all',
        description: 'Full access to everything',
      },
      {
        action: 'read',
        resource: 'dashboard',
        description: 'View dashboard metrics',
      },
      {
        action: 'manage',
        resource: 'users',
        description: 'Create, update, delete users',
      },
      {
        action: 'read',
        resource: 'users',
        description: 'View user list and profiles',
      },
      {
        action: 'impersonate',
        resource: 'users',
        description: 'Login as another user',
      },
      {
        action: 'view',
        resource: 'audit_logs',
        description: 'Access system audit logs',
      },
      {
        action: 'manage',
        resource: 'system',
        description: 'System settings, maintenance mode',
      },
    ];

    const permissionMap = new Map();

    for (const p of permissions) {
      const res = await pool.query(
        'INSERT INTO permissions (action, resource, description, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) ON CONFLICT (action, resource) DO UPDATE SET description = EXCLUDED.description RETURNING id',
        [p.action, p.resource, p.description],
      );
      permissionMap.set(`${p.action}:${p.resource}`, res.rows[0].id);
    }
    console.log(`   ✅ ${permissions.length} permisos definidos`);

    // Define Roles
    const roles = [
      { name: 'admin', description: 'Super Administrator', isSystem: true },
      { name: 'manager', description: 'Project Manager', isSystem: true },
      { name: 'user', description: 'Standard User', isSystem: true },
      { name: 'auditor', description: 'System Auditor', isSystem: false },
    ];

    const roleMap = new Map();

    for (const r of roles) {
      const res = await pool.query(
        'INSERT INTO roles (name, description, is_system, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description RETURNING id',
        [r.name, r.description, r.isSystem],
      );
      roleMap.set(r.name, res.rows[0].id);
    }
    console.log(`   ✅ ${roles.length} roles definidos`);

    // Assign Permissions to Roles
    const rolePermissions = [
      // Admin: Everything
      { role: 'admin', permission: 'manage:all' },

      // Manager: Manage Users + Read Dashboard
      { role: 'manager', permission: 'read:dashboard' },
      { role: 'manager', permission: 'manage:users' },

      // Auditor: Read Audit Logs + Read Users + Read Dashboard
      { role: 'auditor', permission: 'read:dashboard' },
      { role: 'auditor', permission: 'read:users' },
      { role: 'auditor', permission: 'view:audit_logs' },
    ];

    for (const rp of rolePermissions) {
      const rId = roleMap.get(rp.role);
      const pId = permissionMap.get(rp.permission);

      if (rId && pId) {
        await pool.query(
          'INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [rId, pId],
        );
      }
    }
    console.log('   ✅ Permisos asignados a roles\n');

    // 1. CREAR PROYECTOS
    console.log('📁 Creando proyectos...');

    const projects = [
      {
        name: 'Website Redesign',
        description: 'Rediseño completo del sitio web corporativo',
        creator_id: 1, // admin
      },
      {
        name: 'Mobile App Development',
        description: 'Desarrollo de aplicación móvil para iOS y Android',
        creator_id: 1, // admin
      },
      {
        name: 'API Integration',
        description: 'Integración de APIs de terceros',
        creator_id: 2, // manager
      },
      {
        name: 'Database Migration',
        description: 'Migración de base de datos a PostgreSQL',
        creator_id: 2, // manager
      },
    ];

    const projectIds = [];
    for (const project of projects) {
      const result = await pool.query(
        'INSERT INTO projects (name, description, creator_id, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING id',
        [project.name, project.description, project.creator_id],
      );
      projectIds.push(result.rows[0].id);
      console.log(`   ✅ ${project.name} (ID: ${result.rows[0].id})`);
    }

    // 2. ASIGNAR USUARIOS A PROYECTOS (Mixing Admin, Manager, User1, User2)
    console.log('\n👥 Asignando colaboradores a proyectos...');

    const projectUserAssignments = [
      // Website Redesign (All hands on deck)
      { project_id: projectIds[0], user_id: 1 }, // Admin
      { project_id: projectIds[0], user_id: 2 }, // Manager
      { project_id: projectIds[0], user_id: 3 }, // User1
      { project_id: projectIds[0], user_id: 4 }, // User2

      // Mobile App (Manager + User2 + Admin)
      { project_id: projectIds[1], user_id: 1 },
      { project_id: projectIds[1], user_id: 2 },
      { project_id: projectIds[1], user_id: 4 }, // User2 leads mobile?

      // API Integration (Manager + User1 + User2)
      { project_id: projectIds[2], user_id: 2 },
      { project_id: projectIds[2], user_id: 3 }, // User1
      { project_id: projectIds[2], user_id: 4 }, // User2

      // Database Migration (Admin + Manager + User1)
      { project_id: projectIds[3], user_id: 1 },
      { project_id: projectIds[3], user_id: 2 },
      { project_id: projectIds[3], user_id: 3 }, // User1
    ];

    for (const assignment of projectUserAssignments) {
      await pool.query(
        'INSERT INTO projects_users (project_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [assignment.project_id, assignment.user_id],
      );
    }
    console.log(`   ✅ ${projectUserAssignments.length} asignaciones creadas`);

    // 3. CREAR TAREAS
    console.log('\n📋 Creando tareas...');

    const tasks = [
      // Website Redesign
      {
        description: 'Diseñar mockups de la página principal',
        project_id: projectIds[0],
        status_id: 2, // in_progress
        priority: 'high',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      {
        description: 'Implementar diseño responsive (Mobile First)',
        project_id: projectIds[0],
        status_id: 1, // pending
        priority: 'medium',
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
      {
        description: 'Optimizar imágenes y assets',
        project_id: projectIds[0],
        status_id: 3, // review
        priority: 'low',
        due_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      },
      // Mobile App
      {
        description: 'Configurar proyecto React Native',
        project_id: projectIds[1],
        status_id: 4, // completed
        priority: 'high',
        due_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        completed: true,
      },
      {
        description: 'Implementar autenticación Biometrica',
        project_id: projectIds[1],
        status_id: 2, // in_progress
        priority: 'high',
        due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      },
      {
        description: 'Diseñar pantallas de perfil',
        project_id: projectIds[1],
        status_id: 1, // pending
        priority: 'medium',
        due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      },
      // API Integration
      {
        description: 'Documentar endpoints de terceros (Swagger)',
        project_id: projectIds[2],
        status_id: 4, // completed
        priority: 'medium',
        due_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        completed: true,
      },
      {
        description: 'Implementar cliente HTTP Axios',
        project_id: projectIds[2],
        status_id: 2, // in_progress
        priority: 'high',
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      },
      {
        description: 'Agregar manejo de errores global (Interceptors)',
        project_id: projectIds[2],
        status_id: 1, // pending
        priority: 'medium',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      // Database Migration
      {
        description: 'Analizar esquema actual Legacy',
        project_id: projectIds[3],
        status_id: 4, // completed
        priority: 'high',
        due_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        completed: true,
      },
      {
        description: 'Crear scripts de migración SQL',
        project_id: projectIds[3],
        status_id: 3, // review
        priority: 'high',
        due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      },
      {
        description: 'Probar migración en staging environment',
        project_id: projectIds[3],
        status_id: 1, // pending
        priority: 'high',
        due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      },
    ];

    const taskIds = [];
    for (const task of tasks) {
      const result = await pool.query(
        `INSERT INTO tasks (description, project_id, status_id, priority, due_date, completed, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING id`,
        [
          task.description,
          task.project_id,
          task.status_id,
          task.priority,
          task.due_date,
          task.completed || false,
        ],
      );
      taskIds.push(result.rows[0].id);
      console.log(
        `   ✅ ${task.description.substring(0, 40)}... (ID: ${
          result.rows[0].id
        })`,
      );
    }

    // 4. ASIGNAR USUARIOS A TAREAS
    console.log('\n👤 Asignando usuarios a tareas...');

    const taskUserAssignments = [
      // Website Redesign tasks
      { task_id: taskIds[0], user_id: 3 }, // User1
      { task_id: taskIds[0], user_id: 4 }, // User2
      { task_id: taskIds[1], user_id: 2 }, // Manager
      { task_id: taskIds[2], user_id: 3 }, // User1

      // Mobile App tasks
      { task_id: taskIds[3], user_id: 1 }, // Admin
      { task_id: taskIds[4], user_id: 4 }, // User2 (Mobile Dev)
      { task_id: taskIds[5], user_id: 4 }, // User2

      // API Integration tasks
      { task_id: taskIds[6], user_id: 2 }, // Manager
      { task_id: taskIds[7], user_id: 3 }, // User1 (Backend Dev)
      { task_id: taskIds[8], user_id: 3 }, // User1
      { task_id: taskIds[8], user_id: 4 }, // User2 (helping)

      // Database Migration tasks
      { task_id: taskIds[9], user_id: 1 }, // Admin
      { task_id: taskIds[10], user_id: 2 }, // Manager
      { task_id: taskIds[11], user_id: 1 }, // Admin
    ];

    for (const assignment of taskUserAssignments) {
      await pool.query(
        'INSERT INTO tasks_users (task_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [assignment.task_id, assignment.user_id],
      );
    }
    console.log(`   ✅ ${taskUserAssignments.length} asignaciones creadas`);

    // 5. ASIGNAR ETIQUETAS A TAREAS
    console.log('\n🔖 Asignando etiquetas a tareas...');

    const taskTagAssignments = [
      // Website Redesign
      { task_id: taskIds[0], tag_id: 6 }, // ui
      { task_id: taskIds[0], tag_id: 1 }, // frontend
      { task_id: taskIds[1], tag_id: 1 }, // frontend
      { task_id: taskIds[1], tag_id: 6 }, // ui
      { task_id: taskIds[2], tag_id: 6 }, // ui

      // Mobile App
      { task_id: taskIds[3], tag_id: 5 }, // feature
      { task_id: taskIds[3], tag_id: 1 }, // frontend
      { task_id: taskIds[4], tag_id: 2 }, // backend (auth)
      { task_id: taskIds[4], tag_id: 3 }, // urgent
      { task_id: taskIds[5], tag_id: 6 }, // ui

      // API Integration
      { task_id: taskIds[6], tag_id: 7 }, // api
      { task_id: taskIds[7], tag_id: 2 }, // backend
      { task_id: taskIds[7], tag_id: 7 }, // api
      { task_id: taskIds[8], tag_id: 4 }, // bug (preventive)
      { task_id: taskIds[8], tag_id: 2 }, // backend

      // Database Migration
      { task_id: taskIds[9], tag_id: 2 }, // backend
      { task_id: taskIds[10], tag_id: 2 }, // backend
      { task_id: taskIds[10], tag_id: 3 }, // urgent
      { task_id: taskIds[11], tag_id: 2 }, // backend
      { task_id: taskIds[11], tag_id: 3 }, // urgent
      { task_id: taskIds[11], tag_id: 5 }, // feature
    ];

    for (const assignment of taskTagAssignments) {
      try {
        await pool.query(
          'INSERT INTO tasks_tags (task_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [assignment.task_id, assignment.tag_id],
        );
      } catch (e) {
        console.warn(
          `warning: failed to assign tag ${assignment.tag_id} to task ${assignment.task_id}: ${e.message}`,
        );
      }
    }
    console.log(`   ✅ ${taskTagAssignments.length} asignaciones creadas`);

    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║   ✅ BASE DE DATOS POBLADA EXITOSAMENTE        ║');
    console.log('╚════════════════════════════════════════════════╝\n');

    console.log('📊 RESUMEN:');
    console.log(`   Proyectos creados: ${projects.length}`);
    console.log(`   Tareas creadas: ${tasks.length}`);
    console.log(`   Colaboradores asignados: ${projectUserAssignments.length}`);
    console.log(`   Tareas asignadas: ${taskUserAssignments.length}`);
    console.log(`   Etiquetas asignadas: ${taskTagAssignments.length}\n`);

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
    process.exit(1);
  }
}

seedDatabase();
