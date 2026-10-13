"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { CoinMark } from "@/components/Logo";
import { NOTE_MAX } from "./constants";
import { makeSeed, STATE_VERSION } from "./seed";
import { hasRequested, isFollowing, noteBetween, userById } from "./selectors";
import type { Annotation, Book, Entry, Notif, NotifType, Post, State, User } from "./types";
import { nowIso, uid } from "./util";

const KEY = "vivlio:state";

type EntryInput = Omit<Entry, "id" | "userId" | "position" | "createdAt" | "updatedAt" | "notes" | "likes" | "comments">;

export interface Actions {
  follow(targetId: string, noteBody?: string): void;
  unfollow(targetId: string): void;
  cancelRequest(targetId: string): void;
  acceptRequest(fromId: string): void;
  rejectRequest(fromId: string): void;
  removeFollower(userId: string): void;
  sendNote(toId: string, body: string): string | null;
  replyNote(noteId: string, body: string): string | null;
  togglePostLike(postId: string): void;
  addPostComment(postId: string, body: string): void;
  toggleReviewLike(entryId: string): void;
  addReviewComment(entryId: string, body: string): void;
  addBook(book: Omit<Book, "id">): string;
  addEntry(input: EntryInput): string;
  updateEntry(id: string, patch: Partial<EntryInput>): void;
  removeEntry(id: string): void;
  reorder(orderedIds: string[]): void;
  addAnnotation(entryId: string, a: Omit<Annotation, "id" | "createdAt">): void;
  removeAnnotation(entryId: string, annotationId: string): void;
  createPost(p: Pick<Post, "image" | "caption" | "bookId">): string;
  deletePost(postId: string): void;
  updateProfile(patch: Partial<Pick<User, "name" | "username" | "bio" | "avatar" | "isPrivate">>): string | null;
  markAllRead(): void;
  reset(): void;
  toast(msg: string): void;
}

interface Ctx {
  state: State;
  me: User;
  actions: Actions;
  toasts: { id: string; msg: string }[];
}

const StoreContext = createContext<Ctx | null>(null);

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as State;
      if (parsed.version === STATE_VERSION) return parsed;
    }
  } catch {
    /* armazenamento indisponível: usa os dados de exemplo */
  }
  return makeSeed();
}

