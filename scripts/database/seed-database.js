import 'dotenv/config';
import { pool } from '../../src/db/database.js';

async function seedDatabase() {
  try {
    console.log('🌱 Poblando base de datos con datos de prueba...\n');

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
        'INSERT INTO projects (name, description, creator_id) VALUES ($1, $2, $3) RETURNING id',
        [project.name, project.description, project.creator_id],
      );
      projectIds.push(result.rows[0].id);
      console.log(`   ✅ ${project.name} (ID: ${result.rows[0].id})`);
    }

    // 2. ASIGNAR USUARIOS A PROYECTOS
    console.log('\n👥 Asignando colaboradores a proyectos...');

    const projectUserAssignments = [
      { project_id: projectIds[0], user_id: 1 }, // admin en Website Redesign
      { project_id: projectIds[0], user_id: 2 }, // manager en Website Redesign
      { project_id: projectIds[0], user_id: 3 }, // user en Website Redesign
      { project_id: projectIds[1], user_id: 1 }, // admin en Mobile App
      { project_id: projectIds[1], user_id: 2 }, // manager en Mobile App
      { project_id: projectIds[2], user_id: 2 }, // manager en API Integration
      { project_id: projectIds[2], user_id: 3 }, // user en API Integration
      { project_id: projectIds[3], user_id: 2 }, // manager en Database Migration
      { project_id: projectIds[3], user_id: 1 }, // admin en Database Migration
    ];

    for (const assignment of projectUserAssignments) {
      await pool.query(
        'INSERT INTO projects_users (project_id, user_id) VALUES ($1, $2)',
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
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
      },
      {
        description: 'Implementar diseño responsive',
        project_id: projectIds[0],
        status_id: 1, // pending
        priority: 'medium',
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 días
      },
      {
        description: 'Optimizar imágenes y assets',
        project_id: projectIds[0],
        status_id: 1, // pending
        priority: 'low',
        due_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 días
      },
      // Mobile App
      {
        description: 'Configurar proyecto React Native',
        project_id: projectIds[1],
        status_id: 4, // completed
        priority: 'high',
        due_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // hace 2 días
        completed: true,
      },
      {
        description: 'Implementar autenticación',
        project_id: projectIds[1],
        status_id: 2, // in_progress
        priority: 'high',
        due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 días
      },
      {
        description: 'Diseñar pantallas principales',
        project_id: projectIds[1],
        status_id: 2, // in_progress
        priority: 'medium',
        due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 días
      },
      // API Integration
      {
        description: 'Documentar endpoints de terceros',
        project_id: projectIds[2],
        status_id: 4, // completed
        priority: 'medium',
        due_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // hace 5 días
        completed: true,
      },
      {
        description: 'Implementar cliente HTTP',
        project_id: projectIds[2],
        status_id: 2, // in_progress
        priority: 'high',
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 días
      },
      {
        description: 'Agregar manejo de errores',
        project_id: projectIds[2],
        status_id: 1, // pending
        priority: 'medium',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
      },
      // Database Migration
      {
        description: 'Analizar esquema actual',
        project_id: projectIds[3],
        status_id: 4, // completed
        priority: 'high',
        due_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // hace 10 días
        completed: true,
      },
      {
        description: 'Crear scripts de migración',
        project_id: projectIds[3],
        status_id: 2, // in_progress
        priority: 'high',
        due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 días
      },
      {
        description: 'Probar migración en staging',
        project_id: projectIds[3],
        status_id: 1, // pending
        priority: 'high',
        due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 días
      },
    ];

    const taskIds = [];
    for (const task of tasks) {
      const result = await pool.query(
        `INSERT INTO tasks (description, project_id, status_id, priority, due_date, completed) 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
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
      { task_id: taskIds[0], user_id: 3 }, // user
      { task_id: taskIds[1], user_id: 2 }, // manager
      { task_id: taskIds[2], user_id: 3 }, // user
      // Mobile App tasks
      { task_id: taskIds[3], user_id: 1 }, // admin
      { task_id: taskIds[4], user_id: 2 }, // manager
      { task_id: taskIds[5], user_id: 3 }, // user
      // API Integration tasks
      { task_id: taskIds[6], user_id: 2 }, // manager
      { task_id: taskIds[7], user_id: 3 }, // user
      { task_id: taskIds[8], user_id: 3 }, // user
      // Database Migration tasks
      { task_id: taskIds[9], user_id: 1 }, // admin
      { task_id: taskIds[10], user_id: 2 }, // manager
      { task_id: taskIds[11], user_id: 1 }, // admin
    ];

    for (const assignment of taskUserAssignments) {
      await pool.query(
        'INSERT INTO tasks_users (task_id, user_id) VALUES ($1, $2)',
        [assignment.task_id, assignment.user_id],
      );
    }
    console.log(`   ✅ ${taskUserAssignments.length} asignaciones creadas`);

    // 5. ASIGNAR ETIQUETAS A TAREAS
    console.log('\n🔖 Asignando etiquetas a tareas...');

    const taskTagAssignments = [
      // Website Redesign
      { task_id: taskIds[0], tag_id: 6 }, // ui
      { task_id: taskIds[1], tag_id: 1 }, // frontend
      { task_id: taskIds[1], tag_id: 6 }, // ui
      { task_id: taskIds[2], tag_id: 1 }, // frontend
      // Mobile App
      { task_id: taskIds[3], tag_id: 5 }, // feature
      { task_id: taskIds[4], tag_id: 2 }, // backend
      { task_id: taskIds[4], tag_id: 3 }, // urgent
      { task_id: taskIds[5], tag_id: 6 }, // ui
      // API Integration
      { task_id: taskIds[6], tag_id: 7 }, // api
      { task_id: taskIds[7], tag_id: 2 }, // backend
      { task_id: taskIds[7], tag_id: 7 }, // api
      { task_id: taskIds[8], tag_id: 4 }, // bug
      // Database Migration
      { task_id: taskIds[9], tag_id: 2 }, // backend
      { task_id: taskIds[10], tag_id: 2 }, // backend
      { task_id: taskIds[10], tag_id: 3 }, // urgent
      { task_id: taskIds[11], tag_id: 2 }, // backend
      { task_id: taskIds[11], tag_id: 3 }, // urgent
    ];

    for (const assignment of taskTagAssignments) {
      await pool.query(
        'INSERT INTO tasks_tags (task_id, tag_id) VALUES ($1, $2)',
        [assignment.task_id, assignment.tag_id],
      );
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
