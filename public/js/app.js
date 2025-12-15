const API_URL = "/taskflow";

// State
let authToken = localStorage.getItem("token") || null;
let currentUser = JSON.parse(localStorage.getItem("user")) || null;

// DOM Elements
const views = {
  login: document.getElementById("login-view"),
  dashboard: document.getElementById("dashboard-view"),
};

const forms = {
  login: document.getElementById("login-form"),
};

const ui = {
  loginBtn: document.getElementById("login-btn-text"),
  loader: document.querySelector(".loader"),
  loginError: document.getElementById("login-error"),
  userEmail: document.getElementById("user-email"),
  contentArea: document.getElementById("content-area"),
  navLinks: document.querySelectorAll(".nav-links li"),
  logoutBtn: document.getElementById("logout-btn"),
};

// --- Initialization ---
function init() {
  if (authToken) {
    showDashboard();
  } else {
    showLogin();
  }
}

// --- Navigation Logic ---
function switchView(viewName) {
  Object.values(views).forEach((el) => el.classList.add("hidden"));
  views[viewName].classList.remove("hidden");
  if (viewName === "dashboard") {
    views[viewName].style.display = "flex"; // Fix flex layout
  } else {
    views[viewName].style.display = ""; // Reset
    views[viewName].classList.remove("hidden"); // Re-remove hidden class as reset might toggle it? No.
    // The class 'active' in CSS might be useful, but hidden helper is stronger.
    views[viewName].classList.add("active");
  }
}

function showLogin() {
  switchView("login");
}

function showDashboard() {
  switchView("dashboard");
  if (currentUser) {
    ui.userEmail.textContent = currentUser.email;
  }
  loadOverview();
}

// --- Auth Handling ---
forms.login.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  setLoading(true);
  ui.loginError.classList.add("hidden");

  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.message || "Error de autenticación");

    authToken = data.data.token;
    // Decode token or user data usually comes from login?
    // The API I wrote returns { success: true, data: { token } }.
    // Wait, authService returns { token, user }.
    // Auth controller usually sends res.json({ status: "success", data: { token } }).
    // I need to check authController response structure.
    // If controller wraps it, I might not get the user object unless I updated controller.
    // Assuming token is enough. I'll mock user email for now if not present.

    // Actually, looking at authController (Step 98/206), it sends "token".
    // I'll fetch /users/me or just use encoded token?
    // I'll decoding it simply.
    const payload = JSON.parse(atob(authToken.split(".")[1]));
    currentUser = { email: email, role: payload.role, id: payload.userId };

    localStorage.setItem("token", authToken);
    localStorage.setItem("user", JSON.stringify(currentUser));

    showDashboard();
  } catch (err) {
    ui.loginError.textContent = err.message;
    ui.loginError.classList.remove("hidden");
  } finally {
    setLoading(false);
  }
});

ui.logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  authToken = null;
  currentUser = null;
  showLogin();
});

function setLoading(isLoading) {
  if (isLoading) {
    ui.loginBtn.classList.add("hidden");
    ui.loader.classList.remove("hidden");
  } else {
    ui.loginBtn.classList.remove("hidden");
    ui.loader.classList.add("hidden");
  }
}

// --- Dashboard Logic ---
ui.navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    ui.navLinks.forEach((l) => l.classList.remove("active"));
    link.classList.add("active");
    const tab = link.getAttribute("data-tab");
    loadTab(tab);
  });
});

function loadTab(tab) {
  if (tab === "overview") loadOverview();
  if (tab === "users") loadUsers();
  if (tab === "projects") loadProjects();
  if (tab === "tasks") loadTasks();
}

async function fetchAPI(endpoint) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  if (res.status === 401) {
    ui.logoutBtn.click();
    throw new Error("Unauthorized");
  }
  return await res.json();
}

