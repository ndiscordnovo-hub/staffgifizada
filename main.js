const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

process.env.HOSTNAME = "0.0.0.0";
process.env.PORT = process.env.PORT || "80";
process.env.NODE_ENV = "production";

const root = __dirname;
const standaloneServer = path.join(root, ".next", "standalone", "server.js");

if (!fs.existsSync(standaloneServer)) {
  console.log("[GifEdition] Build nao encontrada, iniciando npm run build...");
  execSync("npm run build", { stdio: "inherit", cwd: root });

  const staticSrc = path.join(root, ".next", "static");
  const staticDst = path.join(root, ".next", "standalone", ".next", "static");
  if (fs.existsSync(staticSrc)) {
    fs.cpSync(staticSrc, staticDst, { recursive: true });
    console.log("[GifEdition] Static assets copiados.");
  }

  const publicSrc = path.join(root, "public");
  const publicDst = path.join(root, ".next", "standalone", "public");
  if (fs.existsSync(publicSrc)) {
    fs.cpSync(publicSrc, publicDst, { recursive: true });
    console.log("[GifEdition] Public assets copiados.");
  }

  console.log("[GifEdition] Build concluida!");
}

require(standaloneServer);
