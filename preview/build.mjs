// Gera preview/dist/vivlio.html: página única para publicar no claude.ai (Artifact).
import { build } from "esbuild";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const shim = (p) => resolve(here, "shims", p);

const alias = {
  name: "vivlio-alias",
  setup(b) {
    b.onResolve({ filter: /^react$/ }, () => ({ path: shim("react.js") }));
    b.onResolve({ filter: /^react\/jsx(-dev)?-runtime$/ }, () => ({ path: shim("jsx-runtime.js") }));
    b.onResolve({ filter: /^react-dom(\/client)?$/ }, () => ({ path: shim("react-dom.js") }));
    b.onResolve({ filter: /^next\/(link|navigation)$/ }, () => ({ path: shim("navigation.tsx") }));
    b.onResolve({ filter: /^@\// }, async (args) => {
      const r = await b.resolve("./" + args.path.slice(2), { resolveDir: root, kind: args.kind });
      return { path: r.path };
    });
  },
};

const out = await build({
  entryPoints: [resolve(here, "main.tsx")],
  bundle: true,
  write: false,
  minify: true,
  format: "iife",
  target: "es2020",
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"production"' },
  plugins: [alias],
  logLevel: "warning",
});

const js = out.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");
const css = readFileSync(resolve(root, "app/globals.css"), "utf8")
  // No visualizador, a barra do topo respeita a área segura do celular.
  .concat("\n.topbar { top: env(safe-area-inset-top, 0px); }\n:root { color-scheme: dark; background: var(--bg); }\n");
const icon = readFileSync(resolve(root, "public/icon.svg"), "utf8");

const html = `<title>Vivlío</title>
<link rel="icon" href="data:image/svg+xml,${encodeURIComponent(icon)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&family=Inter:wght@400;500;600;700&display=swap">
<style>${css}</style>
<div id="root"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js"></script>
<script>${js}</script>
`;

mkdirSync(resolve(here, "dist"), { recursive: true });
writeFileSync(resolve(here, "dist/vivlio.html"), html);
console.log(`preview/dist/vivlio.html — ${(html.length / 1024).toFixed(0)} KB`);
