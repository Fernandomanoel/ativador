// Entrada da prévia publicada no claude.ai: o mesmo app, com roteamento em memória.
import { createRoot } from "react-dom/client";
import type { ComponentType } from "react";
import { ParamsProvider, useHref } from "next/navigation";
import { Shell } from "@/components/Shell";
import { StoreProvider } from "@/lib/store";
import Feed from "@/app/page";
import Explorar from "@/app/explorar/page";
import Novo from "@/app/novo/page";
import Notificacoes from "@/app/notificacoes/page";
import Configuracoes from "@/app/configuracoes/page";
import Adicionar from "@/app/estante/adicionar/page";
import Clubes from "@/app/clubes/page";
import ClubeNovo from "@/app/clubes/novo/page";
import Clube from "@/app/clubes/[id]/page";
import ClubeConfig from "@/app/clubes/[id]/config/page";
import Post from "@/app/p/[id]/page";
import Perfil from "@/app/u/[username]/page";
import Entrada from "@/app/u/[username]/livro/[bookId]/page";
import Seguidores from "@/app/u/[username]/seguidores/page";
import Seguindo from "@/app/u/[username]/seguindo/page";
import Livro from "@/app/livro/[bookId]/page";
import NotFound from "@/app/not-found";

const ROUTES: [string, ComponentType][] = [
  ["/", Feed],
  ["/explorar", Explorar],
  ["/novo", Novo],
  ["/notificacoes", Notificacoes],
  ["/configuracoes", Configuracoes],
  ["/estante/adicionar", Adicionar],
  ["/clubes", Clubes],
  ["/clubes/novo", ClubeNovo],
  ["/clubes/:id", Clube],
  ["/clubes/:id/config", ClubeConfig],
  ["/p/:id", Post],
  ["/u/:username", Perfil],
  ["/u/:username/livro/:bookId", Entrada],
  ["/u/:username/seguidores", Seguidores],
  ["/u/:username/seguindo", Seguindo],
  ["/livro/:bookId", Livro],
];

function match(path: string): [ComponentType, Record<string, string>] {
  const parts = path.split("/").filter(Boolean);
  for (const [pattern, C] of ROUTES) {
    const pp = pattern.split("/").filter(Boolean);
    if (pp.length !== parts.length) continue;
    const params: Record<string, string> = {};
    if (pp.every((p, i) => (p.startsWith(":") ? ((params[p.slice(1)] = parts[i]), true) : p === parts[i]))) return [C, params];
  }
  return [NotFound, {}];
}

function Router() {
  const path = useHref().split("?")[0];
  const [Page, params] = match(path);
  return (
    <ParamsProvider value={params}>
      <Page key={path} />
    </ParamsProvider>
  );
}

// O visualizador não mostra confirm(); as ações destrutivas só mexem nos dados de exemplo deste navegador.
window.confirm = () => true;

createRoot(document.getElementById("root")!).render(
  <StoreProvider>
    <Shell>
      <Router />
    </Shell>
  </StoreProvider>,
);
