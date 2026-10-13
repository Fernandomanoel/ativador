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
