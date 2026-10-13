export type Status = "lido" | "lendo" | "quero-ler" | "abandonado";
export type Format = "fisico" | "ebook" | "audiobook";

export interface User {
  id: string;
  username: string;
  name: string;
  bio: string;
  avatar?: string; // data URL ou URL (foto ou GIF)
  cover?: string; // capa do perfil: foto ou GIF
  isPrivate: boolean;
  joinedAt: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  year?: number;
  pages?: number;
  coverUrl?: string;
}

export interface Comment {
  id: string;
  authorId: string;
  body: string;
  createdAt: string;
}

export interface Annotation {
  id: string;
  page?: number;
  quote: string;
  body: string;
  /** Nota privada: só a dona ou o dono da estante vê. */
  isPrivate?: boolean;
  createdAt: string;
}

export interface Entry {
  id: string;
  userId: string;
  bookId: string;
  status: Status;
  format: Format;
  labels: string[];
  rating?: number; // 1..10 — meias estrelas (7 = 3,5★)
  progress?: number; // página atual (leituras em andamento)
  review: string;
  favorite: boolean;
  spoiler: boolean;
  position: number;
  finishedAt?: string;
  createdAt: string;
  updatedAt: string;
  notes: Annotation[];
  likes: string[];
  comments: Comment[];
}

export type SceneKind = "flatlay" | "stack" | "quote" | "open" | "shelf";

export interface Scene {
  kind: SceneKind;
  tone: number;
  bookIds?: string[];
  text?: string;
}

export interface Post {
  id: string;
  authorId: string;
  image?: string;
  scene?: Scene;
  caption: string;
  bookId?: string;
  createdAt: string;
  likes: string[];
  comments: Comment[];
}

export interface Follow {
  from: string;
  to: string;
  createdAt: string;
}

export interface FollowRequest {
  from: string;
  to: string;
  createdAt: string;
}

/** Bilhete: uma única mensagem para uma conta privada, e uma única resposta. */
export interface Note {
  id: string;
  from: string;
  to: string;
  body: string;
  createdAt: string;
  reply?: string;
  repliedAt?: string;
}

export type NotifType =
  | "follow"
  | "follow_request"
  | "follow_accepted"
  | "like_post"
  | "comment_post"
  | "like_review"
  | "comment_review"
  | "note"
  | "note_reply"
  | "club_request"
  | "club_accepted"
  | "club_reply";

export interface Notif {
  id: string;
  to: string;
  actor: string;
  type: NotifType;
  postId?: string;
  entryId?: string;
  clubId?: string;
  createdAt: string;
  read: boolean;
}

/* ---------- Clubes de leitura ---------- */

export type ClubArea = "anotacoes" | "resenhas" | "duvidas" | "estudos" | "galeria" | "cronograma" | "conversa";
export type ClubFocus = "geral" | "estudos" | "quadrinhos" | "booktok" | "classicos" | "nacionais";
export type SpoilerPolicy = "sem-spoiler" | "marcados" | "liberado";
export type ClubAccess = "aberto" | "aprovacao";
export type ClubRole = "dono" | "moderador" | "membro";

export interface Club {
  id: string;
  name: string;
  description: string;
  rules: string;
  focus: ClubFocus;
  access: ClubAccess;
  spoilerPolicy: SpoilerPolicy;
  maxMembers: number; // até 50
  areas: ClubArea[];
  bookId?: string; // leitura do mês
  cover?: string; // capa do clube: foto ou GIF
  tone: number;
  ownerId: string;
  createdAt: string;
}

export interface ClubMember {
  clubId: string;
  userId: string;
  role: ClubRole;
  joinedAt: string;
}

export interface ClubRequest {
  clubId: string;
  userId: string;
  createdAt: string;
}

export interface ClubPost {
  id: string;
  clubId: string;
  area: ClubArea;
  authorId: string;
  title: string;
  body: string;
  image?: string;
  scene?: Scene; // ilustração dos dados de exemplo
  bookId?: string;
  page?: number; // até qual página o post fala (proteção contra spoiler)
  rating?: number; // resenhas
  spoiler: boolean;
  resolved?: boolean; // plantão de dúvidas
  pinned?: boolean;
  createdAt: string;
  likes: string[];
  replies: Comment[];
}

export interface State {
  version: number;
  meId: string;
  users: User[];
  books: Book[];
  entries: Entry[];
  posts: Post[];
  follows: Follow[];
  requests: FollowRequest[];
  notes: Note[];
  notifs: Notif[];
  clubs: Club[];
  clubMembers: ClubMember[];
  clubRequests: ClubRequest[];
  clubPosts: ClubPost[];
}