// -- Overview --
async function loadOverview() {
  ui.contentArea.innerHTML =
    '<div class="loader" style="margin: 0 auto; display: block;"></div>';
  try {
    const [users, projects, tasks] = await Promise.all([
      fetchAPI("/users"),
      fetchAPI("/projects"),
      fetchAPI("/tasks"),
    ]);

    const stats = [
      { label: "Usuarios Totales", value: users.data.length, icon: "fa-users" },
      {
        label: "Proyectos Activos",
        value: projects.data.length,
        icon: "fa-briefcase",
      },
      {
        label: "Tareas Pendientes",
        value: tasks.data.length,
        icon: "fa-list-check",
      },
      { label: "System Status", value: "Online", icon: "fa-server" },
    ];

    let html = `
      <h2 style="margin-bottom: 2rem;">Overview</h2>
      <div class="stats-grid">
        ${stats
          .map(
            (s) => `
        <div class="stat-card">
           <i class="fa-solid ${s.icon}" style="color: var(--primary); font-size: 1.5rem; margin-bottom: 0.5rem;"></i>
           <h3>${s.label}</h3>
           <div class="value">${s.value}</div>
        </div>`
          )
          .join("")}
      </div>
      
       <div class="data-table-container" style="margin-top: 2rem;">
          <h3 style="padding: 1.5rem 1.5rem 0.5rem 1.5rem;">Últimas Tareas</h3>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Descripción</th>
                <th>Estado</th>
                <th>Prioridad</th>
              </tr>
            </thead>
            <tbody>
              ${tasks.data
                .slice(0, 5)
                .map(
                  (t) => `
                <tr>
                  <td>#${t.id}</td>
                  <td>${t.description}</td>
                  <td>${t.status?.name || t.status_id}</td>
                  <td><span style="color: ${getColorPriority(t.priority)}">${
                    t.priority
                  }</span></td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
       </div>
    `;
    ui.contentArea.innerHTML = html;
  } catch (error) {
    console.error(error);
  }
}

// -- Users --
async function loadUsers() {
  ui.contentArea.innerHTML = '<div class="loader"></div>';
  try {
    const res = await fetchAPI("/users");
    const users = res.data;

    let rows = users
      .map(
        (u) => `
      <tr>
        <td>${u.id}</td>
        <td><div style="display:flex; align-items:center; gap:10px;"><div class="avatar" style="width:30px;height:30px;font-size:0.8rem">${u.username[0].toUpperCase()}</div> ${
          u.username
        }</div></td>
        <td>${u.email}</td>
        <td>${u.role}</td>
        <td>${new Date(u.created_at).toLocaleDateString()}</td>
      </tr>
    `
      )
      .join("");

    ui.contentArea.innerHTML = `
      <h2 style="margin-bottom: 1.5rem;">Gestión de Usuarios</h2>
      <div class="data-table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Usuario</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Creado</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  } catch (e) {
    console.error(e);
  }
}

// -- Helpers --
function getColorPriority(p) {
  if (p === "critical" || p === "high") return "var(--danger)";
  if (p === "medium") return "#facc15";
  return "var(--success)";
}

// dummy load implementation for others
async function loadProjects() {
  ui.contentArea.innerHTML =
    '<h2>Proyectos</h2><p style="color:var(--text-muted)">Grid de proyectos...</p>';
  const res = await fetchAPI("/projects");
  let rows = res.data
    .map(
      (p) =>
        `<tr><td>${p.id}</td><td>${p.name}</td><td>${
          p.description || "-"
        }</td></tr>`
    )
    .join("");
  ui.contentArea.innerHTML = `
      <h2 style="margin-bottom: 1.5rem;">Proyectos</h2>
      <div class="data-table-container">
      <table><thead><tr><th>ID</th><th>Nombre</th><th>Descripción</th></tr></thead><tbody>${rows}</tbody></table>
      </div>`;
}

async function loadTasks() {
  const res = await fetchAPI("/tasks");
  ui.contentArea.innerHTML = `<h2>Tareas</h2><div class="data-table-container"><table><thead><tr><th>ID</th><th>Desc</th></tr></thead><tbody>${res.data
    .map((t) => `<tr><td>${t.id}</td><td>${t.description}</td></tr>`)
    .join("")}</tbody></table></div>`;
}

// Run
init();
