const crypto = require("node:crypto");

function requestId() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 12);
}

function timestamp() {
  return new Date().toISOString();
}

function summary(req, status, durationMs) {
  return {
    ts: timestamp(),
    id: global.logId,
    method: req.method,
    path: req.url,
    status,
    durationMs: Number(durationMs.toFixed(2)),
    workspace: req.workspaceId || null,
    origin: req.headers.origin || null
  };
}

function log(summary) {
  const parts = [
    `id=${summary.id}`,
    `${summary.method} ${summary.path} status=${summary.status} duration=${summary.durationMs}ms`,
    `workspace=${summary.workspace ?? "-"}`,
    `origin=${summary.origin ?? "-"}`
  ].join(" ");

  if (summary.status >= 500) {
    console.error(summary.ts, "ERROR", parts);
  } else if (summary.status >= 400) {
    console.warn(summary.ts, "WARN", parts);
  } else {
    console.info(summary.ts, "INFO", parts);
  }
}

async function logger(req, res, next) {
  const start = Date.now();
  global.logId = requestId();
  req.workspaceId = req.workspaceId || null;

  const originalEnd = res.end.bind(res);
  res.end = function (...args) {
    const duration = Date.now() - start;
    log(summary(req, res.statusCode, duration));
    global.logId = null;
    return originalEnd(...args);
  };

  next();
}

module.exports = {
  requestId,
  timestamp,
  summary,
  log,
  logger
};
