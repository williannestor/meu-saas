const stages = ["Entrada", "Qualificação", "Proposta", "Fechamento"];
const API_MODE = window.location.protocol !== "file:";

const demoData = {
  selectedId: "lead-1",
  settings: {
    apiBaseUrl: "https://evolution.exemplo.com",
    instance: "comercial-principal",
    apiKey: "",
    webhookUrl: "https://app.seudominio.com/api/webhooks/evolution"
  },
  conversations: [
    {
      id: "lead-1",
      name: "Mariana Lopes",
      company: "Clínica Aurora",
      phone: "+5565992218830",
      stage: "Qualificação",
      value: 4200,
      owner: "Ana",
      tags: ["quente", "implantação"],
      notes: "Quer centralizar agenda, dúvidas frequentes e retorno de orçamento em uma única fila.",
      priority: "Alta",
      source: "Evolution API",
      lastSeen: "Agora",
      messages: [
        { from: "lead", text: "Oi, vi o anúncio. Vocês conseguem atender mais de uma unidade?", time: "09:12" },
        { from: "agent", text: "Conseguimos sim. Hoje vocês usam quantos números de WhatsApp?", time: "09:13" },
        { from: "lead", text: "São 3 unidades e cada uma tem um celular próprio.", time: "09:15" }
      ]
    },
    {
      id: "lead-2",
      name: "Rafael Nunes",
      company: "Nunes Energia Solar",
      phone: "+5565981430171",
      stage: "Proposta",
      value: 7600,
      owner: "Bruno",
      tags: ["proposta", "B2B"],
      notes: "Precisa integrar equipe comercial externa e registrar origem das indicações.",
      priority: "Média",
      source: "Evolution API",
      lastSeen: "12 min",
      messages: [
        { from: "lead", text: "Recebi a proposta. Ela inclui integração com CRM?", time: "08:44" },
        { from: "agent", text: "Inclui sim, com histórico do contato, funil e tarefas automáticas.", time: "08:46" }
      ]
    },
    {
      id: "lead-3",
      name: "Bianca Freitas",
      company: "Studio BF",
      phone: "+5565998422291",
      stage: "Entrada",
      value: 1800,
      owner: "Carla",
      tags: ["novo", "instagram"],
      notes: "Chegou via campanha de Instagram. Quer reduzir mensagens perdidas no WhatsApp.",
      priority: "Alta",
      source: "Manual",
      lastSeen: "28 min",
      messages: [
        { from: "lead", text: "Queria saber se dá para responder clientes pelo computador e deixar tudo salvo.", time: "10:02" }
      ]
    },
    {
      id: "lead-4",
      name: "Eduardo Martins",
      company: "Martins Autopeças",
      phone: "+5565984107190",
      stage: "Fechamento",
      value: 9800,
      owner: "Ana",
      tags: ["contrato", "varejo"],
      notes: "Validando contrato anual. Ponto de decisão: limite de atendentes simultâneos.",
      priority: "Alta",
      source: "Evolution API",
      lastSeen: "1 h",
      messages: [
        { from: "lead", text: "Se fecharmos hoje, vocês ajudam a subir os modelos de mensagem?", time: "07:58" },
        { from: "agent", text: "Sim. A implantação inclui modelos, etiquetas e treinamento inicial.", time: "08:01" }
      ]
    }
  ]
};

let state = loadState();

