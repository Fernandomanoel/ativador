import type { Entry, State, User } from "./types";

export const userById = (s: State, id: string) => s.users.find((u) => u.id === id);
export const userByUsername = (s: State, username: string) =>
  s.users.find((u) => u.username.toLowerCase() === decodeURIComponent(username).toLowerCase());
export const bookById = (s: State, id?: string) => (id ? s.books.find((b) => b.id === id) : undefined);

export const isFollowing = (s: State, from: string, to: string) => s.follows.some((f) => f.from === from && f.to === to);
export const hasRequested = (s: State, from: string, to: string) => s.requests.some((r) => r.from === from && r.to === to);
export const noteBetween = (s: State, from: string, to: string) => s.notes.find((n) => n.from === from && n.to === to);

export const followersOf = (s: State, id: string) => s.follows.filter((f) => f.to === id).map((f) => f.from);
export const followingOf = (s: State, id: string) => s.follows.filter((f) => f.from === id).map((f) => f.to);

/**
 * Regra de privacidade do Vivlío:
 * - a estante (livros, avaliações, resenhas e anotações) é SEMPRE pública;
 * - publicações e listas de seguidores de contas privadas só aparecem
 *   para quem foi aprovado como seguidor.
 */
export const canSeePosts = (s: State, viewerId: string, user: User) =>
  user.id === viewerId || !user.isPrivate || isFollowing(s, viewerId, user.id);

export const visiblePosts = (s: State, viewerId: string) =>
  s.posts.filter((p) => {
    const author = userById(s, p.authorId);
    return author ? canSeePosts(s, viewerId, author) : false;
  });

export const entriesOf = (s: State, userId: string) =>
  s.entries.filter((e) => e.userId === userId).sort((a, b) => a.position - b.position);

export const entryFor = (s: State, userId: string, bookId: string) =>
  s.entries.find((e) => e.userId === userId && e.bookId === bookId);

export const reviewsOfBook = (s: State, bookId: string) =>
  s.entries.filter((e) => e.bookId === bookId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

export function avgRating(entries: Entry[]) {
  const rated = entries.filter((e) => e.rating);
  if (!rated.length) return undefined;
  return rated.reduce((acc, e) => acc + (e.rating ?? 0), 0) / rated.length;
}

export const unreadCount = (s: State) => s.notifs.filter((n) => n.to === s.meId && !n.read).length;
export const incomingRequests = (s: State) => s.requests.filter((r) => r.to === s.meId);

/* ---------- Leituras em andamento ---------- */

/** Notas privadas só aparecem para quem é dono da estante. */
export const visibleNotes = (e: Entry, viewerId: string) => (e.userId === viewerId ? e.notes : e.notes.filter((n) => !n.isPrivate));

export const readingNow = (s: State, userId: string) =>
  s.entries.filter((e) => e.userId === userId && e.status === "lendo").sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

export function progressPct(s: State, e: Entry) {
  const pages = bookById(s, e.bookId)?.pages;
  if (!pages || !e.progress) return 0;
  return Math.min(100, Math.round((e.progress / pages) * 100));
}

/** Até que página a pessoa já leu (para esconder spoilers). Lido = tudo. */
export function pagesRead(s: State, userId: string, bookId: string) {
  const e = entryFor(s, userId, bookId);
  if (!e) return 0;
  if (e.status === "lido") return Infinity;
  return e.progress ?? 0;
}

/* ---------- Clubes ---------- */

export const clubById = (s: State, id: string) => s.clubs.find((c) => c.id === id);
export const clubMembersOf = (s: State, clubId: string) => s.clubMembers.filter((m) => m.clubId === clubId);
export const memberOf = (s: State, clubId: string, userId: string) => s.clubMembers.find((m) => m.clubId === clubId && m.userId === userId);
export const canModerate = (s: State, clubId: string, userId: string) => {
  const role = memberOf(s, clubId, userId)?.role;
  return role === "dono" || role === "moderador";
};
export const clubIsFull = (s: State, clubId: string) => {
  const c = clubById(s, clubId);
  return !!c && clubMembersOf(s, clubId).length >= c.maxMembers;
};
export const hasClubRequest = (s: State, clubId: string, userId: string) => s.clubRequests.some((r) => r.clubId === clubId && r.userId === userId);
export const myClubs = (s: State) => s.clubs.filter((c) => memberOf(s, c.id, s.meId));
export const pendingClubRequestsForMe = (s: State) => s.clubRequests.filter((r) => canModerate(s, r.clubId, s.meId));
