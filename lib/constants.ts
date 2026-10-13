import type { Format, Status } from "./types";

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
