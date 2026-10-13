// Regras do Vivlío como funções puras: (estado, ...argumentos) → novo estado.
// O mesmo código roda no navegador (modo demonstração e resposta imediata)
// e no servidor, que é quem decide de verdade quando há contas reais.
// `s.meId` é sempre quem está fazendo a ação.

import { CLUB_MAX, NOTE_MAX } from "./constants";
import {
  canModerate,
  canSeePosts,
  clubById,
  clubIsFull,
  hasClubRequest,
  hasRequested,
  isFollowing,
  memberOf,
  noteBetween,
  userById,
} from "./selectors";
import type { Annotation, Book, Club, ClubPost, ClubRole, Entry, Notif, NotifType, Post, State, User } from "./types";
import { nowIso, uid } from "./util";

export type EntryInput = Omit<Entry, "id" | "userId" | "position" | "createdAt" | "updatedAt" | "notes" | "likes" | "comments">;
export type ClubInput = Omit<Club, "id" | "ownerId" | "createdAt">;
export type ClubPostInput = Pick<ClubPost, "clubId" | "area" | "title" | "body" | "image" | "bookId" | "page" | "rating" | "spoiler">;
export type PostInput = Pick<Post, "image" | "caption" | "bookId">;
export type ProfilePatch = Partial<Pick<User, "name" | "username" | "bio" | "avatar" | "cover" | "isPrivate">>;

/** Resultado de uma ação: o novo estado, um erro para mostrar, ou um id criado. */
export interface Out {
  state: State;
  error?: string;
  value?: string;
}

const ok = (state: State, value?: string): Out => ({ state, value });
const fail = (state: State, error: string): Out => ({ state, error });

function notif(s: State, to: string, type: NotifType, extra: Partial<Notif> = {}): Notif[] {
  if (to === s.meId) return s.notifs;
  return [{ id: uid(), to, actor: s.meId, type, createdAt: nowIso(), read: false, ...extra }, ...s.notifs];
}

/** Ids vindos do cliente: aceita só um formato curto e que ainda não exista. */
const freshId = (prefix: string, wanted: string | undefined, taken: (id: string) => boolean) =>
  wanted && /^[a-z]{1,3}[a-z0-9]{6,24}$/.test(wanted) && !taken(wanted) ? wanted : prefix + uid();

