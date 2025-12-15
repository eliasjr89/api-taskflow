import "dotenv/config";
import { pool } from "../../src/db/database.js";
import bcrypt from "bcrypt";

async function resetUsers() {
  try {
    console.log("🗑️  Limpiando base de datos...\n");

    // 1. Eliminar todos los usuarios (esto eliminará en cascada las relaciones)
    await pool.query("DELETE FROM users");
    console.log("✅ Usuarios eliminados");

    // 2. Resetear el contador de IDs
    await pool.query("ALTER SEQUENCE users_id_seq RESTART WITH 1");
    console.log("✅ Secuencia reseteada\n");

    // 3. Crear los 3 usuarios de prueba
    console.log("👥 Creando usuarios de prueba...\n");

    const users = [
      {
        username: "admin",
        email: "admin@taskflow.com",
        password: "Admin123",
        name: "Admin",
        lastname: "TaskFlow",
        role: "admin",
      },
      {
        username: "manager",
        email: "manager@taskflow.com",
        password: "Manager123",
        name: "Manager",
        lastname: "TaskFlow",
        role: "manager",
      },
      {
        username: "user",
        email: "user@taskflow.com",
        password: "User123",
        name: "User",
        lastname: "TaskFlow",
        role: "user",
      },
    ];

    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);

      const result = await pool.query(
        `INSERT INTO users (username, email, password, name, lastname, role) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING id, username, email, name, lastname, role`,
        [
          user.username,
          user.email,
          hashedPassword,
          user.name,
          user.lastname,
          user.role,
        ]
      );

      console.log(`✅ ${user.role.toUpperCase().padEnd(8)} creado:`);
      console.log(`   ID: ${result.rows[0].id}`);
      console.log(`   Username: ${result.rows[0].username}`);
      console.log(`   Email: ${result.rows[0].email}`);
      console.log(`   Password: ${user.password}`);
      console.log(`   Role: ${result.rows[0].role}\n`);
    }

    console.log("╔════════════════════════════════════════════════╗");
    console.log("║     ✅ BASE DE DATOS RESETEADA EXITOSAMENTE    ║");
    console.log("╚════════════════════════════════════════════════╝\n");

    console.log("📝 Credenciales de acceso:\n");
    console.log("ADMIN:");
    console.log("  Email: admin@taskflow.com");
    console.log("  Password: Admin123\n");

    console.log("MANAGER:");
    console.log("  Email: manager@taskflow.com");
    console.log("  Password: Manager123\n");

    console.log("USER:");
    console.log("  Email: user@taskflow.com");
    console.log("  Password: User123\n");

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    await pool.end();
    process.exit(1);
  }
}

resetUsers();
