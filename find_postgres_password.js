import pg from 'pg';
const { Client } = pg;

const passwords = [
  'taskflow_password', // maybe they set the user password as postgres password?
  'postgres',
  'admin',
  'root',
  '123456',
  'password',
  'secret',
  '', // empty password
];

async function test() {
  for (const password of passwords) {
    const connectionString = `postgresql://postgres:${password}@localhost:5432`; // Connect to default db 'postgres' or try 'taskflow_db' if postgres matches
    console.log(`Testing user 'postgres' with password: '${password}'`);

    // Try connecting to default 'postgres' database first
    const client = new Client({
      user: 'postgres',
      host: 'localhost',
      database: 'postgres',
      password: password,
      port: 5432,
    });

    try {
      await client.connect();
      console.log(
        `✅ SUCCESS! User 'postgres' connected with password: '${password}'`,
      );
      await client.end();
      return;
    } catch (err) {
      console.log(`❌ Failed: ${err.message}`);
      await client.end();
    }
  }
  console.log('All passwords failed for user postgres.');
}

test();
