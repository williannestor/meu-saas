const { randomUUID } = require("node:crypto");

function workspace(slug, name, brand = "MEUS-ARQUIVOS") {
  return {
    id: randomUUID(),
    slug,
    name,
    brand,
    settings: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function user(overrides = {}) {
  return {
    id: randomUUID(),
    workspaceId: overrides.workspaceId || "default",
    email: String(overrides.email || "").toLowerCase(),
    name: overrides.name || "User",
    role: overrides.role || "agent",
    passwordSalt: overrides.passwordSalt,
    passwordHash: overrides.passwordHash,
    createdAt: new Date().toISOString()
  };
}

function lead(overrides = {}) {
  return {
    id: randomUUID(),
    workspaceId: overrides.workspaceId || "default",
    name: overrides.name || "",
    company: overrides.company || "Empresa sem cadastro",
    phone: overrides.phone || "",
    address: overrides.address || "",
    website: overrides.website || "",
    searchTerm: overrides.searchTerm || "",
    city: overrides.city || "",
    niche: overrides.niche || "",
    stage: overrides.stage || "Entrada",
    value: Number(overrides.value || 0),
    owner: overrides.owner || "MEUS-ARQUIVOS",
    tags: Array.isArray(overrides.tags) ? overrides.tags : [],
    notes: overrides.notes || "",
    priority: overrides.priority || "Media",
    source: overrides.source || "n8n Scraper",
    status: overrides.status || "Novo",
    sentStatus: overrides.sentStatus || "Pendente",
    lastSeen: overrides.lastSeen || "Agora",
    whatsappOptIn: Boolean(overrides.whatsappOptIn ?? true),
    messages: overrides.messages || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function conversation(overrides = {}) {
  return {
    id: randomUUID(),
    workspaceId: overrides.workspaceId || "default",
    leadId: overrides.leadId,
    channel: overrides.channel || "whatsapp",
    status: overrides.status || "open",
    lastMessageAt: overrides.lastMessageAt || new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function message(overrides = {}) {
  return {
    id: randomUUID(),
    workspaceId: overrides.workspaceId || "default",
    conversationId: overrides.conversationId,
    direction: overrides.direction || "inbound",
    text: overrides.text || "",
    meta: overrides.meta || {},
    sentAt: new Date().toISOString()
  };
}

function dealStage(overrides = {}) {
  return {
    id: randomUUID(),
    workspaceId: overrides.workspaceId || "default",
    key: overrides.key,
    label: overrides.label || overrides.key,
    position: Number(overrides.position || 0),
    createdAt: new Date().toISOString()
  };
}

function automationRule(overrides = {}) {
  return {
    id: randomUUID(),
    workspaceId: overrides.workspaceId || "default",
    name: overrides.name || "Rule",
    conditions: Array.isArray(overrides.conditions) ? overrides.conditions : [],
    actions: Array.isArray(overrides.actions) ? overrides.actions : [],
    enabled: Boolean(overrides.enabled ?? true),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

module.exports = {
  workspace,
  user,
  lead,
  conversation,
  message,
  dealStage,
  automationRule
};
