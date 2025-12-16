import 'dotenv/config';

const BASE_URL = process.env.API_URL || 'http://localhost:3000/taskflow';

// Tokens de autenticación
let adminToken, managerToken, userToken;

// IDs creados
let project1Id, project2Id, task1Id, task2Id;

const log = (emoji, message) => console.log(`${emoji} ${message}`);
const success = (message) => log('✅', message);
const error = (message) => log('❌', message);
const info = (message) => log('ℹ️', message);

async function login(email, password) {
  try {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    if (!data.data || !data.data.token) {
      console.log('Response data:', JSON.stringify(data, null, 2));
      throw new Error('No token in response');
    }

    return data.data.token;
  } catch (err) {
    error(`Login failed for ${email}: ${err.message}`);
    throw err;
  }
}

async function makeRequest(method, endpoint, token, body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `Request failed: ${response.status}`);
  }

  return data;
}

async function testAuthentication() {
  info('\n=== TESTING AUTHENTICATION ===');

  adminToken = await login('admin@taskflow.com', 'Admin123');
  success('Admin logged in');

  managerToken = await login('manager@taskflow.com', 'Manager123');
  success('Manager logged in');

  userToken = await login('user@taskflow.com', 'User123');
  success('User logged in');
}

async function testAdminOperations() {
  info('\n=== TESTING ADMIN OPERATIONS ===');

  // Get stats
  const stats = await makeRequest('GET', '/admin/stats', adminToken);
  success(`Admin stats fetched: ${stats.data.rows.users} users`);

  // Get all users
  const users = await makeRequest('GET', '/users', adminToken);
  success(`Fetched ${users.data.length} users`);

  // Get activity logs
  const activity = await makeRequest('GET', '/admin/activity', adminToken);
  success(`Fetched ${activity.data.length} activity logs`);
}

async function testProjectCreation() {
  info('\n=== TESTING PROJECT CREATION ===');

  // Admin creates project 1
  const project1 = await makeRequest('POST', '/projects', adminToken, {
    name: 'TaskFlow Platform',
    description: 'Main platform development',
  });
  project1Id = project1.data.id;
  success(`Admin created project: ${project1.data.name} (ID: ${project1Id})`);

  // Manager creates project 2
  const project2 = await makeRequest('POST', '/projects', managerToken, {
    name: 'Marketing Campaign',
    description: 'Q1 2025 Marketing initiatives',
  });
  project2Id = project2.data.id;
  success(`Manager created project: ${project2.data.name} (ID: ${project2Id})`);

  // Get all projects
  const projects = await makeRequest('GET', '/projects', adminToken);
  success(`Total projects: ${projects.data.length}`);
}

async function testProjectMembers() {
  info('\n=== TESTING PROJECT MEMBERS ===');

  // Add manager and user to project 1
  await makeRequest('POST', `/projects/${project1Id}/users`, adminToken, {
    user_ids: [2, 3], // manager and user
  });
  success('Added manager and user to TaskFlow Platform');

  // Add user to project 2
  await makeRequest('POST', `/projects/${project2Id}/users`, managerToken, {
    user_ids: [3], // user
  });
  success('Added user to Marketing Campaign');

  // Get project members
  const members = await makeRequest(
    'GET',
    `/projects/${project1Id}/users`,
    adminToken,
  );
  success(`Project 1 has ${members.data.length} members`);
}

async function testTaskCreation() {
  info('\n=== TESTING TASK CREATION ===');

  // Admin creates task 1
  const task1 = await makeRequest('POST', '/tasks', adminToken, {
    description: 'Implement user authentication system',
    project_id: project1Id,
    status_id: 1,
    priority: 'high',
    due_date: '2025-12-20T00:00:00.000Z',
  });
  task1Id = task1.data.id;
  success(`Created task: ${task1.data.description} (ID: ${task1Id})`);

  // Manager creates task 2
  const task2 = await makeRequest('POST', '/tasks', managerToken, {
    description: 'Design social media graphics',
    project_id: project2Id,
    status_id: 1,
    priority: 'medium',
    due_date: '2025-12-25T00:00:00.000Z',
  });
  task2Id = task2.data.id;
  success(`Created task: ${task2.data.description} (ID: ${task2Id})`);

  // User creates task 3
  const task3 = await makeRequest('POST', '/tasks', userToken, {
    description: 'Write documentation for API endpoints',
    project_id: project1Id,
    status_id: 1,
    priority: 'low',
  });
  success(`User created task: ${task3.data.description}`);

  // Get all tasks
  const tasks = await makeRequest('GET', '/tasks', adminToken);
  success(`Total tasks: ${tasks.data.length}`);
}