function notif(s: State, to: string, type: NotifType, extra: Partial<Notif> = {}): Notif[] {
  if (to === s.meId && extra.actor === s.meId) return s.notifs;
  return [{ id: uid(), to, actor: s.meId, type, createdAt: nowIso(), read: false, ...extra }, ...s.notifs];
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State | null>(null);
  const [toasts, setToasts] = useState<{ id: string; msg: string }[]>([]);
  const saveWarned = useRef(false);
  const stateRef = useRef<State | null>(null);
  stateRef.current = state;

  useEffect(() => {
    setState(load());
  }, []);

  useEffect(() => {
    if (!state) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      if (!saveWarned.current) {
        saveWarned.current = true;
        setToasts((t) => [...t, { id: uid(), msg: "Armazenamento do navegador cheio — algumas fotos podem não ficar salvas." }]);
      }
    }
  }, [state]);

  const toast = useCallback((msg: string) => {
    const id = uid();
    setToasts((t) => [...t, { id, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  const update = useCallback((fn: (s: State) => State) => setState((s) => (s ? fn(s) : s)), []);

  const actions = useMemo<Actions>(() => {
    // Lê o estado mais recente para validar ações que devolvem erro.
    const peek = () => stateRef.current;

    return {
      toast,
      follow(targetId, noteBody) {
        update((s) => {
          const target = userById(s, targetId);
          if (!target || targetId === s.meId) return s;
          if (isFollowing(s, s.meId, targetId) || hasRequested(s, s.meId, targetId)) return s;
          if (!target.isPrivate) {
            return { ...s, follows: [...s.follows, { from: s.meId, to: targetId, createdAt: nowIso() }], notifs: notif(s, targetId, "follow") };
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
          return next;
        });
      },
      unfollow(targetId) {
        update((s) => ({ ...s, follows: s.follows.filter((f) => !(f.from === s.meId && f.to === targetId)) }));
      },
      cancelRequest(targetId) {
        update((s) => ({ ...s, requests: s.requests.filter((r) => !(r.from === s.meId && r.to === targetId)) }));
      },
      acceptRequest(fromId) {
        update((s) => {
          if (!hasRequested(s, fromId, s.meId)) return s;
          return {
            ...s,
            requests: s.requests.filter((r) => !(r.from === fromId && r.to === s.meId)),
            follows: [...s.follows, { from: fromId, to: s.meId, createdAt: nowIso() }],
            notifs: notif(s, fromId, "follow_accepted").map((n) =>
              n.type === "follow_request" && n.actor === fromId && n.to === s.meId ? { ...n, read: true } : n,
            ),
          };
        });
      },
      rejectRequest(fromId) {
        update((s) => ({ ...s, requests: s.requests.filter((r) => !(r.from === fromId && r.to === s.meId)) }));
      },
      removeFollower(userId) {
        update((s) => ({ ...s, follows: s.follows.filter((f) => !(f.from === userId && f.to === s.meId)) }));
      },
      sendNote(toId, body) {
        const s = peek();
        if (!s) return "Carregando…";
        const target = userById(s, toId);
        const text = body.trim();
        if (!target) return "Leitor não encontrado.";
        if (!target.isPrivate) return "Bilhetes são para contas privadas.";
        if (isFollowing(s, s.meId, toId)) return "Você já segue esta pessoa.";
        if (noteBetween(s, s.meId, toId)) return "Você já enviou o seu bilhete para esta pessoa.";
        if (!text) return "Escreva alguma coisa.";
        if (text.length > NOTE_MAX) return `Máximo de ${NOTE_MAX} caracteres.`;
        update((st) => ({
          ...st,
          notes: [...st.notes, { id: uid(), from: st.meId, to: toId, body: text, createdAt: nowIso() }],
          notifs: notif(st, toId, "note"),
        }));
        return null;
      },
      replyNote(noteId, body) {
        const s = peek();
        if (!s) return "Carregando…";
        const note = s.notes.find((n) => n.id === noteId);
        const text = body.trim();
        if (!note || note.to !== s.meId) return "Bilhete não encontrado.";
        if (note.reply) return "Você já respondeu este bilhete.";
        if (!text) return "Escreva alguma coisa.";
        if (text.length > NOTE_MAX) return `Máximo de ${NOTE_MAX} caracteres.`;
        update((st) => ({
          ...st,
          notes: st.notes.map((n) => (n.id === noteId ? { ...n, reply: text, repliedAt: nowIso() } : n)),
          notifs: notif(st, note.from, "note_reply"),
        }));
        return null;
      },
      togglePostLike(postId) {
        update((s) => {
          const post = s.posts.find((p) => p.id === postId);
          if (!post) return s;
          const liked = post.likes.includes(s.meId);
          return {
            ...s,
            posts: s.posts.map((p) => (p.id === postId ? { ...p, likes: liked ? p.likes.filter((x) => x !== s.meId) : [...p.likes, s.meId] } : p)),
            notifs: liked || post.authorId === s.meId ? s.notifs : notif(s, post.authorId, "like_post", { postId }),
          };
        });
      },
      addPostComment(postId, body) {
        const text = body.trim();
        if (!text) return;
        update((s) => {
          const post = s.posts.find((p) => p.id === postId);
          if (!post) return s;
          return {
            ...s,
            posts: s.posts.map((p) => (p.id === postId ? { ...p, comments: [...p.comments, { id: uid(), authorId: s.meId, body: text, createdAt: nowIso() }] } : p)),
            notifs: post.authorId === s.meId ? s.notifs : notif(s, post.authorId, "comment_post", { postId }),
          };
        });
      },
      toggleReviewLike(entryId) {
        update((s) => {
          const entry = s.entries.find((e) => e.id === entryId);
          if (!entry) return s;
          const liked = entry.likes.includes(s.meId);
          return {
            ...s,
            entries: s.entries.map((e) => (e.id === entryId ? { ...e, likes: liked ? e.likes.filter((x) => x !== s.meId) : [...e.likes, s.meId] } : e)),
            notifs: liked || entry.userId === s.meId ? s.notifs : notif(s, entry.userId, "like_review", { entryId }),
          };
        });
      },
      addReviewComment(entryId, body) {
        const text = body.trim();
        if (!text) return;
        update((s) => {
          const entry = s.entries.find((e) => e.id === entryId);
          if (!entry) return s;
          return {
            ...s,
            entries: s.entries.map((e) => (e.id === entryId ? { ...e, comments: [...e.comments, { id: uid(), authorId: s.meId, body: text, createdAt: nowIso() }] } : e)),
            notifs: entry.userId === s.meId ? s.notifs : notif(s, entry.userId, "comment_review", { entryId }),
          };
        });
      },
      addBook(book) {
        const id = "bk" + uid();
        update((s) => ({ ...s, books: [...s.books, { ...book, id }] }));
        return id;
      },
      addEntry(input) {
        const s = peek();
        const existing = s?.entries.find((e) => e.userId === s.meId && e.bookId === input.bookId);
        if (existing) {
          update((st) => ({ ...st, entries: st.entries.map((e) => (e.id === existing.id ? { ...e, ...input, updatedAt: nowIso() } : e)) }));
          return existing.id;
        }
        const id = "e" + uid();
        update((st) => {
          // Livros novos entram no começo da estante.
          const mine = st.entries.filter((e) => e.userId === st.meId);
          const minPos = mine.reduce((m, e) => Math.min(m, e.position), 1);
          const t = nowIso();
          return {
            ...st,
            entries: [...st.entries, { ...input, id, userId: st.meId, position: minPos - 1, createdAt: t, updatedAt: t, notes: [], likes: [], comments: [] }],
          };
        });
        return id;
      },
      updateEntry(id, patch) {
        update((s) => ({ ...s, entries: s.entries.map((e) => (e.id === id && e.userId === s.meId ? { ...e, ...patch, updatedAt: nowIso() } : e)) }));
      },
      removeEntry(id) {
        update((s) => ({ ...s, entries: s.entries.filter((e) => !(e.id === id && e.userId === s.meId)) }));
      },
      reorder(orderedIds) {
        update((s) => {
          const pos = new Map(orderedIds.map((id, i) => [id, i + 1]));
          return { ...s, entries: s.entries.map((e) => (e.userId === s.meId && pos.has(e.id) ? { ...e, position: pos.get(e.id)! } : e)) };
        });
      },
      addAnnotation(entryId, a) {
        update((s) => ({
          ...s,
          entries: s.entries.map((e) => (e.id === entryId && e.userId === s.meId ? { ...e, notes: [...e.notes, { ...a, id: uid(), createdAt: nowIso() }].sort((x, y) => (x.page ?? 1e9) - (y.page ?? 1e9)) } : e)),
        }));
      },
      removeAnnotation(entryId, annotationId) {
        update((s) => ({
          ...s,
          entries: s.entries.map((e) => (e.id === entryId && e.userId === s.meId ? { ...e, notes: e.notes.filter((n) => n.id !== annotationId) } : e)),
        }));
      },
      createPost(p) {
        const id = "p" + uid();
        update((s) => ({ ...s, posts: [{ ...p, id, authorId: s.meId, createdAt: nowIso(), likes: [], comments: [] }, ...s.posts] }));
        return id;
      },
      deletePost(postId) {
        update((s) => ({ ...s, posts: s.posts.filter((p) => !(p.id === postId && p.authorId === s.meId)) }));
      },
      updateProfile(patch) {
        const s = peek();
        if (!s) return "Carregando…";
        if (patch.username !== undefined) {
          const u = patch.username.trim().toLowerCase();
          if (!/^[a-z0-9._]{3,30}$/.test(u)) return "Use de 3 a 30 caracteres: letras, números, ponto ou _.";
          if (s.users.some((x) => x.id !== s.meId && x.username === u)) return "Este nome de usuário já existe.";
          patch = { ...patch, username: u };
        }
        update((st) => {
          let next: State = { ...st, users: st.users.map((u) => (u.id === st.meId ? { ...u, ...patch } : u)) };
          // Ao tornar a conta pública, pedidos pendentes viram seguidores (como no Instagram).
          if (patch.isPrivate === false) {
            const pending = st.requests.filter((r) => r.to === st.meId);
            next = {
              ...next,
              requests: st.requests.filter((r) => r.to !== st.meId),
              follows: [...st.follows, ...pending.map((r) => ({ from: r.from, to: st.meId, createdAt: nowIso() }))],
            };
          }
          return next;
        });
        return null;
      },
      markAllRead() {
        update((s) => ({ ...s, notifs: s.notifs.map((n) => (n.to === s.meId ? { ...n, read: true } : n)) }));
      },
      reset() {
        try {
          localStorage.removeItem(KEY);
        } catch {
          /* ignora */
        }
        setState(makeSeed());
      },
    };
  }, [toast, update]);

  if (!state) {
    return (
      <div className="boot">
        <CoinMark size={56} />
      </div>
    );
  }

  const me = userById(state, state.meId)!;
  return <StoreContext.Provider value={{ state, me, actions, toasts }}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore fora do StoreProvider");
  return ctx;
}
