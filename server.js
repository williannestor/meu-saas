const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");

const root = __dirname;
const dataDir = path.join(root, "data");
const dbPath = path.join(dataDir, "crm-db.json");
const port = Number(process.env.PORT || 3000);

const config = {
  appName: process.env.APP_NAME || "Agcapy Automacoes Inteligentes",
  appUrl: process.env.APP_URL || `http://localhost:${port}`,
  apiKey: process.env.APP_API_KEY || "dev-api-key-change-me",
  jwtSecret: process.env.JWT_SECRET || "dev-jwt-secret-change-me",
  adminEmail: process.env.ADMIN_EMAIL || "admin@agcapy.com.br",
  adminPassword: process.env.ADMIN_PASSWORD || "admin123456",
  supabaseUrl: process.env.SUPABASE_URL || "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  evolutionApiUrl: (process.env.EVOLUTION_API_URL || "https://evolution.agcapy.com").replace(/\/$/, ""),
  evolutionInstance: process.env.EVOLUTION_INSTANCE || "Agcapy",
  evolutionApiKey: process.env.EVOLUTION_API_KEY || "",
  openRouterApiKey: process.env.OPENROUTER_API_KEY || "",
  openRouterModel: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini"
};

const useSupabase = Boolean(config.supabaseUrl && config.supabaseServiceRoleKey);

const defaultDb = {
  settings: {
    apiBaseUrl: config.evolutionApiUrl,
    instance: config.evolutionInstance,
    webhookUrl: `${config.appUrl}/api/webhooks/evolution`
  },
  users: [],
  leads: []
};

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8"
};

function base64url(input) {
  return Buffer.from(input).toString("base64url");
}

function signSession(payload) {
  const body = base64url(JSON.stringify(payload));
  const signature = crypto.createHmac("sha256", config.jwtSecret).update(body).digest("base64url");
  return `${body}.${signature}`;
}

function verifySession(token) {
  if (!token || !token.includes(".")) return null;
  const [body, signature] = token.split(".");
  const expected = crypto.createHmac("sha256", config.jwtSecret).update(body).digest("base64url");
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  if (payload.exp && payload.exp < Date.now()) return null;
  return payload;
}

function passwordHash(password, salt) {
  return crypto.createHash("sha256").update(`${salt}:${password}`).digest("hex");
}

function cookieValue(req, name) {
  const cookies = req.headers.cookie || "";
  const match = cookies.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : "";
}

function isAuthorized(req) {
  if (req.headers["x-api-key"] && req.headers["x-api-key"] === config.apiKey) return true;
  return Boolean(verifySession(cookieValue(req, "agcapy_session")));
}

function cleanPhone(value = "") {
  return String(value).replace(/\D/g, "");
}

function nowIso() {
  return new Date().toISOString();
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
    updated_at: lead.updatedAt
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

function publicLead(lead) {
  return {
    id: lead.id,
    name: lead.name,
    company: lead.company,
    phone: lead.phone,
    Nome: lead.name,
    Empresa: lead.company,
    Telefone: lead.phone,
    address: lead.address,
    website: lead.website,
    "Endereco": lead.address,
    Site: lead.website,
    searchTerm: lead.searchTerm,
    city: lead.city,
    niche: lead.niche,
    "Termo da Busca": lead.searchTerm,
    "Cidade-UF": lead.city,
    Nicho: lead.niche,
    stage: lead.stage,
    value: lead.value,
    owner: lead.owner,
    tags: lead.tags,
    notes: lead.notes,
    priority: lead.priority,
    source: lead.source,
    status: lead.status,
    sentStatus: lead.sentStatus,
    "Enviou?": lead.sentStatus,
    lastSeen: lead.lastSeen,
    messages: lead.messages,
    createdAt: lead.createdAt,
    updatedAt: lead.updatedAt
  };
}

function normalizeLead(input, existing = {}) {
  const phone = cleanPhone(input.phone || input.Telefone || existing.phone);
  const company = input.company || input.Empresa || existing.company || "Empresa sem cadastro";
  const name = input.name || input.Nome || existing.name || company;
  const tags = Array.isArray(input.tags)
    ? input.tags
    : Array.from(new Set([input.niche || input.Nicho, input.searchTerm || input["Termo da Busca"], "prospeccao"].filter(Boolean).map(String)));

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
    owner: input.owner || existing.owner || "Agcapy",
    tags,
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

async function parseBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return {};
  }
}

function sendJson(res, status, payload, extraHeaders = {}) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": config.appUrl,
    "access-control-allow-credentials": "true",
    "access-control-allow-methods": "GET,POST,PATCH,OPTIONS",
    "access-control-allow-headers": "content-type,x-api-key",
    ...extraHeaders
  });
  res.end(JSON.stringify(payload));
}

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

async function readJsonDb() {
  try {
    const raw = await fs.readFile(dbPath, "utf8");
    return { ...defaultDb, ...JSON.parse(raw) };
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
    await writeJsonDb(defaultDb);
    return structuredClone(defaultDb);
  }
}

