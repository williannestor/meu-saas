const config = require("../config");

async function supabaseRequest(method, table, query = "", body) {
  const url = `${config.supabaseUrl}/rest/v1/${table}${query}`;
  const response = await fetch(url, {
    method,
    headers: {
      apikey: config.supabaseServiceRoleKey,
      authorization: `Bearer ${config.supabaseServiceRoleKey}`,
      "content-type": "application/json",
      prefer: "return=representation,resolution=merge-duplicates"
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(payload?.message || `Supabase ${method} ${table} failed`);
  }
  return payload;
}

async function ensureAdminUser() {
  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) return;
  const email = config.adminEmail;
  const users = await supabaseRequest("GET", "app_users", `?email=eq.${encodeURIComponent(email)}&select=*`);
  if (users.length) return;
  const { passwordHash } = require("../middleware/auth");
  const salt = crypto.randomBytes(16).toString("hex");
  await supabaseRequest("POST", "app_users", "", [
    {
      email,
      name: "Admin",
      role: "admin",
      password_salt: salt,
      password_hash: passwordHash(config.adminPassword, salt)
    }
  ]);
}

async function listLeads(workspaceId) {
  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) return [];
  const ws = workspaceId || "default";
  const rows = await supabaseRequest("GET", "leads", `?workspace_id=eq.${encodeURIComponent(ws)}&order=updated_at.desc`);
  return rows.map(fromDbLead);
}

async function upsertLead(workspaceId, lead) {
  const ws = workspaceId || "default";
  const filters = lead.phone
    ? `?workspace_id=eq.${encodeURIComponent(ws)}&phone=eq.${encodeURIComponent(lead.phone)}&select=*&limit=1`
    : `?workspace_id=eq.${encodeURIComponent(ws)}&company=eq.${encodeURIComponent(lead.company)}&select=*&limit=1`;
  const existingRows = await supabaseRequest("GET", "leads", filters);
  const existing = existingRows[0] ? fromDbLead(existingRows[0]) : {};
  const normalized = { ...normalizeLead(lead, existing), workspace_id: ws };
  const rows = await supabaseRequest("POST", "leads", "?on_conflict=phone", [toDbLead(normalized)]);
  return fromDbLead(rows[0]);
}

async function updateOutreach(workspaceId, patch) {
  const ws = workspaceId || "default";
  const rows = await supabaseRequest("GET", "leads", `?workspace_id=eq.${encodeURIComponent(ws)}&phone=eq.${encodeURIComponent(patch.phone)}&select=*&limit=1`);
  if (!rows.length) return null;
  const lead = fromDbLead(rows[0]);
  lead.sentStatus = patch.sentStatus || patch["Enviou?"] || "Contatado";
  lead.status = patch.status || "Contatado";
  lead.updatedAt = new Date().toISOString();
  if (patch.message) {
    lead.messages.push({ from: "agent", text: patch.message, time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) });
  }
  const updated = await supabaseRequest("PATCH", "leads", `?workspace_id=eq.${encodeURIComponent(ws)}&phone=eq.${encodeURIComponent(patch.phone)}`, toDbLead(lead));
  return fromDbLead(updated[0]);
}

function toDbLead(lead) {
  return {
    id: lead.id,
    name: lead.name,
    company: lead.company,
    phone: lead.phone,
    address: lead.address,
    website: lead.website,
    search_term: lead.searchTerm,
    city: lead.city,
    niche: lead.niche,
    stage: lead.stage,
    deal_value: lead.value,
    owner: lead.owner,
    tags: lead.tags,
    notes: lead.notes,
    priority: lead.priority,
    source: lead.source,
    status: lead.status,
    sent_status: lead.sentStatus,
    last_seen: lead.lastSeen,
    messages: lead.messages,
    created_at: lead.createdAt,
    updated_at: lead.updatedAt,
    workspace_id: lead.workspace_id
  };
}

function fromDbLead(row = {}) {
  return {
    id: row.id,
    name: row.name,
    company: row.company,
    phone: row.phone,
    address: row.address,
    website: row.website,
    searchTerm: row.search_term,
    city: row.city,
    niche: row.niche,
    stage: row.stage,
    value: row.deal_value,
    owner: row.owner,
    tags: row.tags || [],
    notes: row.notes,
    priority: row.priority,
    source: row.source,
    status: row.status,
    sentStatus: row.sent_status,
    lastSeen: row.last_seen,
    messages: row.messages || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function normalizeLead(input, existing = {}) {
  const phone = String(input.phone || "").replace(/\D/g, "");
  const company = input.company || existing.company || "Empresa sem cadastro";
  const name = input.name || existing.name || company;

  return {
    id: existing.id || input.id || crypto.randomUUID(),
    name,
    company,
    phone,
    address: input.address || existing.address || "",
    website: input.website || existing.website || "",
    searchTerm: input.searchTerm || existing.searchTerm || "",
    city: input.city || existing.city || "",
    niche: input.niche || existing.niche || "",
    stage: input.stage || existing.stage || "Entrada",
    value: Number(input.value || existing.value || 0),
    owner: input.owner || existing.owner || "MEUS-ARQUIVOS",
    tags: Array.isArray(input.tags) ? input.tags : ["prospeccao"],
    notes: input.notes || existing.notes || "Lead criado pela automacao de prospeccao.",
    priority: input.priority || existing.priority || "Media",
    source: input.source || existing.source || "n8n Scraper",
    status: input.status || existing.status || "Novo",
    sentStatus: input.sentStatus || existing.sentStatus || "Pendente",
    lastSeen: input.lastSeen || existing.lastSeen || "Agora",
    messages: existing.messages || [],
    createdAt: existing.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

module.exports = {
  supabaseRequest,
  ensureAdminUser,
  listLeads,
  upsertLead,
  updateOutreach,
  toDbLead,
  fromDbLead,
  normalizeLead
};
