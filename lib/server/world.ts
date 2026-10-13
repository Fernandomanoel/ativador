import "server-only";

import { randomBytes } from "node:crypto";
import { runOp, type OpName } from "../logic";
import { books as seedBooks } from "../seed";
import { canSeePosts, canModerate, followersOf, followingOf, memberOf } from "../selectors";
import type { State, User } from "../types";
import { nowIso } from "../util";
import { getDb, type Db } from "./db";
import { cleanArgs } from "./validate";

// Fase de testes: o "mundo" do Vivlío é um único documento JSON no Postgres,
// gravado com controle de versão (se duas pessoas agirem ao mesmo tempo, a
// segunda tentativa relê e reaplica). As regras são as mesmas de lib/logic.ts, e
// cada pessoa só recebe o recorte que pode ver (projectFor). Imagens ficam numa
// tabela própria, fora do documento.

export interface World extends State {
  /** Dados que nunca saem do servidor. */
  auth: {
    accounts: Record<string, string>; // "google:123" → id do leitor
    emails: Record<string, string>; // id do leitor → e-mail
  };
}

export const WORLD_VERSION = 1;

function emptyWorld(): World {
  return {
    version: WORLD_VERSION,
    meId: "",
    users: [],
    books: seedBooks,
    entries: [],
    posts: [],
    follows: [],
    requests: [],
    notes: [],
    notifs: [],
    clubs: [],
    clubMembers: [],
    clubRequests: [],
    clubPosts: [],
    auth: { accounts: {}, emails: {} },
  };
}

async function db(): Promise<Db> {
  const d = await getDb();
  if (!d) throw new Error("Banco de dados não configurado");
  return d;
}

async function read(d: Db): Promise<{ world: World; version: number }> {
  await d.query(`insert into vivlio_world (id, version, data) values (1, 0, $1::jsonb) on conflict (id) do nothing`, [JSON.stringify(emptyWorld())]);
  const [row] = await d.query<{ version: number; data: World | string }>(`select version, data from vivlio_world where id = 1`);
  const world = typeof row.data === "string" ? (JSON.parse(row.data) as World) : row.data;
  return { world, version: row.version };
}

export async function loadWorld(): Promise<World> {
  return (await read(await db())).world;
}

/** Lê, aplica `fn` e grava — repetindo se outra pessoa gravou no meio do caminho. */
export async function mutate<T>(fn: (w: World) => { world: World; result: T }): Promise<{ world: World; result: T }> {
  const d = await db();
  for (let attempt = 0; attempt < 6; attempt++) {
    const { world, version } = await read(d);
    const out = fn(world);
    if (out.world === world) return out;
    const rows = await d.query(`update vivlio_world set data = $1::jsonb, version = version + 1, updated_at = now() where id = 1 and version = $2 returning version`, [
      JSON.stringify(out.world),
      version,
    ]);
    if (rows.length) return out;
  }
  throw new Error("Muita gente mexendo ao mesmo tempo. Tente de novo.");
}

/* ---------- Contas ---------- */

const slug = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9._]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 24) || "leitor";

