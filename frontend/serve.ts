import { readFileSync } from "fs";
import { join } from "path";

const PORT = 3000;
const ROOT = import.meta.dir;

async function buildApp(): Promise<string> {
  const entrypoint = join(ROOT, "src", "main.ts");

  const result = await Bun.build({
    entrypoints: [entrypoint],
    target: "browser",
    format: "esm",
    minify: false,
    sourcemap: "inline",
  });

  if (!result.success) {
    const errors = result.logs.map((l) => l.message).join("\n");
    console.error("Build failed:\n", errors);
    return `document.body.innerText = ${JSON.stringify("Build error:\\n" + errors)};`;
  }

  const js = await result.outputs[0].text();
  console.log(`[build] Rebuilt app.js (${(js.length / 1024).toFixed(1)} KB)`);
  return js;
}

Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;

    if (path === "/app.js") {
      const js = await buildApp();
      return new Response(js, {
        headers: { "Content-Type": "application/javascript" },
      });
    }

    if (path === "/" || path === "/index.html") {
      const html = readFileSync(join(ROOT, "index.html"), "utf8");
      return new Response(html, {
        headers: { "Content-Type": "text/html" },
      });
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Dev server running at http://localhost:${PORT}`);
