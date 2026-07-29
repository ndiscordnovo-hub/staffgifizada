// Tiny zero-dependency static file server for the exported Nebula Studio site.
// Serves the ./out folder produced by `next build` (output: "export").
// Binds to 0.0.0.0 and the port provided by the host (Campos Cloud sets PORT).
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";
const ROOT = path.join(__dirname, "out");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".map": "application/json; charset=utf-8",
  ".wasm": "application/wasm",
};

function safeJoin(base, target) {
  const p = path.normalize(path.join(base, target));
  return p.startsWith(base) ? p : null; // block path traversal
}

function tryFiles(urlPath) {
  // Order of resolution for a request path.
  const candidates = [urlPath];
  if (urlPath.endsWith("/")) candidates.push(urlPath + "index.html");
  else candidates.push(urlPath + ".html", urlPath + "/index.html");
  for (const c of candidates) {
    const file = safeJoin(ROOT, c);
    if (file && fs.existsSync(file) && fs.statSync(file).isFile()) return file;
  }
  return null;
}

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
  if (urlPath === "/") urlPath = "/index.html";

  let file = tryFiles(urlPath);
  let status = 200;
  if (!file) {
    file = path.join(ROOT, "404.html");
    status = 404;
  }

  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("500 Internal Server Error");
      return;
    }
    const ext = path.extname(file).toLowerCase();
    const type = MIME[ext] || "application/octet-stream";
    // Long-cache immutable Next assets; keep HTML fresh.
    const cache = urlPath.startsWith("/_next/")
      ? "public, max-age=31536000, immutable"
      : "public, max-age=0, must-revalidate";
    res.writeHead(status, { "Content-Type": type, "Cache-Control": cache });
    res.end(data);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Nebula Studio rodando em http://${HOST}:${PORT}`);
});