async function writeJsonDb(db) {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(dbPath, JSON.stringify(db, null, 2), "utf8");
}

async function ensureAdminUser() {
  const email = config.adminEmail.toLowerCase();
  if (useSupabase) {
    const users = await supabaseRequest("GET", "app_users", `?email=eq.${encodeURIComponent(email)}&select=*`);
    if (users.length) return;
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
    return;
  }

  const db = await readJsonDb();
  if (db.users.some((user) => user.email === email)) return;
  const salt = crypto.randomBytes(16).toString("hex");
  db.users.push({
    id: crypto.randomUUID(),
    email,
    name: "Admin",
    role: "admin",
    passwordSalt: salt,
    passwordHash: passwordHash(config.adminPassword, salt),
    createdAt: nowIso()
  });
  await writeJsonDb(db);
}

async function findUserByEmail(email) {
  const cleanEmail = String(email || "").toLowerCase().trim();
  if (useSupabase) {
    const users = await supabaseRequest("GET", "app_users", `?email=eq.${encodeURIComponent(cleanEmail)}&select=*&limit=1`);
    const user = users[0];
    return user
      ? {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          passwordSalt: user.password_salt,
          passwordHash: user.password_hash
        }
      : null;
  }

  const db = await readJsonDb();
  return db.users.find((user) => user.email === cleanEmail) || null;
}

async function listLeads() {
  if (useSupabase) {
    const rows = await supabaseRequest("GET", "leads", "?select=*&order=updated_at.desc");
    return rows.map(fromDbLead);
  }
  const db = await readJsonDb();
  return db.leads;
}

async function upsertLead(body) {
  const phone = cleanPhone(body.phone || body.Telefone);
  const company = body.company || body.Empresa;

  if (useSupabase) {
    const filters = phone
      ? `?phone=eq.${encodeURIComponent(phone)}&select=*&limit=1`
      : `?company=eq.${encodeURIComponent(company)}&select=*&limit=1`;
    const existingRows = await supabaseRequest("GET", "leads", filters);
    const existing = existingRows[0] ? fromDbLead(existingRows[0]) : {};
    const lead = normalizeLead(body, existing);
    const rows = await supabaseRequest("POST", "leads", "?on_conflict=phone", [toDbLead(lead)]);
    return publicLead(fromDbLead(rows[0]));
  }

  const db = await readJsonDb();
  const index = db.leads.findIndex((lead) => {
    if (phone && lead.phone === phone) return true;
    return company && lead.company.toLowerCase() === String(company).toLowerCase();
  });
  const existing = index >= 0 ? db.leads[index] : {};
  const lead = normalizeLead(body, existing);
  if (index >= 0) db.leads[index] = lead;
  else db.leads.unshift(lead);
  await writeJsonDb(db);
  return publicLead(lead);
}

async function updateOutreach(body) {
  const phone = cleanPhone(body.phone || body.Telefone);

  if (useSupabase) {
    const rows = await supabaseRequest("GET", "leads", `?phone=eq.${encodeURIComponent(phone)}&select=*&limit=1`);
    if (!rows.length) return null;
    const lead = fromDbLead(rows[0]);
    lead.sentStatus = body.sentStatus || body["Enviou?"] || "Contatado";
    lead.status = body.status || "Contatado";
    lead.updatedAt = nowIso();
    if (body.message) {
      lead.messages.push({ from: "agent", text: body.message, time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) });
    }
    const updated = await supabaseRequest("PATCH", "leads", `?phone=eq.${encodeURIComponent(phone)}`, toDbLead(lead));
    return publicLead(fromDbLead(updated[0]));
  }

  const db = await readJsonDb();
  const lead = db.leads.find((item) => item.id === body.id || item.phone === phone);
  if (!lead) return null;
  lead.sentStatus = body.sentStatus || body["Enviou?"] || "Contatado";
  lead.status = body.status || "Contatado";
  lead.updatedAt = nowIso();
  if (body.message) {
    lead.messages.push({ from: "agent", text: body.message, time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) });
  }
  await writeJsonDb(db);
  return publicLead(lead);
}

async function handleEvolutionWebhook(body) {
  const remoteJid = body?.data?.key?.remoteJid || body?.remoteJid || "";
  const text = body?.data?.message?.conversation || body?.message || body?.text || "";
  const pushName = body?.data?.pushName || body?.pushName || "Contato WhatsApp";
  const lead = await upsertLead({
    name: pushName,
    company: pushName,
    phone: remoteJid,
    source: "Evolution API",
    tags: ["whatsapp", "entrada"],
    notes: "Lead criado ou atualizado pelo webhook da Evolution API."
  });

  if (!text) return lead;
  return updateOutreach({ Telefone: lead.Telefone, status: "Respondeu", sentStatus: "Respondeu", message: text });
}

