import axios from 'axios';

const API_URL = 'http://localhost:3000/taskflow/auth/login';

const credentials = {
  email: 'admin@taskflow.com',
  password: 'Admin123',
};

async function testLogin() {
  try {
    console.log(`Attempting login with ${credentials.email}...`);
    const response = await axios.post(API_URL, credentials);
    console.log('✅ Login successful!');
    console.log('Status:', response.status);
    console.log('User:', response.data.user);
    console.log('Token:', response.data.token ? 'Present' : 'Missing');
  } catch (error) {
    console.error(
      '❌ Login failed:',
      error.response ? error.response.data : error.message,
    );
    if (error.response) {
      console.error('Status:', error.response.status);
    }
  }
}

testLogin();
