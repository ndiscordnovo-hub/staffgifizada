const { spawn } = require("child_process");
const path = require("path");

process.env.HOSTNAME = "0.0.0.0";
process.env.PORT = process.env.PORT || "80";
process.env.NODE_ENV = "production";

const port = process.env.PORT;
const nextBin = path.join(__dirname, "node_modules", ".bin", "next");

console.log(`[GifEdition] Iniciando servidor na porta ${port}...`);

const server = spawn(process.execPath, [nextBin, "start", "-p", port, "-H", "0.0.0.0"], {
  stdio: "inherit",
  cwd: __dirname,
  env: process.env,
});

server.on("close", (code) => {
  console.log(`[GifEdition] Servidor encerrou com codigo ${code}`);
  process.exit(code || 0);
});