const dom = {
  loginScreen: document.querySelector("#loginScreen"),
  loginForm: document.querySelector("#loginForm"),
  loginEmail: document.querySelector("#loginEmail"),
  loginPassword: document.querySelector("#loginPassword"),
  navItems: document.querySelectorAll(".nav-item"),
  views: document.querySelectorAll(".view"),
  conversationItems: document.querySelector("#conversationItems"),
  conversationSearch: document.querySelector("#conversationSearch"),
  ownerFilter: document.querySelector("#ownerFilter"),
  queueCount: document.querySelector("#queueCount"),
  chatHeader: document.querySelector("#chatHeader"),
  messages: document.querySelector("#messages"),
  replyForm: document.querySelector("#replyForm"),
  replyInput: document.querySelector("#replyInput"),
  templateButton: document.querySelector("#templateButton"),
  simulateInboundButton: document.querySelector("#simulateInboundButton"),
  leadForm: document.querySelector("#leadForm"),
  leadName: document.querySelector("#leadName"),
  leadCompany: document.querySelector("#leadCompany"),
  leadPhone: document.querySelector("#leadPhone"),
  leadStage: document.querySelector("#leadStage"),
  leadValue: document.querySelector("#leadValue"),
  leadOwner: document.querySelector("#leadOwner"),
  leadNotes: document.querySelector("#leadNotes"),
  pipelineBoard: document.querySelector("#pipelineBoard"),
  metricOpen: document.querySelector("#metricOpen"),
  metricLeads: document.querySelector("#metricLeads"),
  metricConnection: document.querySelector("#metricConnection"),
  metricInstance: document.querySelector("#metricInstance"),
  metricRevenue: document.querySelector("#metricRevenue"),
  toast: document.querySelector("#toast"),
  newLeadButton: document.querySelector("#newLeadButton"),
  logoutButton: document.querySelector("#logoutButton"),
  seedReset: document.querySelector("#seedReset"),
  settingsForm: document.querySelector("#settingsForm"),
  apiBaseUrl: document.querySelector("#apiBaseUrl"),
  apiInstance: document.querySelector("#apiInstance"),
  apiKey: document.querySelector("#apiKey"),
  webhookUrl: document.querySelector("#webhookUrl"),
  sendEndpoint: document.querySelector("#sendEndpoint"),
  copyPayloadButton: document.querySelector("#copyPayloadButton")
};

document.body.classList.toggle("is-locked", API_MODE);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadState() {
  const stored = localStorage.getItem("conectazap-crm");
  if (!stored) return clone(demoData);

  try {
    const parsed = JSON.parse(stored);
    return {
      ...clone(demoData),
      ...parsed,
      settings: { ...demoData.settings, ...(parsed.settings || {}) }
    };
  } catch {
    return clone(demoData);
  }
}

function saveState() {
  localStorage.setItem("conectazap-crm", JSON.stringify(state));
}

function mapLeadFromApi(lead) {
  return {
    id: lead.id,
    name: lead.name || lead.company || "Lead sem nome",
    company: lead.company || "Empresa sem cadastro",
    phone: lead.phone || "",
    stage: lead.stage || "Entrada",
    value: Number(lead.value || 0),
    owner: lead.owner || "Ana",
    tags: Array.isArray(lead.tags) ? lead.tags : ["crm"],
    notes: lead.notes || "",
    priority: lead.priority || "Média",
    source: lead.source || "Banco do SaaS",
    lastSeen: lead.lastSeen || "Agora",
    messages: Array.isArray(lead.messages) ? lead.messages : []
  };
}

async function syncFromApi() {
  if (!API_MODE) return;

  try {
    const response = await fetch("/api/leads");
    if (!response.ok) throw new Error("Falha ao carregar leads");
    const payload = await response.json();
    state.conversations = payload.leads.map(mapLeadFromApi);
    state.settings = { ...state.settings, ...(payload.settings || {}) };
    state.selectedId = state.conversations[0]?.id || state.selectedId;
    saveState();
    renderAll();
  } catch (error) {
    console.warn("Usando dados locais; API indisponível.", error);
  }
}

async function checkSession() {
  if (!API_MODE) {
    document.body.classList.remove("is-locked");
    return;
  }

  try {
    const response = await fetch("/api/session");
    const session = await response.json();
    document.body.classList.toggle("is-locked", !session.authenticated);
    if (session.authenticated) await syncFromApi();
  } catch {
    document.body.classList.add("is-locked");
  }
}

async function apiRequest(path, options) {
  if (!API_MODE) return null;

  const response = await fetch(path, {
    headers: { "content-type": "application/json" },
    ...options
  });
  if (!response.ok) throw new Error(`API ${path} retornou ${response.status}`);
  return response.json();
}

function leadToApiPayload(lead) {
  return {
    id: lead.id,
    name: lead.name,
    company: lead.company,
    phone: lead.phone,
    stage: lead.stage,
    value: lead.value,
    owner: lead.owner,
    tags: lead.tags,
    notes: lead.notes,
    priority: lead.priority,
    source: lead.source
  };
}

async function persistLeadToApi(lead) {
  try {
    await apiRequest("/api/leads/upsert", {
      method: "POST",
      body: JSON.stringify(leadToApiPayload(lead))
    });
  } catch (error) {
    console.warn("Lead salvo apenas localmente.", error);
  }
}

function selectedLead() {
  return state.conversations.find((item) => item.id === state.selectedId) || state.conversations[0];
}

function money(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0
  });
}

