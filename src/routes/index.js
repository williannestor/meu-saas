const config = require("../../config");
const { respond, originHeaders, isProd, signSession, workspaceIdFrom, parseBody, cookieValue, isAuthorized } = require("../../middleware");
const controller = require("../../controllers");

async function handleAuth(req, res) {
  if (req.method === "GET" && req.url === "/api/session") {
    return respond(res, 200, { authenticated: false, user: null });
  }

  if (req.method === "POST" && req.url === "/api/login") {
    const body = await parseBody(req);
    const workspaceId = workspaceIdFrom(req) || "default";
    const user = await controller.findUser(workspaceId, body.email);
    if (!user) {
      Object.entries(originHeaders(req)).forEach(([k, v]) => res.setHeader(k, v));
      return respond(res, 401, { error: "Credenciais invalidas" });
    }
    const sessionUser = { id: user.id, email: user.email, name: user.name, role: user.role, workspaceId };
    const token = signSession({ user: sessionUser, exp: Date.now() + 1000 * 60 * 60 * 12 });
    const cookie = `meus_arquivos_session=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=43200${isProd ? "; Secure" : ""}`;
    Object.entries(originHeaders(req)).forEach(([k, v]) => res.setHeader(k, v));
    return respond(res, 200, { authenticated: true, user: sessionUser }, { "set-cookie": cookie });
  }

  if (req.method === "POST" && req.url === "/api/logout") {
    const cookie = `meus_arquivos_session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${isProd ? "; Secure" : ""}`;
    Object.entries(originHeaders(req)).forEach(([k, v]) => res.setHeader(k, v));
    return respond(res, 200, { ok: true }, { "set-cookie": cookie });
  }

  return null;
}

async function handleLeads(req, res, workspaceId) {
  if (req.method === "OPTIONS") {
    Object.entries(originHeaders(req)).forEach(([k, v]) => res.setHeader(k, v));
    return respond(res, 204, {});
  }

  const authorized = isAuthorized(req);
  if (!authorized && !req.url.startsWith("/api/webhooks/evolution")) {
    Object.entries(originHeaders(req)).forEach(([k, v]) => res.setHeader(k, v));
    return respond(res, 401, { error: "Unauthorized" });
  }

  Object.entries(originHeaders(req)).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === "GET" && req.url === "/api/leads") {
    const leads = await controller.loadLeads(workspaceId);
    return respond(res, 200, {
      leads: leads.map((lead) => ({ ...lead, Telefone: lead.phone })),
      settings: {
        apiBaseUrl: config.evolutionApiUrl,
        instance: config.evolutionInstance,
        webhookUrl: `${config.appUrl}/api/webhooks/evolution`
      }
    });
  }

  if (req.method === "POST" && req.url === "/api/leads/upsert") {
    const body = await parseBody(req);
    const lead = await controller.saveLead(workspaceId, body);
    return respond(res, 200, lead);
  }

  if (req.method === "PATCH" && req.url === "/api/leads/outreach") {
    const body = await parseBody(req);
    const lead = await controller.patchLead(workspaceId, body);
    return lead ? respond(res, 200, lead) : respond(res, 404, { error: "Lead not found" });
  }

  return null;
}

async function handleWebhook(req, res) {
  if (req.method === "POST" && req.url === "/api/webhooks/evolution") {
    const body = await parseBody(req);
    const remoteJid = body?.data?.key?.remoteJid || body?.remoteJid || "";
    const text = body?.data?.message?.conversation || body?.message || body?.text || "";
    const pushName = body?.data?.pushName || body?.pushName || "Contato WhatsApp";

    const workspaceId = workspaceIdFrom(req) || "default";
    const lead = await controller.saveLead(workspaceId, {
      name: pushName,
      company: pushName,
      phone: remoteJid,
      source: "Evolution API",
      tags: ["whatsapp", "entrada"],
      notes: "Lead criado ou atualizado pelo webhook da Evolution API."
    });

    if (!text) return respond(res, 200, { ok: true, lead });

    const updated = await controller.patchLead(workspaceId, {
      phone: remoteJid,
      status: "Respondeu",
      sentStatus: "Respondeu",
      message: text
    });
    return respond(res, 200, { ok: true, lead: updated });
  }
  return null;
}

module.exports = { handleAuth, handleLeads, handleWebhook };
