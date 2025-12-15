import { pool } from "../db/database.js";

const check = async () => {
  try {
    const users = await pool.query("SELECT count(*) FROM users");
    const projects = await pool.query("SELECT count(*) FROM projects");
    const tasks = await pool.query("SELECT count(*) FROM tasks");

    console.log("--- DB STATS ---");
    console.log(`Users: ${users.rows[0].count}`);
    console.log(`Projects: ${projects.rows[0].count}`);
    console.log(`Tasks: ${tasks.rows[0].count}`);
    console.log("----------------");
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};
check();
