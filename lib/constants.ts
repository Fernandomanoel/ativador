import type { ClubAccess, ClubArea, ClubFocus, Format, SpoilerPolicy, Status } from "./types";

export const STATUSES: { id: Status; label: string }[] = [
  { id: "lido", label: "Lido" },
  { id: "lendo", label: "Lendo" },
  { id: "quero-ler", label: "Quero ler" },
  { id: "abandonado", label: "Abandonado" },
];

export const FORMATS: { id: Format; label: string; icon: string }[] = [
  { id: "fisico", label: "Físico", icon: "📖" },
  { id: "ebook", label: "E-book", icon: "📱" },
  { id: "audiobook", label: "Audiobook", icon: "🎧" },
];

/** Rótulos pré-estabelecidos para organizar a estante. */
export const LABELS: string[] = [
  "Favoritos da vida",
  "Clássicos",
  "Nacionais",
  "Romance",
  "Fantasia",
  "Ficção científica",
  "Suspense",
  "Terror",
  "Não-ficção",
  "Poesia",
  "Young adult",
  "HQ & mangá",
  "Me fez chorar",
  "Releitura",
  "Clube do livro",
  "Booktok",
];

export const statusLabel = (s: Status) => STATUSES.find((x) => x.id === s)?.label ?? s;
export const formatLabel = (f: Format) => FORMATS.find((x) => x.id === f)?.label ?? f;
export const formatIcon = (f: Format) => FORMATS.find((x) => x.id === f)?.icon ?? "";

export const NOTE_MAX = 280;

/* ---------- Clubes de leitura ---------- */


/** Limite de membros por clube, para manter a conversa sob controle. */
export const CLUB_MAX = 50;

export const CLUB_AREAS: { id: ClubArea; label: string; icon: string; hint: string }[] = [
  { id: "anotacoes", label: "Anotações", icon: "✍️", hint: "Trechos, marcações e pensamentos durante a leitura." },
  { id: "resenhas", label: "Resenhas do mês", icon: "⭐", hint: "Cada membro publica sua resenha da leitura do mês." },
  { id: "duvidas", label: "Plantão de dúvidas", icon: "❓", hint: "Perguntas sobre o livro; marque como resolvida quando responderem." },
  { id: "estudos", label: "Área de estudos", icon: "🎓", hint: "Fichamentos, contexto histórico, análises e material de apoio." },
  { id: "galeria", label: "Galeria", icon: "🖼️", hint: "Compartilhe páginas e quadros de quadrinhos e mangás, fotos de edições." },
  { id: "cronograma", label: "Cronograma", icon: "🗓️", hint: "Metas de leitura: até onde ler a cada semana." },
  { id: "conversa", label: "Bate-papo", icon: "💬", hint: "Conversa livre entre os membros." },
];

export const CLUB_FOCUS: { id: ClubFocus; label: string; areas: ClubArea[]; spoiler: SpoilerPolicy }[] = [
  { id: "geral", label: "Leitura em grupo", areas: ["anotacoes", "resenhas", "duvidas", "cronograma", "conversa"], spoiler: "marcados" },
  { id: "estudos", label: "Estudos", areas: ["estudos", "duvidas", "anotacoes", "cronograma"], spoiler: "liberado" },
  { id: "quadrinhos", label: "Quadrinhos & mangá", areas: ["galeria", "resenhas", "conversa"], spoiler: "marcados" },
  { id: "booktok", label: "Booktok", areas: ["resenhas", "galeria", "conversa"], spoiler: "sem-spoiler" },
  { id: "classicos", label: "Clássicos", areas: ["anotacoes", "estudos", "duvidas", "resenhas"], spoiler: "liberado" },
  { id: "nacionais", label: "Literatura nacional", areas: ["anotacoes", "resenhas", "duvidas", "conversa"], spoiler: "marcados" },
];

export const SPOILER_POLICIES: { id: SpoilerPolicy; label: string; hint: string }[] = [
  { id: "sem-spoiler", label: "Zero spoiler", hint: "Posts que citam páginas ficam escondidos para quem ainda não chegou lá. Ideal para quem odeia spoiler." },
  { id: "marcados", label: "Spoilers marcados", hint: "Spoilers podem ser postados, mas aparecem borrados até a pessoa clicar." },
  { id: "liberado", label: "Liberado", hint: "Sem restrições — bom para grupos de estudo e releituras." },
];

export const CLUB_ACCESS: { id: ClubAccess; label: string; hint: string }[] = [
  { id: "aberto", label: "Aberto", hint: "Qualquer leitor entra enquanto houver vaga." },
  { id: "aprovacao", label: "Com aprovação", hint: "Quem quiser entrar pede, e a moderação aprova." },
];

export const areaInfo = (a: ClubArea) => CLUB_AREAS.find((x) => x.id === a)!;
export const focusLabel = (f: ClubFocus) => CLUB_FOCUS.find((x) => x.id === f)?.label ?? f;
export const spoilerLabel = (p: SpoilerPolicy) => SPOILER_POLICIES.find((x) => x.id === p)?.label ?? p;
