import "dotenv/config";
import { pool } from "../../src/db/database.js";

async function checkDatabase() {
  try {
    console.log("🔍 Verificando estado de la base de datos...\n");

    // Verificar usuarios
    const users = await pool.query(
      "SELECT id, username, email, role FROM users ORDER BY id"
    );
    console.log(`👥 USUARIOS (${users.rows.length}):`);
    users.rows.forEach((u) =>
      console.log(`   ${u.id}. ${u.username} (${u.role}) - ${u.email}`)
    );

    // Verificar proyectos
    const projects = await pool.query(
      "SELECT id, name, creator_id FROM projects ORDER BY id"
    );
    console.log(`\n📁 PROYECTOS (${projects.rows.length}):`);
    projects.rows.forEach((p) =>
      console.log(`   ${p.id}. ${p.name} - Creator: ${p.creator_id}`)
    );

    // Verificar tareas
    const tasks = await pool.query(
      "SELECT id, description, project_id, status_id, priority FROM tasks WHERE deleted = false ORDER BY id"
    );
    console.log(`\n📋 TAREAS (${tasks.rows.length}):`);
    tasks.rows.forEach((t) =>
      console.log(
        `   ${t.id}. ${t.description.substring(0, 40)} - Project: ${
          t.project_id
        } - Status: ${t.status_id}`
      )
    );

    // Verificar task_statuses
    const statuses = await pool.query(
      "SELECT id, name FROM task_statuses ORDER BY id"
    );
    console.log(`\n🏷️  ESTADOS (${statuses.rows.length}):`);
    statuses.rows.forEach((s) => console.log(`   ${s.id}. ${s.name}`));

    // Verificar tags
    const tags = await pool.query("SELECT id, name FROM tags ORDER BY id");
    console.log(`\n🔖 ETIQUETAS (${tags.rows.length}):`);
    tags.rows.forEach((t) => console.log(`   ${t.id}. ${t.name}`));

    // Verificar relaciones projects_users
    const projectUsers = await pool.query(
      "SELECT project_id, user_id FROM projects_users ORDER BY project_id, user_id"
    );
    console.log(`\n👥 PROYECTOS-USUARIOS (${projectUsers.rows.length}):`);
    projectUsers.rows.forEach((pu) =>
      console.log(`   Project ${pu.project_id} -> User ${pu.user_id}`)
    );

    // Verificar relaciones tasks_users
    const taskUsers = await pool.query(
      "SELECT task_id, user_id FROM tasks_users ORDER BY task_id, user_id"
    );
    console.log(`\n📋 TAREAS-USUARIOS (${taskUsers.rows.length}):`);
    taskUsers.rows.forEach((tu) =>
      console.log(`   Task ${tu.task_id} -> User ${tu.user_id}`)
    );

    // Verificar relaciones tasks_tags
    const taskTags = await pool.query(
      "SELECT task_id, tag_id FROM tasks_tags ORDER BY task_id, tag_id"
    );
    console.log(`\n🔖 TAREAS-ETIQUETAS (${taskTags.rows.length}):`);
    taskTags.rows.forEach((tt) =>
      console.log(`   Task ${tt.task_id} -> Tag ${tt.tag_id}`)
    );

    console.log("\n" + "=".repeat(50));
    console.log("RESUMEN:");
    console.log(`  Usuarios: ${users.rows.length}`);
    console.log(`  Proyectos: ${projects.rows.length}`);
    console.log(`  Tareas: ${tasks.rows.length}`);
    console.log(`  Estados: ${statuses.rows.length}`);
    console.log(`  Etiquetas: ${tags.rows.length}`);
    console.log("=".repeat(50));

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    await pool.end();
    process.exit(1);
  }
}

checkDatabase();
