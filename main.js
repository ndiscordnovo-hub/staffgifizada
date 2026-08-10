const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

process.env.HOSTNAME = "0.0.0.0";
process.env.PORT = process.env.PORT || "80";
process.env.NODE_ENV = "production";

const root = __dirname;
const standaloneServer = path.join(root, ".next", "standalone", "server.js");
const versionFile = path.join(root, ".next", "BUILD_VERSION");
const pkg = require(path.join(root, "package.json"));
const currentVersion = pkg.version;

function needsBuild() {
  if (!fs.existsSync(standaloneServer)) return true;
  try {
    const built = fs.readFileSync(versionFile, "utf8").trim();
    if (built !== currentVersion) return true;
  } catch {
    return true;
  }
  return false;
}

if (needsBuild()) {
  console.log(`[GifEdition] Build necessaria (v${currentVersion}). Limpando e rebuildando...`);
  try { fs.rmSync(path.join(root, ".next"), { recursive: true, force: true }); } catch {}

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

  fs.writeFileSync(versionFile, currentVersion, "utf8");
  console.log(`[GifEdition] Build v${currentVersion} concluida!`);
} else {
  console.log(`[GifEdition] Build v${currentVersion} ja existe, iniciando...`);
}

require(standaloneServer);