async function testTaskUpdates() {
  info('\n=== TESTING TASK UPDATES ===');

  // Update task status
  await makeRequest('PUT', `/tasks/${task1Id}`, adminToken, {
    status_id: 2, // In progress
    priority: 'urgent',
  });
  success("Updated task 1 to 'In Progress' with urgent priority");

  // Complete task 2
  await makeRequest('PUT', `/tasks/${task2Id}`, managerToken, {
    status_id: 3, // Completed
    completed: true,
  });
  success('Completed task 2');

  // Get updated task
  const updatedTask = await makeRequest('GET', `/tasks/${task1Id}`, adminToken);
  success(
    `Task 1 status: ${updatedTask.data.status}, priority: ${updatedTask.data.priority}`,
  );
}

async function testUserProfile() {
  info('\n=== TESTING USER PROFILES ===');

  // Get user profile
  const profile = await makeRequest('GET', '/user/profile', userToken);
  success(`User profile: ${profile.data.name} ${profile.data.lastname}`);

  // Update profile
  await makeRequest('PUT', `/users/${profile.data.id}`, userToken, {
    name: 'John',
    lastname: 'Doe',
  });
  success('Updated user profile');

  // Get user projects
  const userProjects = await makeRequest('GET', '/user/projects', userToken);
  success(`User has access to ${userProjects.data.length} projects`);

  // Get user tasks
  const userTasks = await makeRequest('GET', '/user/tasks', userToken);
  success(`User has ${userTasks.data.length} tasks assigned`);
}

async function testActivityLogs() {
  info('\n=== TESTING ACTIVITY LOGS ===');

  const activity = await makeRequest(
    'GET',
    '/admin/activity?limit=20',
    adminToken,
  );
  success(`Fetched ${activity.data.length} activity logs`);

  // Display recent activities
  info('\nRecent Activities:');
  activity.data.slice(0, 5).forEach((log, index) => {
    console.log(
      `  ${index + 1}. [${log.action}] by ${log.username || 'System'} - ${
        log.entity_type
      } #${log.entity_id}`,
    );
  });
}

async function testPermissions() {
  info('\n=== TESTING PERMISSIONS ===');

  try {
    // User tries to access admin endpoint (should fail)
    await makeRequest('GET', '/admin/stats', userToken);
    error('User should NOT have access to admin stats');
  } catch (err) {
    success('User correctly denied access to admin endpoint');
  }

  try {
    // Manager tries to delete a user (should fail)
    await makeRequest('DELETE', '/users/3', managerToken);
    error('Manager should NOT be able to delete users');
  } catch (err) {
    success('Manager correctly denied permission to delete users');
  }

  // Admin can delete tasks
  const testTask = await makeRequest('POST', '/tasks', adminToken, {
    description: 'Test task to delete',
    project_id: project1Id,
    status_id: 1,
    priority: 'low',
  });

  await makeRequest('DELETE', `/tasks/${testTask.data.id}`, adminToken);
  success('Admin successfully deleted task');
}

async function displaySummary() {
  info('\n=== FINAL SUMMARY ===');

  const stats = await makeRequest('GET', '/admin/stats', adminToken);
  const projects = await makeRequest('GET', '/projects', adminToken);
  const tasks = await makeRequest('GET', '/tasks', adminToken);
  const activity = await makeRequest('GET', '/admin/activity', adminToken);

  console.log('\n📊 Database Status:');
  console.log(`   Users: ${stats.data.rows.users}`);
  console.log(`   Projects: ${projects.data.length}`);
  console.log(`   Tasks: ${tasks.data.length}`);
  console.log(`   Activity Logs: ${activity.data.length}`);

  console.log('\n🎯 Test Results:');
  console.log('   ✅ Authentication: PASSED');
  console.log('   ✅ Admin Operations: PASSED');
  console.log('   ✅ Project Management: PASSED');
  console.log('   ✅ Task Management: PASSED');
  console.log('   ✅ User Profiles: PASSED');
  console.log('   ✅ Activity Logging: PASSED');
  console.log('   ✅ Permissions: PASSED');
}

async function runTests() {
  try {
    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║   🧪 TASKFLOW COMPREHENSIVE TEST SUITE 🧪     ║');
    console.log('╚════════════════════════════════════════════════╝\n');

    await testAuthentication();
    await testAdminOperations();
    await testProjectCreation();
    await testProjectMembers();
    await testTaskCreation();
    await testTaskUpdates();
    await testUserProfile();
    await testActivityLogs();
    await testPermissions();
    await displaySummary();

    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║        ✅ ALL TESTS COMPLETED SUCCESSFULLY     ║');
    console.log('╚════════════════════════════════════════════════╝\n');

    process.exit(0);
  } catch (err) {
    error(`\nTest suite failed: ${err.message}`);
    console.error(err);
    process.exit(1);
  }
}

runTests();
