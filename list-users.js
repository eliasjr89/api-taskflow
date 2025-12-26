import { pool } from "./src/db/database.js";

async function listUsers() {
  try {
    const result = await pool.query(
      "SELECT id, username, email, role FROM users LIMIT 10;"
    );
    console.log(JSON.stringify(result.rows, null, 2));
    process.exit(0);
  } catch (err) {
    console.error("Error listing users:", err);
    process.exit(1);
  }
}

listUsers();
