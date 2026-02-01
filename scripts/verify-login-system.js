import axios from 'axios';

const BASE_URL = 'http://localhost:3000/taskflow/auth/login';

const users = [
  {
    email: 'admin@taskflow.com',
    password: 'Admin123',
    role: 'admin',
    expected: {
      admin: 200,
      user: 403,
    },
  },
  {
    email: 'user1@taskflow.com',
    password: 'User123',
    role: 'user',
    expected: {
      admin: 403,
      user: 200,
    },
  },
  {
    email: 'manager@taskflow.com',
    password: 'Manager123',
    role: 'manager',
    expected: {
      admin: 200,
      user: 403,
    },
  },
];

async function testLogin(email, password, loginType, expectedStatus) {
  try {
    const response = await axios.post(BASE_URL, {
      email,
      password,
      loginType,
    });

    if (response.status === expectedStatus) {
      console.log(`✅ [PASS] ${email} as ${loginType}: Got ${response.status}`);
      return true;
    } else {
      console.log(
        `❌ [FAIL] ${email} as ${loginType}: Expected ${expectedStatus}, got ${response.status}`,
      );
      return false;
    }
  } catch (error) {
    if (error.response) {
      if (error.response.status === expectedStatus) {
        console.log(
          `✅ [PASS] ${email} as ${loginType}: Got ${error.response.status}`,
        );
        return true;
      } else {
        console.log(
          `❌ [FAIL] ${email} as ${loginType}: Expected ${expectedStatus}, got ${error.response.status} - ${error.response.data.message}`,
        );
        return false;
      }
    } else {
      console.log(
        `❌ [ERROR] ${email} as ${loginType}: Request failed - ${error.message}`,
      );
      return false;
    }
  }
}

async function runTests() {
  console.log('🚀 Starting Login Verification...\n');
  let passed = 0;
  let total = 0;

  for (const user of users) {
    // Test as Admin Form
    total++;
    if (
      await testLogin(user.email, user.password, 'admin', user.expected.admin)
    ) {
      passed++;
    }

    // Test as User Form
    total++;
    if (
      await testLogin(user.email, user.password, 'user', user.expected.user)
    ) {
      passed++;
    }
  }

  // Test Invalid Credentials
  total++;
  console.log('\nTesting Invalid Credentials...');
  if (await testLogin('admin@taskflow.com', 'WrongPass', 'admin', 401)) {
    passed++;
  }

  console.log(`\n📊 Result: ${passed}/${total} tests passed.`);

  if (passed === total) {
    console.log('✅ All tests passed!');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed.');
    process.exit(1);
  }
}

runTests();
