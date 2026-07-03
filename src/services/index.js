const { cleanPhone, nowIso } = require("../middleware/auth");

function sanitizeTags(input) {
  if (!Array.isArray(input)) return ["prospeccao"];
  return input.map((item) => String(item).trim()).filter(Boolean);
}

function normalizeLead(input, existing = {}) {
  const phone = cleanPhone(input.phone || input.Telefone || existing.phone);
  const company = input.company || input.Empresa || existing.company || "Empresa sem cadastro";
  const name = input.name || input.Nome || existing.name || company;

  return {
    id: existing.id || input.id || crypto.randomUUID(),
    name,
    company,
    phone,
    address: input.address || input.Endereco || input["Endereco"] || input["Endereço"] || existing.address || "",
    website: input.website || input.Site || existing.website || "",
    searchTerm: input.searchTerm || input["Termo da Busca"] || existing.searchTerm || "",
    city: input.city || input["Cidade-UF"] || existing.city || "",
    niche: input.niche || input.Nicho || existing.niche || "",
    stage: input.stage || existing.stage || "Entrada",
    value: Number(input.value || existing.value || 0),
    owner: input.owner || existing.owner || "MEUS-ARQUIVOS",
    tags: sanitizeTags(input.tags || existing.tags),
    notes: input.notes || existing.notes || "Lead criado pela automacao de prospeccao.",
    priority: input.priority || existing.priority || "Media",
    source: input.source || existing.source || "n8n Scraper",
    status: input.status || existing.status || "Novo",
    sentStatus: input.sentStatus || input["Enviou?"] || existing.sentStatus || "Pendente",
    lastSeen: input.lastSeen || existing.lastSeen || "Agora",
    messages: existing.messages || [],
    createdAt: existing.createdAt || nowIso(),
    updatedAt: nowIso()
  };
}

module.exports = { normalizeLead };
