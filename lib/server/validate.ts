import "server-only";

import { CLUB_AREAS, CLUB_FOCUS, CLUB_MAX, FORMATS, LABELS, STATUSES } from "../constants";
import type { OpName } from "../logic";

// Tudo o que chega do navegador é tratado como não confiável: cada ação tem a
// lista exata de argumentos aceitos, com tipos, tamanhos e valores permitidos.

export class BadInput extends Error {}

type V = (v: unknown) => unknown;

const str =
  (max: number): V =>
  (v) =>
    typeof v === "string" ? v.slice(0, max) : "";
const optStr =
  (max: number): V =>
  (v) =>
    typeof v === "string" && v.trim() ? v.slice(0, max) : undefined;
const id: V = (v) => {
  if (typeof v !== "string" || !/^[A-Za-z0-9_:.-]{1,64}$/.test(v)) throw new BadInput("id inválido");
  return v;
};
const optId: V = (v) => (v === undefined || v === null || v === "" ? undefined : id(v));
const int =
  (min: number, max: number): V =>
  (v) => {
    const n = typeof v === "number" ? v : Number(v);
    if (!Number.isFinite(n)) throw new BadInput("número inválido");
    return Math.min(max, Math.max(min, Math.round(n)));
  };
const optInt =
  (min: number, max: number): V =>
  (v) =>
    v === undefined || v === null || v === "" ? undefined : int(min, max)(v);
const bool: V = (v) => v === true;
const oneOf =
  <T extends string>(allowed: readonly T[]): V =>
  (v) => {
    if (typeof v !== "string" || !allowed.includes(v as T)) throw new BadInput("valor inválido");
    return v;
  };
const listOf =
  (item: V, max: number): V =>
  (v) =>
    Array.isArray(v) ? v.slice(0, max).map(item) : [];
const isoDate: V = (v) => (typeof v === "string" && !Number.isNaN(Date.parse(v)) ? new Date(v).toISOString() : undefined);
/** Imagens: só as que este servidor guardou (/api/media/…) ou endereços https. */
const optImage: V = (v) => {
  if (v === undefined || v === null || v === "") return undefined;
  if (typeof v === "string" && (/^\/api\/media\/[a-z0-9]{8,64}$/.test(v) || (/^https:\/\/[^\s"'<>]+$/.test(v) && v.length <= 1000))) return v;
  throw new BadInput("imagem inválida");
};

function obj(shape: Record<string, V>, partial = false): V {
  return (v) => {
    if (!v || typeof v !== "object" || Array.isArray(v)) throw new BadInput("objeto inválido");
    const src = v as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [k, fn] of Object.entries(shape)) {
      if (partial && !(k in src)) continue;
      const val = fn(src[k]);
      // Num patch, null em campo opcional significa "apagar" (ex.: tirar a nota ou a capa).
      if (val !== undefined || (partial && src[k] === null)) out[k] = val;
    }
    return out;
  };
}

const labels = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && LABELS.includes(x)) : []);

const entryShape = {
  bookId: id,
  status: oneOf(STATUSES.map((s) => s.id)),
  format: oneOf(FORMATS.map((f) => f.id)),
  labels,
  rating: optInt(1, 10),
  progress: optInt(0, 100000),
  review: str(5000),
  favorite: bool,
  spoiler: bool,
  finishedAt: isoDate,
};
const { bookId: _b, ...entryPatchShape } = entryShape;

const clubShape = {
  name: str(60),
  description: str(300),
  rules: str(1000),
  focus: oneOf(CLUB_FOCUS.map((f) => f.id)),
  access: oneOf(["aberto", "aprovacao"] as const),
  spoilerPolicy: oneOf(["sem-spoiler", "marcados", "liberado"] as const),
  maxMembers: int(2, CLUB_MAX),
  areas: (v: unknown) => [...new Set(listOf(oneOf(CLUB_AREAS.map((a) => a.id)), 10)(v) as string[])],
  bookId: optId,
  cover: optImage,
  tone: int(0, 20),
};

const ARGS: Record<OpName, V[]> = {
  follow: [id, optStr(280)],
  unfollow: [id],
  cancelRequest: [id],
  acceptRequest: [id],
  rejectRequest: [id],
  removeFollower: [id],
  sendNote: [id, str(1000)],
  replyNote: [id, str(1000)],
  togglePostLike: [id],
  addPostComment: [id, str(1000)],
  toggleReviewLike: [id],
  addReviewComment: [id, str(1000)],
  addBook: [obj({ title: str(200), author: str(200), year: optInt(-3000, 3000), pages: optInt(1, 20000), coverUrl: optImage }), optId],
  addEntry: [obj(entryShape), optId],
  updateEntry: [id, obj(entryPatchShape, true)],
  removeEntry: [id],
  reorder: [listOf(id, 5000)],
  addAnnotation: [id, obj({ page: optInt(1, 100000), quote: str(2000), body: str(4000), isPrivate: bool })],
  removeAnnotation: [id, id],
  toggleAnnotationPrivacy: [id, id],
  updateProgress: [id, int(0, 100000)],
  createClub: [obj(clubShape), optId],
  updateClub: [id, obj(clubShape, true)],
  deleteClub: [id],
  joinClub: [id],
  cancelClubRequest: [id],
  leaveClub: [id],
  approveClubRequest: [id, id],
  rejectClubRequest: [id, id],
  removeClubMember: [id, id],
  setClubRole: [id, id, oneOf(["moderador", "membro"] as const)],
  createClubPost: [
    obj({
      clubId: id,
      area: oneOf(CLUB_AREAS.map((a) => a.id)),
      title: str(120),
      body: str(4000),
      image: optImage,
      bookId: optId,
      page: optInt(1, 100000),
      rating: optInt(1, 10),
      spoiler: bool,
    }),
    optId,
  ],
  deleteClubPost: [id],
  toggleClubPostLike: [id],
  toggleClubPostPin: [id],
  toggleClubPostResolved: [id],
  replyClubPost: [id, str(2000)],
  createPost: [obj({ image: optImage, caption: str(2200), bookId: optId }), optId],
  deletePost: [id],
  updateProfile: [
    obj({ name: str(60), username: str(30), bio: str(150), avatar: optImage, cover: optImage, isPrivate: bool }, true),
  ],
  markAllRead: [],
};

export function isOpName(name: unknown): name is OpName {
  return typeof name === "string" && Object.prototype.hasOwnProperty.call(ARGS, name);
}

export function cleanArgs(name: OpName, args: unknown): unknown[] {
  if (!Array.isArray(args)) throw new BadInput("argumentos inválidos");
  return ARGS[name].map((fn, i) => fn(args[i]));
}