function initials(name) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function normalizePhone(phone) {
  return phone.replace(/\D/g, "");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function filteredConversations() {
  const term = dom.conversationSearch.value.trim().toLowerCase();
  const owner = dom.ownerFilter.value;

  return state.conversations.filter((conversation) => {
    const haystack = [
      conversation.name,
      conversation.company,
      conversation.phone,
      conversation.owner,
      conversation.stage,
      conversation.source,
      ...conversation.tags
    ]
      .join(" ")
      .toLowerCase();

    return (owner === "all" || conversation.owner === owner) && (!term || haystack.includes(term));
  });
}

function renderMetrics() {
  const totalValue = state.conversations.reduce((sum, item) => sum + Number(item.value || 0), 0);
  const hasConnection = Boolean(state.settings.apiBaseUrl && state.settings.instance);
  dom.metricOpen.textContent = state.conversations.length;
  dom.metricLeads.textContent = state.conversations.length;
  dom.metricRevenue.textContent = money(totalValue);
  dom.queueCount.textContent = `${filteredConversations().length} na fila`;
  dom.metricConnection.textContent = hasConnection ? "Configurada" : "Demo";
  dom.metricInstance.textContent = state.settings.instance || "Sem instância";
}

function renderConversationList() {
  const list = filteredConversations();
  dom.conversationItems.innerHTML = "";

  list.forEach((conversation) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `conversation-item ${conversation.id === state.selectedId ? "is-active" : ""}`;
    button.dataset.id = conversation.id;
    button.innerHTML = `
      <div class="conversation-row">
        <strong>${escapeHtml(conversation.name)}</strong>
        <span class="conversation-meta">${escapeHtml(conversation.lastSeen)}</span>
      </div>
      <span class="conversation-meta">${escapeHtml(conversation.company)} · ${escapeHtml(conversation.owner)}</span>
      <div class="badge-row">
        <span class="badge ${conversation.priority === "Alta" ? "hot" : ""}">${escapeHtml(conversation.priority)}</span>
        <span class="badge">${escapeHtml(conversation.stage)}</span>
        <span class="badge source">${escapeHtml(conversation.source || "Manual")}</span>
        ${conversation.tags.map((tag) => `<span class="badge">${escapeHtml(tag)}</span>`).join("")}
      </div>
    `;
    dom.conversationItems.append(button);
  });
}

function renderChat() {
  const lead = selectedLead();
  if (!lead) return;

  dom.chatHeader.innerHTML = `
    <div class="chat-contact">
      <div class="avatar">${escapeHtml(initials(lead.name))}</div>
      <div>
        <h2>${escapeHtml(lead.name)}</h2>
        <span class="conversation-meta">${escapeHtml(lead.phone)} · ${escapeHtml(lead.company)}</span>
      </div>
    </div>
    <span class="badge ${lead.priority === "Alta" ? "hot" : ""}">${escapeHtml(lead.stage)}</span>
  `;

  dom.messages.innerHTML = "";
  lead.messages.forEach((message) => {
    const bubble = document.createElement("div");
    bubble.className = `message ${message.from === "agent" ? "out" : "in"}`;
    bubble.innerHTML = `${escapeHtml(message.text)}<small>${escapeHtml(message.time)}</small>`;
    dom.messages.append(bubble);
  });
  dom.messages.scrollTop = dom.messages.scrollHeight;
}

function renderLeadForm() {
  const lead = selectedLead();
  if (!lead) return;

  dom.leadName.value = lead.name;
  dom.leadCompany.value = lead.company;
  dom.leadPhone.value = lead.phone;
  dom.leadStage.value = lead.stage;
  dom.leadValue.value = lead.value;
  dom.leadOwner.value = lead.owner;
  dom.leadNotes.value = lead.notes;
}

function renderPipeline() {
  dom.pipelineBoard.innerHTML = "";

  stages.forEach((stage) => {
    const leads = state.conversations.filter((item) => item.stage === stage);
    const column = document.createElement("section");
    column.className = "pipeline-column";
    column.innerHTML = `
      <header>
        <h2>${escapeHtml(stage)}</h2>
        <span>${leads.length} leads</span>
      </header>
    `;

    leads.forEach((lead) => {
      const card = document.createElement("article");
      card.className = "lead-card";
      card.innerHTML = `
        <div>
          <strong>${escapeHtml(lead.name)}</strong>
          <small>${escapeHtml(lead.company)} · ${escapeHtml(lead.owner)}</small>
        </div>
        <span>${money(lead.value)}</span>
        <button class="ghost-button" type="button" data-open-lead="${lead.id}">Abrir</button>
      `;
      column.append(card);
    });

    dom.pipelineBoard.append(column);
  });
}

