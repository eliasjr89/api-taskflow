import pg from 'pg';
const { Client } = pg;

const passwords = [
  'taskflow_password',
  'postgres',
  'admin',
  'root',
  '123456',
  'password',
  'secret',
];

async function test() {
  for (const password of passwords) {
    const connectionString = `postgresql://taskflow_user:${password}@localhost:5432/taskflow_db`;
    console.log(`Testing password: ${password}`);

    const client = new Client({ connectionString });
    try {
      await client.connect();
      console.log(`✅ SUCCESS! The password is: ${password}`);
      await client.end();
      return;
    } catch (err) {
      console.log(`❌ Failed: ${err.message}`);
      await client.end();
    }
  }
  console.log('All passwords failed.');
}

test();
