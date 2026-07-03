const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");

const dataDir = path.join(__dirname, "..", "data");
const dbPath = path.join(dataDir, "crm-db.json");

const defaultDb = {
  settings: { apiBaseUrl: "", instance: "", webhookUrl: "" },
  users: [],
  leads: []
};

function byWorkspace(items = [], workspaceId) {
  return items.filter((item) => (item.workspaceId || item.workspace_id || "default") === (workspaceId || "default"));
}

async function ensureDb() {
  try {
    const raw = await fs.readFile(dbPath, "utf8");
    return JSON.parse(raw);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
    const db = structuredClone(defaultDb);
    await fs.writeFile(dbPath, JSON.stringify(db, null, 2), "utf8");
    return db;
  }
}

async function readDb() {
  const data = await ensureDb();
  return { ...structuredClone(defaultDb), ...data };
}

async function writeDb(db) {
  await fs.mkdir(dataDir, { recursive: true });
  return fs.writeFile(dbPath, JSON.stringify(db, null, 2), "utf8");
}

async function listLeads(workspaceId) {
  const db = await readDb();
  return byWorkspace(db.leads, workspaceId);
}

async function upsertLead(workspaceId, lead) {
  const db = await readDb();
  const target = { ...lead, workspaceId: workspaceId || "default" };
  const wsItems = byWorkspace(db.leads, target.workspaceId);
  const index = wsItems.findIndex((item) => (target.phone && item.phone === target.phone) || (target.company && item.company.toLowerCase() === String(target.company).toLowerCase()));
  const globalIndex = index >= 0 ? db.leads.indexOf(wsItems[index]) : -1;

  if (globalIndex >= 0) {
    db.leads[globalIndex] = { ...db.leads[globalIndex], ...target, updatedAt: new Date().toISOString() };
  } else {
    db.leads.unshift({
      ...target,
      id: target.id || crypto.randomUUID(),
      stage: target.stage || "Entrada",
      owner: target.owner || "Agcapy",
      tags: Array.isArray(target.tags) ? target.tags : ["prospeccao"],
      priority: target.priority || "Media",
      source: target.source || "n8n Scraper",
      status: target.status || "Novo",
      sentStatus: target.sentStatus || "Pendente",
      lastSeen: target.lastSeen || "Agora",
      messages: target.messages || [],
      createdAt: target.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  await writeDb(db);
  return db.leads[globalIndex >= 0 ? globalIndex : 0];
}

async function updateOutreach(workspaceId, patch) {
  const db = await readDb();
  const targetWs = workspaceId || "default";
  const lead = db.leads.find((item) => {
    const itemWs = item.workspaceId || item.workspace_id || "default";
    if (itemWs !== targetWs) return false;
    return item.id === patch.id || item.phone === patch.phone;
  });

  if (!lead) return null;
  lead.sentStatus = patch.sentStatus || patch["Enviou?"] || "Contatado";
  lead.status = patch.status || "Contatado";
  lead.updatedAt = new Date().toISOString();
  if (patch.message) {
    lead.messages.push({ from: "agent", text: patch.message, time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) });
  }

  await writeDb(db);
  return lead;
}

async function findUser(workspaceId, email) {
  const db = await readDb();
  const cleanEmail = String(email || "").toLowerCase().trim();
  const ws = workspaceId || "default";
  return db.users.find((user) => user.email === cleanEmail && (user.workspaceId || "default") === ws) || null;
}

async function createUser(workspaceId, user) {
  const db = await readDb();
  const entry = {
    id: user.id || crypto.randomUUID(),
    email: String(user.email || "").toLowerCase(),
    name: user.name || "User",
    role: user.role || "agent",
    passwordSalt: user.passwordSalt || crypto.randomBytes(16).toString("hex"),
    passwordHash: user.passwordHash,
    workspaceId: user.workspaceId || workspaceId || "default",
    createdAt: user.createdAt || new Date().toISOString()
  };
  db.users.push(entry);
  await writeDb(db);
  return entry;
}

async function ensureAdmin() {
  const db = await readDb();
  const email = "admin@meus-arquivos.local";
  if (!db.users.find((user) => user.email === email && (user.workspaceId || "default") === "default")) {
    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = require("../../middleware/auth").passwordHash;
    db.users.push({
      id: crypto.randomUUID(),
      email,
      name: "Admin",
      role: "admin",
      passwordSalt: salt,
      passwordHash: passwordHash("admin123456", salt),
      workspaceId: "default",
      createdAt: new Date().toISOString()
    });
    await writeDb(db);
  }
}

module.exports = {
  listLeads,
  upsertLead,
  updateOutreach,
  findUser,
  createUser,
  ensureAdmin
};