function renderSettings() {
  dom.apiBaseUrl.value = state.settings.apiBaseUrl || "";
  dom.apiInstance.value = state.settings.instance || "";
  dom.apiKey.value = state.settings.apiKey || "";
  dom.webhookUrl.value = state.settings.webhookUrl || "";
  dom.sendEndpoint.textContent = `POST /message/sendText/${state.settings.instance || "{instance}"}`;
}

function renderAll() {
  renderMetrics();
  renderConversationList();
  renderChat();
  renderLeadForm();
  renderPipeline();
  renderSettings();
}

function showToast(message) {
  dom.toast.textContent = message;
  dom.toast.classList.add("is-visible");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => dom.toast.classList.remove("is-visible"), 2800);
}

function setView(viewName) {
  dom.navItems.forEach((item) => item.classList.toggle("is-active", item.dataset.view === viewName));
  dom.views.forEach((view) => view.classList.toggle("is-visible", view.id === `view-${viewName}`));
}

function selectLead(id) {
  state.selectedId = id;
  saveState();
  renderAll();
}

function nowTime() {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date());
}

function buildEvolutionPayload(text, lead = selectedLead()) {
  return {
    endpoint: `${state.settings.apiBaseUrl}/message/sendText/${state.settings.instance}`,
    headers: {
      apikey: state.settings.apiKey ? "********" : "SUA_API_KEY"
    },
    body: {
      number: normalizePhone(lead.phone),
      text
    }
  };
}

function upsertLeadFromEvolution(event) {
  const phone = normalizePhone(event.data.key.remoteJid);
  const existing = state.conversations.find((conversation) => normalizePhone(conversation.phone) === phone);
  const lead =
    existing ||
    {
      id: `lead-${Date.now()}`,
      name: event.data.pushName || "Contato WhatsApp",
      company: "Empresa não identificada",
      phone,
      stage: "Entrada",
      value: 0,
      owner: "Ana",
      tags: ["whatsapp"],
      notes: "Lead criado automaticamente pelo webhook da Evolution API.",
      priority: "Média",
      source: "Evolution API",
      lastSeen: "Agora",
      messages: []
    };

  lead.messages.push({
    from: "lead",
    text: event.data.message.conversation,
    time: nowTime()
  });
  lead.lastSeen = "Agora";
  lead.source = "Evolution API";

  if (!existing) state.conversations.unshift(lead);
  state.selectedId = lead.id;
}

dom.navItems.forEach((item) => {
  item.addEventListener("click", () => setView(item.dataset.view));
});

dom.loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: dom.loginEmail.value.trim(),
        password: dom.loginPassword.value
      })
    });
    if (!response.ok) throw new Error("Login invalido");
    document.body.classList.remove("is-locked");
    dom.loginPassword.value = "";
    await syncFromApi();
  } catch {
    showToast("E-mail ou senha invalidos.");
  }
});

dom.logoutButton.addEventListener("click", async () => {
  if (API_MODE) {
    await fetch("/api/logout", { method: "POST" });
    document.body.classList.add("is-locked");
    return;
  }
  showToast("Sessao local encerrada.");
});

dom.conversationItems.addEventListener("click", (event) => {
  const button = event.target.closest("[data-id]");
  if (!button) return;
  selectLead(button.dataset.id);
});

dom.conversationSearch.addEventListener("input", renderAll);
dom.ownerFilter.addEventListener("change", renderAll);

dom.replyForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = dom.replyInput.value.trim();
  if (!text) return;

  const lead = selectedLead();
  const payload = buildEvolutionPayload(text, lead);
  lead.messages.push({ from: "agent", text, time: nowTime() });
  lead.lastSeen = "Agora";
  dom.replyInput.value = "";
  saveState();
  renderAll();
  apiRequest("/api/leads/outreach", {
    method: "PATCH",
    body: JSON.stringify({ phone: lead.phone, message: text, sentStatus: "Respondido", status: "Em atendimento" })
  }).catch((error) => console.warn("Mensagem registrada apenas localmente.", error));
  console.info("Payload Evolution API", payload);
  showToast("Mensagem registrada e payload Evolution API gerado no console.");
});

dom.templateButton.addEventListener("click", () => {
  dom.replyInput.value =
    "Perfeito. Vou te fazer duas perguntas rápidas para indicar o melhor plano: quantos atendentes usam o WhatsApp hoje e qual CRM vocês utilizam?";
  dom.replyInput.focus();
});

