import { pool } from "./src/db/database.js";
import bcrypt from "bcrypt";

async function resetPasswords() {
  try {
    const hashedPassword = await bcrypt.hash("password123", 10);
    await pool.query(
      "UPDATE users SET password = $1 WHERE email IN ($2, $3, $4)",
      [
        hashedPassword,
        "admin@taskflow.com",
        "user@taskflow.com",
        "manager@taskflow.com",
      ]
    );
    console.log("Passwords updated to password123");
    process.exit(0);
  } catch (err) {
    console.error("Error updating passwords:", err);
    process.exit(1);
  }
}

resetPasswords();
