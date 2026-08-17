export default function sitemap() {
  const base = "https://gifediton.com.br";
  const routes = [
    "", "/image", "/gif", "/video", "/optimize", "/convert",
    "/batch", "/emoji", "/meme", "/qrcode", "/templates",
    "/history", "/saved", "/settings", "/atualizacoes",
    "/projects", "/parceria", "/regras",
  ];
  return routes.map((r) => ({
    url: `${base}${r}`,
    lastModified: new Date(),
    changeFrequency: r === "" ? "weekly" : "monthly",
    priority: r === "" ? 1 : 0.8,
  }));
}