async function sendWhatsApp(body) {
  const endpoint = `${config.evolutionApiUrl}/message/sendText/${config.evolutionInstance}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      apikey: config.evolutionApiKey
    },
    body: JSON.stringify({
      number: cleanPhone(body.phone || body.Telefone),
      text: body.text || body.message
    })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.message || "Evolution API send failed");
  return payload;
}

async function generateProspectingMessage(lead) {
  if (!config.openRouterApiKey) {
    return "Ola, tudo bem? Aqui e o Lynq, assistente virtual da AgCapy Automacoes Inteligentes. Vi o contato de voces no Google Maps. Hoje voces estao satisfeitos com o volume de clientes atendidos?";
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${config.openRouterApiKey}`,
      "content-type": "application/json",
      "http-referer": config.appUrl,
      "x-title": config.appName
    },
    body: JSON.stringify({
      model: config.openRouterModel,
      messages: [
        {
          role: "system",
          content:
            "Voce e o Lynq, assistente de prospeccao consultiva da Agcapy. Escreva mensagens curtas, humanas, sem vender, sem preco e com uma pergunta por vez."
        },
        {
          role: "user",
          content: `Empresa: ${lead.company}\nNicho: ${lead.niche}\nCidade: ${lead.city}\nCrie uma primeira mensagem contextual.`
        }
      ]
    })
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload?.error?.message || "OpenRouter failed");
  return payload.choices?.[0]?.message?.content || "";
}

async function handleAuth(req, res, url) {
  if (req.method === "GET" && url.pathname === "/api/session") {
    const session = verifySession(cookieValue(req, "agcapy_session"));
    return sendJson(res, 200, { authenticated: Boolean(session), user: session?.user || null });
  }

  if (req.method === "POST" && url.pathname === "/api/login") {
    const body = await parseBody(req);
    const user = await findUserByEmail(body.email);
    if (!user || passwordHash(body.password || "", user.passwordSalt) !== user.passwordHash) {
      return sendJson(res, 401, { error: "Credenciais invalidas" });
    }
    const sessionUser = { id: user.id, email: user.email, name: user.name, role: user.role };
    const token = signSession({ user: sessionUser, exp: Date.now() + 1000 * 60 * 60 * 12 });
    return sendJson(res, 200, { authenticated: true, user: sessionUser }, {
      "set-cookie": `agcapy_session=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=43200`
    });
  }

  if (req.method === "POST" && url.pathname === "/api/logout") {
    return sendJson(res, 200, { ok: true }, {
      "set-cookie": "agcapy_session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0"
    });
  }

  return null;
}

async function routeApi(req, res, url) {
  if (req.method === "OPTIONS") return sendJson(res, 204, {});
  const authResponse = await handleAuth(req, res, url);
  if (authResponse) return authResponse;

  if (url.pathname !== "/api/webhooks/evolution" && !isAuthorized(req)) {
    return sendJson(res, 401, { error: "Unauthorized" });
  }

  if (req.method === "GET" && url.pathname === "/api/leads") {
    return sendJson(res, 200, {
      leads: (await listLeads()).map(publicLead),
      settings: {
        apiBaseUrl: config.evolutionApiUrl,
        instance: config.evolutionInstance,
        webhookUrl: `${config.appUrl}/api/webhooks/evolution`
      }
    });
  }

  if (req.method === "POST" && url.pathname === "/api/leads/upsert") {
    return sendJson(res, 200, await upsertLead(await parseBody(req)));
  }

  if (req.method === "PATCH" && url.pathname === "/api/leads/outreach") {
    const lead = await updateOutreach(await parseBody(req));
    return lead ? sendJson(res, 200, lead) : sendJson(res, 404, { error: "Lead not found" });
  }

  if (req.method === "POST" && url.pathname === "/api/webhooks/evolution") {
    return sendJson(res, 200, { ok: true, lead: await handleEvolutionWebhook(await parseBody(req)) });
  }

  if (req.method === "POST" && url.pathname === "/api/messages/send") {
    return sendJson(res, 200, await sendWhatsApp(await parseBody(req)));
  }

  if (req.method === "POST" && url.pathname === "/api/ai/prospect-message") {
    return sendJson(res, 200, { message: await generateProspectingMessage(await parseBody(req)) });
  }

  return sendJson(res, 404, { error: "Route not found" });
}

async function serveStatic(req, res, url) {
  const requested = url.pathname === "/" || url.pathname === "/ai" || url.pathname === "/ai/" ? "/index.html" : url.pathname.replace(/^\/ai\//, "/");
  const filePath = path.normalize(path.join(root, requested));
  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  try {
    const body = await fs.readFile(filePath);
    res.writeHead(200, { "content-type": mimeTypes[path.extname(filePath)] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname.startsWith("/api/")) return await routeApi(req, res, url);
    return await serveStatic(req, res, url);
  } catch (error) {
    sendJson(res, 500, { error: error.message });
  }
});

ensureAdminUser()
  .then(() => {
    server.listen(port, () => {
      console.log(`${config.appName} rodando em http://localhost:${port}`);
      console.log(useSupabase ? "Banco: Supabase" : "Banco: JSON local");
    });
  })
  .catch((error) => {
    console.error("Falha ao iniciar aplicacao", error);
    process.exit(1);
  });
