// scripts/seed_data.js
import { pool } from '../src/db/database.js';

async function seed() {
  console.log('🌱 Starting database seeding...');

  try {
    // 1. Get existing users
    const usersRes = await pool.query('SELECT id, username, role FROM users');
    const users = usersRes.rows;

    if (users.length === 0) {
      console.log(
        '❌ No users found. Please register at least one user first.',
      );
      process.exit(1);
    }

    // 2. Clear existing data (except users)
    console.log('🧹 Clearing old data...');
    await pool.query('DELETE FROM tasks_users');
    await pool.query('DELETE FROM tasks_tags');
    await pool.query('DELETE FROM projects_users');
    await pool.query('DELETE FROM tasks');
    await pool.query('DELETE FROM tags');
    await pool.query('DELETE FROM projects');
    await pool.query('DELETE FROM task_statuses');

    // 3. Seed Task Statuses
    console.log('📊 Seeding task statuses...');
    const statuses = [
      'To Do',
      'In Progress',
      'In Review',
      'Completed',
      'On Hold',
      'Cancelled',
      'Blocked',
      'Planned',
      'Testing',
      'Deployed',
    ];
    const statusIds = [];
    for (const name of statuses) {
      const res = await pool.query(
        'INSERT INTO task_statuses (name) VALUES ($1) RETURNING id',
        [name],
      );
      statusIds.push(res.rows[0].id);
    }

    // 4. Seed Tags
    console.log('🏷️ Seeding tags...');
    const tags = [
      { name: 'Feature', color: 'indigo' },
      { name: 'Bug', color: 'rose' },
      { name: 'Design', color: 'purple' },
      { name: 'Refactor', color: 'amber' },
      { name: 'Documentation', color: 'blue' },
      { name: 'High Priority', color: 'red' },
      { name: 'Frontend', color: 'cyan' },
      { name: 'Backend', color: 'emerald' },
      { name: 'UI/UX', color: 'pink' },
      { name: 'API', color: 'teal' },
    ];
    const tagIds = [];
    for (const tag of tags) {
      const res = await pool.query(
        'INSERT INTO tags (name, color) VALUES ($1, $2) RETURNING id',
        [tag.name, tag.color],
      );
      tagIds.push(res.rows[0].id);
    }

    // 5. Seed Projects
    console.log('📂 Seeding projects...');
    const projectData = [
      {
        name: 'TaskFlow Redesign',
        description: 'Modernizing the user interface',
        icon: 'Zap',
      },
      {
        name: 'API Integration',
        description: 'Connecting third-party services',
        icon: 'Briefcase',
      },
      {
        name: 'Mobile App',
        description: 'Developing iOS and Android versions',
        icon: 'Smartphone',
      },
      {
        name: 'Marketing Campaign',
        description: 'Launch events for Q4',
        icon: 'Star',
      },
      {
        name: 'Cloud Migration',
        description: 'Moving infrastructure to AWS',
        icon: 'Cloud',
      },
      {
        name: 'Customer Support Portal',
        description: 'Building a help desk',
        icon: 'Heart',
      },
      {
        name: 'Data Analytics',
        description: 'Implementing dashboard metrics',
        icon: 'TrendingUp',
      },
      {
        name: 'Security Audit',
        description: 'Compliance and vulnerability testing',
        icon: 'ShieldCheck',
      },
      {
        name: 'Performance Review',
        description: 'Quarterly team evaluations',
        icon: 'Target',
      },
      {
        name: 'Community Forum',
        description: 'Platform for user interaction',
        icon: 'MessageSquare',
      },
    ];
    const projectIds = [];
    for (const p of projectData) {
      // Assign projects to various users
      const creator = users[Math.floor(Math.random() * users.length)];
      const res = await pool.query(
        'INSERT INTO projects (name, description, creator_id, created_at) VALUES ($1, $2, $3, NOW()) RETURNING id',
        [p.name, p.description, creator.id],
      );
      projectIds.push(res.rows[0].id);

      // Add relation
      await pool.query(
        'INSERT INTO projects_users (project_id, user_id) VALUES ($1, $2)',
        [res.rows[0].id, creator.id],
      );
    }

    // 6. Seed Tasks
    console.log('📋 Seeding tasks (80 tasks total, ~8 per status)...');
    const priorities = ['low', 'medium', 'high', 'urgent'];
    const taskActions = [
      'Implement',
      'Fix',
      'Review',
      'Document',
      'Design',
      'Optimize',
      'Test',
      'Deploy',
      'Plan',
      'Analyze',
    ];
    const taskEntities = [
      'feature',
      'module',
      'component',
      'auth',
      'database',
      'sidebar',
      'modal',
      'API',
      'tests',
      'profile',
    ];

    for (let i = 1; i <= 80; i++) {
      const projectId =
        projectIds[Math.floor(Math.random() * projectIds.length)];
      const statusId = statusIds[Math.floor(Math.random() * statusIds.length)];
      const priority =
        priorities[Math.floor(Math.random() * priorities.length)];
      const action =
        taskActions[Math.floor(Math.random() * taskActions.length)];
      const entity =
        taskEntities[Math.floor(Math.random() * taskEntities.length)];
      const description = `${action} ${entity} for ${
        projectData[projectIds.indexOf(projectId)].name
      } (#${i})`;
      const completed = statuses[statusIds.indexOf(statusId)] === 'Completed';

      const taskRes = await pool.query(
        'INSERT INTO tasks (description, project_id, status_id, priority, completed, due_date, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING id',
        [
          description,
          projectId,
          statusId,
          priority,
          completed,
          new Date(Date.now() + (Math.random() * 20 - 5) * 1000 * 60 * 60 * 24),
        ],
      );
      const taskId = taskRes.rows[0].id;

      // Assign to a random user
      const assignee = users[Math.floor(Math.random() * users.length)];
      await pool.query(
        'INSERT INTO tasks_users (task_id, user_id) VALUES ($1, $2)',
        [taskId, assignee.id],
      );

      // Assign 1-2 random tags
      const numTags = Math.floor(Math.random() * 2) + 1;
      const selectedTags = [...tagIds]
        .sort(() => 0.5 - Math.random())
        .slice(0, numTags);
      for (const tid of selectedTags) {
        await pool.query(
          'INSERT INTO tasks_tags (task_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [taskId, tid],
        );
      }
    }

    console.log('✅ Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seed();
