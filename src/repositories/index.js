const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");
const { supabaseRequest } = require("./supabaseClient");

const dataDir = path.join(__dirname, "..", "data");
const dbPath = path.join(dataDir, "crm-db.json");

const defaultDb = {
  settings: null,
  users: [],
  leads: []
};

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
  await fs.writeFile(dbPath, JSON.stringify(db, null, 2), "utf8");
}

function byWorkspace(items = [], workspaceId) {
  if (!items) return [];
  return items.filter((item) => {
    const ws = item.workspaceId || item.workspace_id || "default";
    return ws === workspaceId;
  });
}

async function listLeads(workspaceId) {
  const db = await readDb();
  return byWorkspace(db.leads, workspaceId);
}

async function upsertLead(workspaceId, lead) {
  const db = await readDb();
  const target = { ...lead, workspaceId: workspaceId || "default" };
  const index = db.leads.findIndex((item) => {
    const itemWs = item.workspaceId || item.workspace_id || "default";
    if (itemWs !== target.workspaceId) return false;
    if (target.phone && item.phone === target.phone) return true;
    return target.company && item.company.toLowerCase() === String(target.company).toLowerCase();
  });

  if (index >= 0) {
    db.leads[index] = { ...db.leads[index], ...target, updatedAt: new Date().toISOString() };
  } else {
    db.leads.unshift({
      ...target,
      id: target.id || crypto.randomUUID(),
      stage: target.stage || "Entrada",
      owner: target.owner || "MEUS-ARQUIVOS",
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
  return db.leads[index >= 0 ? index : 0];
}

async function updateOutreach(workspaceId, patch) {
  const db = await readDb();
  const lead = db.leads.find((item) => {
    const itemWs = item.workspaceId || item.workspace_id || "default";
    if (itemWs !== (workspaceId || "default")) return false;
    return item.id === patch.id || item.phone === patch.phone;
  });

  if (!lead) return null;
  lead.sentStatus = patch.sentStatus || patch["Enviou?"] || "Contatado";
  lead.status = patch.status || "Contatado";
  lead.updatedAt = new Date().toISOString();
  if (patch.message) {
    lead.messages.push({
      from: "agent",
      text: patch.message,
      time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    });
  }

  await writeDb(db);
  return lead;
}

async function findUserByEmail(email) {
  const db = await readDb();
  return db.users.find((user) => user.email === String(email || "").toLowerCase().trim()) || null;
}

async function createUser(user) {
  const db = await readDb();
  const entry = {
    id: user.id || crypto.randomUUID(),
    email: String(user.email || "").toLowerCase(),
    name: user.name || "User",
    role: user.role || "agent",
    passwordSalt: user.passwordSalt || crypto.randomBytes(16).toString("hex"),
    passwordHash: user.passwordHash,
    workspaceId: user.workspaceId || "default",
    createdAt: user.createdAt || new Date().toISOString()
  };
  db.users.push(entry);
  await writeDb(db);
  return entry;
}

module.exports = {
  ensureDb,
  readDb,
  writeDb,
  listLeads,
  upsertLead,
  updateOutreach,
  findUserByEmail,
  createUser
};
