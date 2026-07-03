const { createServer } = require("..");
const http = require("node:http");

function startTestServer() {
  const s = http.createServer((req, res) => {
    const { url, method } = req;

    if (url === "/healthz" && method === "GET") {
      res.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" });
      return res.end(JSON.stringify({ status: "ok", timestamp: new Date().toISOString() }));
    }

    res.writeHead(404, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "not found" }));
  });

  return new Promise((resolve) => {
    s.listen(0, "127.0.0.1", () => resolve(s));
  });
}

async function request(server, { path, method = "GET", headers = {}, body }) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "127.0.0.1",
      port: server.address().port,
      path,
      method,
      headers: {
        ...headers,
        ...(body ? { "content-length": Buffer.byteLength(body) } : {})
      }
    };

    const req = http.request(options, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const raw = Buffer.concat(chunks).toString("utf8");
        let parsed = raw;
        try { parsed = JSON.parse(raw); } catch {}
        resolve({ status: res.statusCode, data: parsed });
      });
    });

    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

describe("Health endpoint", () => {
  let server;
  beforeAll(async () => {
    server = await startTestServer();
  });
  afterAll(() => server.close());

  it("returns ok from /healthz", async () => {
    const response = await request(server, { path: "/healthz", method: "GET" });
    expect(response.status).toBe(200);
    expect(response.data.status).toBe("ok");
    expect(typeof response.data.timestamp).toBe("string");
  });

  it("returns not found for unknown paths", async () => {
    const response = await request(server, { path: "/unknown", method: "GET" });
    expect(response.status).toBe(404);
    expect(response.data.error).toBe("not found");
  });
});