export interface Identity {
  key: string; // provedor:id
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

/** Encontra (ou cria, no primeiro login) o leitor ligado a uma conta Google/Facebook. */
export async function ensureUser(who: Identity): Promise<string> {
  const { result } = await mutate((w) => {
    const known = w.auth.accounts[who.key];
    if (known && w.users.some((u) => u.id === known)) return { world: w, result: known };
    const email = who.email?.toLowerCase() ?? "";
    // Mesmo e-mail em outro provedor (ex.: Gmail e Facebook) = mesma pessoa.
    const byEmail = email ? Object.entries(w.auth.emails).find(([, e]) => e === email)?.[0] : undefined;
    if (byEmail) {
      return { world: { ...w, auth: { ...w.auth, accounts: { ...w.auth.accounts, [who.key]: byEmail } } }, result: byEmail };
    }
    const base = slug(email ? email.split("@")[0] : who.name ?? "leitor");
    let username = base.length >= 3 ? base : `${base}.leitor`;
    for (let i = 2; w.users.some((u) => u.username === username); i++) username = `${base}${i}`;
    const id = "u" + randomBytes(8).toString("hex");
    const user: User = {
      id,
      username,
      name: (who.name || username).slice(0, 60),
      bio: "",
      avatar: who.image && /^https:\/\//.test(who.image) ? who.image : undefined,
      isPrivate: false,
      joinedAt: nowIso(),
    };
    return {
      world: {
        ...w,
        users: [...w.users, user],
        auth: { accounts: { ...w.auth.accounts, [who.key]: id }, emails: email ? { ...w.auth.emails, [id]: email } : w.auth.emails },
      },
      result: id,
    };
  });
  return result;
}

/* ---------- O que cada pessoa pode ver ---------- */

export function projectFor(w: World, viewerId: string): State {
  const s: State = { ...w, meId: viewerId };
  const viewer = viewerId;
  const canSee = (userId: string) => {
    const u = w.users.find((x) => x.id === userId);
    return !!u && canSeePosts(s, viewer, u);
  };
  const myClubs = new Set(w.clubs.filter((c) => memberOf(s, c.id, viewer)).map((c) => c.id));
  return {
    version: w.version,
    meId: viewer,
    users: w.users.map((u) => ({ ...u, stats: { followers: followersOf(s, u.id).length, following: followingOf(s, u.id).length } })),
    books: w.books,
    // Estante pública; anotações "só minhas" ficam com a dona/o dono.
    entries: w.entries.map((e) => (e.userId === viewer ? e : { ...e, notes: e.notes.filter((n) => !n.isPrivate) })),
    posts: w.posts.filter((p) => canSee(p.authorId)),
    // Listas de seguidores de contas privadas só para quem foi aprovado.
    follows: w.follows.filter((f) => f.from === viewer || f.to === viewer || canSee(f.to) || canSee(f.from)),
    requests: w.requests.filter((r) => r.from === viewer || r.to === viewer),
    notes: w.notes.filter((n) => n.from === viewer || n.to === viewer),
    notifs: w.notifs.filter((n) => n.to === viewer).slice(0, 200),
    clubs: w.clubs,
    clubMembers: w.clubMembers,
    clubRequests: w.clubRequests.filter((r) => r.userId === viewer || canModerate(s, r.clubId, viewer)),
    clubPosts: w.clubPosts.filter((p) => myClubs.has(p.clubId)),
  };
}

/* ---------- Imagens ---------- */

const IMAGE_RE = /^data:(image\/(?:png|jpeg|webp|gif));base64,([A-Za-z0-9+/=]+)$/;
const MAX_IMAGE_B64 = 2_200_000; // ~1,6 MB

/** Troca cada imagem enviada (data URL) por um endereço /api/media/… guardado no banco. */
async function storeImages(value: unknown, owner: string, d: Db): Promise<unknown> {
  if (typeof value === "string" && value.startsWith("data:")) {
    const m = IMAGE_RE.exec(value);
    if (!m) throw new Error("Formato de imagem não aceito. Use JPG, PNG, WEBP ou GIF.");
    if (m[2].length > MAX_IMAGE_B64) throw new Error("Imagem grande demais.");
    const id = randomBytes(12).toString("hex");
    await d.query(`insert into vivlio_media (id, owner, mime, data) values ($1, $2, $3, $4)`, [id, owner, m[1], m[2]]);
    return `/api/media/${id}`;
  }
  if (Array.isArray(value)) return Promise.all(value.map((v) => storeImages(v, owner, d)));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = await storeImages(v, owner, d);
    return out;
  }
  return value;
}

export async function getMedia(id: string): Promise<{ mime: string; data: Buffer } | null> {
  if (!/^[a-z0-9]{8,64}$/.test(id)) return null;
  const [row] = await (await db()).query<{ mime: string; data: string }>(`select mime, data from vivlio_media where id = $1`, [id]);
  return row ? { mime: row.mime, data: Buffer.from(row.data, "base64") } : null;
}

/* ---------- Ações ---------- */

export async function applyAction(viewerId: string, name: OpName, rawArgs: unknown): Promise<{ error?: string; value?: string; state: State }> {
  const d = await db();
  const withImages = await storeImages(rawArgs, viewerId, d);
  const args = cleanArgs(name, withImages);
  const { world, result } = await mutate((w) => {
    if (!w.users.some((u) => u.id === viewerId)) return { world: w, result: { error: "Conta não encontrada. Entre de novo." } as { error?: string; value?: string } };
    const out = runOp({ ...w, meId: viewerId }, name, args as never);
    if (out.error) return { world: w, result: { error: out.error } };
    // Guarda só o necessário: notificações antigas são cortadas.
    const next: World = { ...(out.state as World), meId: "", auth: w.auth, notifs: out.state.notifs.slice(0, 5000) };
    return { world: next, result: { value: out.value } };
  });
  return { ...result, state: projectFor(world, viewerId) };
}
