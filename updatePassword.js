import { pool } from "./src/db/database.js";
import bcrypt from "bcrypt";

const email = "elias@example.com";
const newPassword = "123456";

const updatePassword = async () => {
  try {
    const hash = await bcrypt.hash(newPassword, 10);
    const result = await pool.query(
      "UPDATE users SET password = $1 WHERE email = $2",
      [hash, email]
    );

    console.log(`Password updated for ${email}.`);
    console.log("Rows affected:", result.rowCount);

    process.exit(0);
  } catch (err) {
    console.error("Error updating password:", err);
    process.exit(1);
  }
};

updatePassword();