export const ops = {
  follow(s: State, targetId: string, noteBody?: string): Out {
    const target = userById(s, targetId);
    if (!target || targetId === s.meId) return fail(s, "Leitor não encontrado.");
    if (isFollowing(s, s.meId, targetId) || hasRequested(s, s.meId, targetId)) return ok(s);
    if (!target.isPrivate) {
      return ok({ ...s, follows: [...s.follows, { from: s.meId, to: targetId, createdAt: nowIso() }], notifs: notif(s, targetId, "follow") });
    }
    let next: State = {
      ...s,
      requests: [...s.requests, { from: s.meId, to: targetId, createdAt: nowIso() }],
      notifs: notif(s, targetId, "follow_request"),
    };
    const body = noteBody?.trim().slice(0, NOTE_MAX);
    if (body && !noteBetween(s, s.meId, targetId)) {
      next = {
        ...next,
        notes: [...next.notes, { id: uid(), from: s.meId, to: targetId, body, createdAt: nowIso() }],
        notifs: notif(next, targetId, "note"),
      };
    }
    return ok(next);
  },

  unfollow: (s: State, targetId: string): Out => ok({ ...s, follows: s.follows.filter((f) => !(f.from === s.meId && f.to === targetId)) }),

  cancelRequest: (s: State, targetId: string): Out => ok({ ...s, requests: s.requests.filter((r) => !(r.from === s.meId && r.to === targetId)) }),

  acceptRequest(s: State, fromId: string): Out {
    if (!hasRequested(s, fromId, s.meId)) return ok(s);
    return ok({
      ...s,
      requests: s.requests.filter((r) => !(r.from === fromId && r.to === s.meId)),
      follows: [...s.follows, { from: fromId, to: s.meId, createdAt: nowIso() }],
      notifs: notif(s, fromId, "follow_accepted").map((n) => (n.type === "follow_request" && n.actor === fromId && n.to === s.meId ? { ...n, read: true } : n)),
    });
  },

  rejectRequest: (s: State, fromId: string): Out => ok({ ...s, requests: s.requests.filter((r) => !(r.from === fromId && r.to === s.meId)) }),

  removeFollower: (s: State, userId: string): Out => ok({ ...s, follows: s.follows.filter((f) => !(f.from === userId && f.to === s.meId)) }),

  sendNote(s: State, toId: string, body: string): Out {
    const target = userById(s, toId);
    const text = body.trim();
    if (!target) return fail(s, "Leitor não encontrado.");
    if (!target.isPrivate) return fail(s, "Bilhetes são para contas privadas.");
    if (isFollowing(s, s.meId, toId)) return fail(s, "Você já segue esta pessoa.");
    if (noteBetween(s, s.meId, toId)) return fail(s, "Você já enviou o seu bilhete para esta pessoa.");
    if (!text) return fail(s, "Escreva alguma coisa.");
    if (text.length > NOTE_MAX) return fail(s, `Máximo de ${NOTE_MAX} caracteres.`);
    return ok({ ...s, notes: [...s.notes, { id: uid(), from: s.meId, to: toId, body: text, createdAt: nowIso() }], notifs: notif(s, toId, "note") });
  },

  replyNote(s: State, noteId: string, body: string): Out {
    const note = s.notes.find((n) => n.id === noteId);
    const text = body.trim();
    if (!note || note.to !== s.meId) return fail(s, "Bilhete não encontrado.");
    if (note.reply) return fail(s, "Você já respondeu este bilhete.");
    if (!text) return fail(s, "Escreva alguma coisa.");
    if (text.length > NOTE_MAX) return fail(s, `Máximo de ${NOTE_MAX} caracteres.`);
    return ok({
      ...s,
      notes: s.notes.map((n) => (n.id === noteId ? { ...n, reply: text, repliedAt: nowIso() } : n)),
      notifs: notif(s, note.from, "note_reply"),
    });
  },

  togglePostLike(s: State, postId: string): Out {
    const post = s.posts.find((p) => p.id === postId);
    const author = post && userById(s, post.authorId);
    if (!post || !author || !canSeePosts(s, s.meId, author)) return fail(s, "Publicação não encontrada.");
    const liked = post.likes.includes(s.meId);
    return ok({
      ...s,
      posts: s.posts.map((p) => (p.id === postId ? { ...p, likes: liked ? p.likes.filter((x) => x !== s.meId) : [...p.likes, s.meId] } : p)),
      notifs: liked ? s.notifs : notif(s, post.authorId, "like_post", { postId }),
    });
  },

  addPostComment(s: State, postId: string, body: string): Out {
    const text = body.trim();
    const post = s.posts.find((p) => p.id === postId);
    const author = post && userById(s, post.authorId);
    if (!text) return ok(s);
    if (!post || !author || !canSeePosts(s, s.meId, author)) return fail(s, "Publicação não encontrada.");
    return ok({
      ...s,
      posts: s.posts.map((p) => (p.id === postId ? { ...p, comments: [...p.comments, { id: uid(), authorId: s.meId, body: text, createdAt: nowIso() }] } : p)),
      notifs: notif(s, post.authorId, "comment_post", { postId }),
    });
  },

  toggleReviewLike(s: State, entryId: string): Out {
    const entry = s.entries.find((e) => e.id === entryId);
    if (!entry) return ok(s);
    const liked = entry.likes.includes(s.meId);
    return ok({
      ...s,
      entries: s.entries.map((e) => (e.id === entryId ? { ...e, likes: liked ? e.likes.filter((x) => x !== s.meId) : [...e.likes, s.meId] } : e)),
      notifs: liked ? s.notifs : notif(s, entry.userId, "like_review", { entryId }),
    });
  },

  addReviewComment(s: State, entryId: string, body: string): Out {
    const text = body.trim();
    const entry = s.entries.find((e) => e.id === entryId);
    if (!text || !entry) return ok(s);
    return ok({
      ...s,
      entries: s.entries.map((e) => (e.id === entryId ? { ...e, comments: [...e.comments, { id: uid(), authorId: s.meId, body: text, createdAt: nowIso() }] } : e)),
      notifs: notif(s, entry.userId, "comment_review", { entryId }),
    });
  },

  addBook(s: State, book: Omit<Book, "id">, wantedId?: string): Out {
    const id = freshId("bk", wantedId, (x) => s.books.some((b) => b.id === x));
    return ok({ ...s, books: [...s.books, { ...book, id }] }, id);
  },

  addEntry(s: State, input: EntryInput, wantedId?: string): Out {
    if (!s.books.some((b) => b.id === input.bookId)) return fail(s, "Livro não encontrado.");
    const existing = s.entries.find((e) => e.userId === s.meId && e.bookId === input.bookId);
    if (existing) {
      return ok({ ...s, entries: s.entries.map((e) => (e.id === existing.id ? { ...e, ...input, updatedAt: nowIso() } : e)) }, existing.id);
    }
    const id = freshId("e", wantedId, (x) => s.entries.some((e) => e.id === x));
    // Livros novos entram no começo da estante.
    const minPos = s.entries.filter((e) => e.userId === s.meId).reduce((m, e) => Math.min(m, e.position), 1);
    const t = nowIso();
    return ok({ ...s, entries: [...s.entries, { ...input, id, userId: s.meId, position: minPos - 1, createdAt: t, updatedAt: t, notes: [], likes: [], comments: [] }] }, id);
  },

  updateEntry: (s: State, id: string, patch: Partial<EntryInput>): Out =>
    ok({ ...s, entries: s.entries.map((e) => (e.id === id && e.userId === s.meId ? { ...e, ...patch, bookId: e.bookId, updatedAt: nowIso() } : e)) }),

  removeEntry: (s: State, id: string): Out => ok({ ...s, entries: s.entries.filter((e) => !(e.id === id && e.userId === s.meId)) }),

  reorder(s: State, orderedIds: string[]): Out {
    const pos = new Map(orderedIds.map((id, i) => [id, i + 1]));
    return ok({ ...s, entries: s.entries.map((e) => (e.userId === s.meId && pos.has(e.id) ? { ...e, position: pos.get(e.id)! } : e)) });
  },

  addAnnotation: (s: State, entryId: string, a: Omit<Annotation, "id" | "createdAt">): Out =>
    ok({
      ...s,
      entries: s.entries.map((e) =>
        e.id === entryId && e.userId === s.meId
          ? { ...e, notes: [...e.notes, { ...a, id: uid(), createdAt: nowIso() }].sort((x, y) => (x.page ?? 1e9) - (y.page ?? 1e9)) }
          : e,
      ),
    }),

  removeAnnotation: (s: State, entryId: string, annotationId: string): Out =>
    ok({ ...s, entries: s.entries.map((e) => (e.id === entryId && e.userId === s.meId ? { ...e, notes: e.notes.filter((n) => n.id !== annotationId) } : e)) }),

  toggleAnnotationPrivacy: (s: State, entryId: string, annotationId: string): Out =>
    ok({
      ...s,
      entries: s.entries.map((e) =>
        e.id === entryId && e.userId === s.meId ? { ...e, notes: e.notes.map((n) => (n.id === annotationId ? { ...n, isPrivate: !n.isPrivate } : n)) } : e,
      ),
    }),

  updateProgress: (s: State, entryId: string, page: number): Out =>
    ok({
      ...s,
      entries: s.entries.map((e) => {
        if (e.id !== entryId || e.userId !== s.meId) return e;
        const pages = s.books.find((b) => b.id === e.bookId)?.pages;
        return { ...e, progress: Math.max(0, Math.round(pages ? Math.min(page, pages) : page)), updatedAt: nowIso() };
      }),
    }),

  createClub(s: State, input: ClubInput, wantedId?: string): Out {
    if (!input.name.trim()) return fail(s, "Dê um nome ao clube.");
    if (!input.areas.length) return fail(s, "Ative pelo menos uma área.");
    const id = freshId("c", wantedId, (x) => s.clubs.some((c) => c.id === x));
    return ok(
      {
        ...s,
        clubs: [...s.clubs, { ...input, maxMembers: Math.min(CLUB_MAX, Math.max(2, input.maxMembers)), id, ownerId: s.meId, createdAt: nowIso() }],
        clubMembers: [...s.clubMembers, { clubId: id, userId: s.meId, role: "dono", joinedAt: nowIso() }],
      },
      id,
    );
  },

  updateClub(s: State, clubId: string, patch: Partial<ClubInput>): Out {
    if (!canModerate(s, clubId, s.meId)) return fail(s, "Só a moderação pode alterar o clube.");
    const count = s.clubMembers.filter((m) => m.clubId === clubId).length;
    if (patch.maxMembers !== undefined) {
      if (patch.maxMembers > CLUB_MAX) return fail(s, `O limite máximo é ${CLUB_MAX} membros.`);
      if (patch.maxMembers < count) return fail(s, `O clube já tem ${count} membros; o limite não pode ser menor.`);
    }
    if (patch.areas && patch.areas.length === 0) return fail(s, "Deixe pelo menos uma área ativa.");
    return ok({ ...s, clubs: s.clubs.map((c) => (c.id === clubId ? { ...c, ...patch } : c)) });
  },

  deleteClub(s: State, clubId: string): Out {
    if (clubById(s, clubId)?.ownerId !== s.meId) return fail(s, "Só quem criou o clube pode apagá-lo.");
    return ok({
      ...s,
      clubs: s.clubs.filter((c) => c.id !== clubId),
      clubMembers: s.clubMembers.filter((m) => m.clubId !== clubId),
      clubRequests: s.clubRequests.filter((r) => r.clubId !== clubId),
      clubPosts: s.clubPosts.filter((p) => p.clubId !== clubId),
    });
  },

  joinClub(s: State, clubId: string): Out {
    const club = clubById(s, clubId);
    if (!club) return fail(s, "Clube não encontrado.");
    if (memberOf(s, clubId, s.meId)) return fail(s, "Você já participa deste clube.");
    if (clubIsFull(s, clubId)) return fail(s, `Clube cheio (${club.maxMembers}/${club.maxMembers}).`);
    if (club.access === "aberto") {
      return ok({ ...s, clubMembers: [...s.clubMembers, { clubId, userId: s.meId, role: "membro", joinedAt: nowIso() }] });
    }
    if (hasClubRequest(s, clubId, s.meId)) return fail(s, "Pedido já enviado.");
    return ok({
      ...s,
      clubRequests: [...s.clubRequests, { clubId, userId: s.meId, createdAt: nowIso() }],
      notifs: notif(s, club.ownerId, "club_request", { clubId }),
    });
  },

  cancelClubRequest: (s: State, clubId: string): Out => ok({ ...s, clubRequests: s.clubRequests.filter((r) => !(r.clubId === clubId && r.userId === s.meId)) }),

  leaveClub(s: State, clubId: string): Out {
    if (clubById(s, clubId)?.ownerId === s.meId) return fail(s, "Quem criou o clube não pode sair — apague o clube nas configurações.");
    return ok({ ...s, clubMembers: s.clubMembers.filter((m) => !(m.clubId === clubId && m.userId === s.meId)) });
  },

  approveClubRequest(s: State, clubId: string, userId: string): Out {
    if (!canModerate(s, clubId, s.meId)) return fail(s, "Só a moderação aprova pedidos.");
    if (!hasClubRequest(s, clubId, userId)) return fail(s, "Pedido não encontrado.");
    if (clubIsFull(s, clubId)) return fail(s, "O clube está cheio. Aumente o limite (até 50) ou libere vagas.");
    return ok({
      ...s,
      clubRequests: s.clubRequests.filter((r) => !(r.clubId === clubId && r.userId === userId)),
      clubMembers: [...s.clubMembers, { clubId, userId, role: "membro", joinedAt: nowIso() }],
      notifs: notif(s, userId, "club_accepted", { clubId }).map((n) => (n.type === "club_request" && n.clubId === clubId && n.actor === userId ? { ...n, read: true } : n)),
    });
  },

  rejectClubRequest: (s: State, clubId: string, userId: string): Out =>
    canModerate(s, clubId, s.meId) ? ok({ ...s, clubRequests: s.clubRequests.filter((r) => !(r.clubId === clubId && r.userId === userId)) }) : ok(s),

  removeClubMember(s: State, clubId: string, userId: string): Out {
    const club = clubById(s, clubId);
    if (!club || userId === club.ownerId || !canModerate(s, clubId, s.meId)) return ok(s);
    return ok({ ...s, clubMembers: s.clubMembers.filter((m) => !(m.clubId === clubId && m.userId === userId)) });
  },

  setClubRole(s: State, clubId: string, userId: string, role: Exclude<ClubRole, "dono">): Out {
    if (clubById(s, clubId)?.ownerId !== s.meId) return ok(s);
    return ok({ ...s, clubMembers: s.clubMembers.map((m) => (m.clubId === clubId && m.userId === userId && m.role !== "dono" ? { ...m, role } : m)) });
  },

  createClubPost(s: State, input: ClubPostInput, wantedId?: string): Out {
    const club = clubById(s, input.clubId);
    if (!club || !memberOf(s, input.clubId, s.meId)) return fail(s, "Só membros podem publicar.");
    if (!club.areas.includes(input.area)) return fail(s, "Esta área está desativada.");
    if (!input.body.trim() && !input.image) return fail(s, "Escreva alguma coisa.");
    if (input.area === "galeria" && !input.image) return fail(s, "A galeria precisa de uma imagem.");
    const id = freshId("cp", wantedId, (x) => s.clubPosts.some((p) => p.id === x));
    const spoiler = club.spoilerPolicy === "marcados" ? input.spoiler : false;
    return ok(
      {
        ...s,
        clubPosts: [{ ...input, spoiler, title: input.title.trim(), body: input.body.trim(), id, authorId: s.meId, createdAt: nowIso(), likes: [], replies: [] }, ...s.clubPosts],
      },
      id,
    );
  },

  deleteClubPost(s: State, postId: string): Out {
    const p = s.clubPosts.find((x) => x.id === postId);
    if (!p || (p.authorId !== s.meId && !canModerate(s, p.clubId, s.meId))) return ok(s);
    return ok({ ...s, clubPosts: s.clubPosts.filter((x) => x.id !== postId) });
  },

  toggleClubPostLike(s: State, postId: string): Out {
    const post = s.clubPosts.find((p) => p.id === postId);
    if (!post || !memberOf(s, post.clubId, s.meId)) return ok(s);
    const liked = post.likes.includes(s.meId);
    return ok({ ...s, clubPosts: s.clubPosts.map((p) => (p.id === postId ? { ...p, likes: liked ? p.likes.filter((x) => x !== s.meId) : [...p.likes, s.meId] } : p)) });
  },

  toggleClubPostPin: (s: State, postId: string): Out =>
    ok({ ...s, clubPosts: s.clubPosts.map((p) => (p.id === postId && canModerate(s, p.clubId, s.meId) ? { ...p, pinned: !p.pinned } : p)) }),

  toggleClubPostResolved: (s: State, postId: string): Out =>
    ok({
      ...s,
      clubPosts: s.clubPosts.map((p) => (p.id === postId && (p.authorId === s.meId || canModerate(s, p.clubId, s.meId)) ? { ...p, resolved: !p.resolved } : p)),
    }),

  replyClubPost(s: State, postId: string, body: string): Out {
    const text = body.trim();
    const post = s.clubPosts.find((p) => p.id === postId);
    if (!text || !post || !memberOf(s, post.clubId, s.meId)) return ok(s);
    return ok({
      ...s,
      clubPosts: s.clubPosts.map((p) => (p.id === postId ? { ...p, replies: [...p.replies, { id: uid(), authorId: s.meId, body: text, createdAt: nowIso() }] } : p)),
      notifs: notif(s, post.authorId, "club_reply", { clubId: post.clubId }),
    });
  },

  createPost(s: State, p: PostInput, wantedId?: string): Out {
    if (!p.image) return fail(s, "Escolha uma foto primeiro.");
    const id = freshId("p", wantedId, (x) => s.posts.some((q) => q.id === x));
    return ok({ ...s, posts: [{ ...p, id, authorId: s.meId, createdAt: nowIso(), likes: [], comments: [] }, ...s.posts] }, id);
  },

  deletePost: (s: State, postId: string): Out => ok({ ...s, posts: s.posts.filter((p) => !(p.id === postId && p.authorId === s.meId)) }),

  updateProfile(s: State, patch: ProfilePatch): Out {
    if (patch.username !== undefined) {
      const u = patch.username.trim().toLowerCase();
      if (!/^[a-z0-9._]{3,30}$/.test(u)) return fail(s, "Use de 3 a 30 caracteres: letras, números, ponto ou _.");
      if (s.users.some((x) => x.id !== s.meId && x.username === u)) return fail(s, "Este nome de usuário já existe.");
      patch = { ...patch, username: u };
    }
    let next: State = { ...s, users: s.users.map((u) => (u.id === s.meId ? { ...u, ...patch } : u)) };
    // Ao tornar a conta pública, pedidos pendentes viram seguidores (como no Instagram).
    if (patch.isPrivate === false) {
      const pending = s.requests.filter((r) => r.to === s.meId);
      next = {
        ...next,
        requests: s.requests.filter((r) => r.to !== s.meId),
        follows: [...s.follows, ...pending.map((r) => ({ from: r.from, to: s.meId, createdAt: nowIso() }))],
      };
    }
    return ok(next);
  },

  markAllRead: (s: State): Out => ok({ ...s, notifs: s.notifs.map((n) => (n.to === s.meId ? { ...n, read: true } : n)) }),
};

export type OpName = keyof typeof ops;
type Tail<F> = F extends (s: State, ...args: infer A) => Out ? A : never;
export type OpArgs<N extends OpName> = Tail<(typeof ops)[N]>;

export function runOp<N extends OpName>(s: State, name: N, args: OpArgs<N>): Out {
  const fn = ops[name] as (s: State, ...a: unknown[]) => Out;
  return fn(s, ...(args as unknown[]));
}
