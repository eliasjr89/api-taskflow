import pg from 'pg';
const { Client } = pg;

const connectionString =
  'postgresql://taskflow_user:taskflow_password@localhost:5432/taskflow_db';

console.log(`Testing connection to: ${connectionString}`);

const client = new Client({
  connectionString: connectionString,
});

async function test() {
  try {
    await client.connect();
    console.log('Connected successfully!');
    const res = await client.query('SELECT NOW()');
    console.log('Server time:', res.rows[0]);
    await client.end();
  } catch (err) {
    console.error('Connection failed:', err.message);
    if (err.code) {
      console.error('Error code:', err.code);
    }
    process.exit(1);
  }
}

test();
