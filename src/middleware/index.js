const config = require("../config");
const { signSession, verifySession, passwordHash, cookieValue } = require("./auth");

const isProd = config.env === "production";
const ALLOWED_ORIGINS = isProd
  ? [config.appUrl]
  : ["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000"];

function workspaceIdFrom(req) {
  const header = req.headers["x-workspace-id"];
  if (header && typeof header === "string") return header.trim();
  return null;
}

function isOriginAllowed(origin) {
  if (!origin) return true;
  return ALLOWED_ORIGINS.includes(origin);
}

function originHeaders(req) {
  const origin = req.headers.origin || "";
  if (!isOriginAllowed(origin)) {
    return { "access-control-allow-origin": "", vary: "Origin" };
  }
  return {
    "access-control-allow-origin": origin || ALLOWED_ORIGINS[0],
    "access-control-allow-credentials": "true",
    "access-control-allow-methods": "GET,POST,PATCH,OPTIONS",
    "access-control-allow-headers": "content-type,x-api-key,x-workspace-id",
    vary: "Origin"
  };
}

function securityHeaders() {
  return {
    "x-xss-protection": "1; mode=block",
    "x-content-type-options": "nosniff",
    "referrer-policy": "no-referrer"
  };
}

function respond(res, status, payload, extraHeaders = {}) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    ...securityHeaders(),
    ...extraHeaders
  });
  res.end(JSON.stringify(payload));
}

function apiKeyHeader(req) {
  return req.headers["x-api-key"];
}

function isAuthorized(req) {
  if (apiKeyHeader(req) === config.apiKey) return true;
  const session = verifySession(cookieValue(req, "meus_arquivos_session"));
  return Boolean(session);
}

module.exports = {
  isProd,
  ALLOWED_ORIGINS,
  isOriginAllowed,
  originHeaders,
  securityHeaders,
  respond,
  apiKeyHeader,
  isAuthorized,
  workspaceIdFrom,
  signSession,
  verifySession,
  passwordHash,
  cookieValue
};