dom.simulateInboundButton.addEventListener("click", () => {
  const event = {
    event: "messages.upsert",
    instance: state.settings.instance,
    data: {
      key: { remoteJid: "5565997001122@s.whatsapp.net" },
      pushName: "Cliente Evolution",
      message: { conversation: "Olá, quero integrar meu WhatsApp com o CRM." }
    }
  };
  upsertLeadFromEvolution(event);
  saveState();
  renderAll();
  apiRequest("/api/webhooks/evolution", {
    method: "POST",
    body: JSON.stringify(event)
  }).catch((error) => console.warn("Webhook simulado apenas localmente.", error));
  showToast("Webhook simulado: lead criado e conversa vinculada ao CRM.");
});

dom.leadForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const lead = selectedLead();
  Object.assign(lead, {
    name: dom.leadName.value.trim(),
    company: dom.leadCompany.value.trim(),
    phone: dom.leadPhone.value.trim(),
    stage: dom.leadStage.value,
    value: Number(dom.leadValue.value || 0),
    owner: dom.leadOwner.value,
    notes: dom.leadNotes.value.trim()
  });
  saveState();
  renderAll();
  persistLeadToApi(lead);
  showToast("Lead atualizado no CRM.");
});

dom.pipelineBoard.addEventListener("click", (event) => {
  const button = event.target.closest("[data-open-lead]");
  if (!button) return;
  selectLead(button.dataset.openLead);
  setView("inbox");
});

dom.newLeadButton.addEventListener("click", () => {
  const id = `lead-${Date.now()}`;
  state.conversations.unshift({
    id,
    name: "Novo lead",
    company: "Empresa sem cadastro",
    phone: "+5565900000000",
    stage: "Entrada",
    value: 0,
    owner: "Ana",
    tags: ["manual"],
    notes: "Lead criado manualmente pela operação.",
    priority: "Média",
    source: "Manual",
    lastSeen: "Agora",
    messages: [{ from: "lead", text: "Contato iniciado manualmente.", time: nowTime() }]
  });
  selectLead(id);
  setView("inbox");
  persistLeadToApi(state.conversations[0]);
  showToast("Novo lead criado e vinculado ao CRM.");
});

dom.seedReset.addEventListener("click", () => {
  state = clone(demoData);
  saveState();
  setView("inbox");
  renderAll();
  showToast("Dados de demonstração restaurados.");
});

dom.settingsForm.addEventListener("submit", (event) => {
  event.preventDefault();
  state.settings = {
    apiBaseUrl: dom.apiBaseUrl.value.trim().replace(/\/$/, ""),
    instance: dom.apiInstance.value.trim(),
    apiKey: dom.apiKey.value.trim(),
    webhookUrl: dom.webhookUrl.value.trim()
  };
  saveState();
  renderAll();
  showToast("Conexão Evolution API salva localmente.");
});

dom.copyPayloadButton.addEventListener("click", async () => {
  const payload = buildEvolutionPayload("Mensagem de teste via ConectaZap CRM");
  const text = JSON.stringify(payload, null, 2);
  try {
    await navigator.clipboard.writeText(text);
    showToast("Payload de envio copiado.");
  } catch {
    console.info("Payload Evolution API", payload);
    showToast("Clipboard bloqueado; payload enviado para o console.");
  }
});

document.querySelector("#view-automations").addEventListener("click", (event) => {
  const button = event.target.closest("[data-automation]");
  if (!button) return;

  const lead = selectedLead();
  const automation = button.dataset.automation;

  if (automation === "welcome") {
    lead.messages.push({
      from: "agent",
      text: "Olá! Sou da equipe comercial. Para te ajudar melhor, qual é o principal desafio do seu atendimento hoje?",
      time: nowTime()
    });
    lead.stage = "Entrada";
    lead.source = "Evolution API";
  }

  if (automation === "followup") {
    lead.priority = "Alta";
    lead.tags = Array.from(new Set([...lead.tags, "follow-up"]));
    lead.notes = `${lead.notes}\nTarefa criada: retornar contato em até 24h.`;
  }

  if (automation === "proposal") {
    lead.stage = "Proposta";
    lead.tags = Array.from(new Set([...lead.tags, "proposta"]));
  }

  saveState();
  renderAll();
  showToast("Automação aplicada ao lead selecionado.");
});

renderAll();
checkSession();
