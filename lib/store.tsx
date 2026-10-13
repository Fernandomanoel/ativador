"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Login, type LoginInfo } from "@/components/Login";
import { CoinMark } from "@/components/Logo";
import { authPost } from "./authClient";
import { runOp, type ClubInput, type ClubPostInput, type EntryInput, type OpArgs, type OpName, type PostInput, type ProfilePatch } from "./logic";
import { makeSeed, STATE_VERSION } from "./seed";
import { userById } from "./selectors";
import type { Annotation, Book, ClubRole, State, User } from "./types";
import { uid } from "./util";

export type { ClubInput, ClubPostInput } from "./logic";

const KEY = "vivlio:state";
const POLL_MS = 20_000;

/**
 * - "server": contas reais; cada ação vai para /api/action e o servidor decide.
 * - "demo": dados de exemplo salvos no navegador (prévia no claude.ai, ou quando
 *   o servidor ainda não foi configurado).
 */
export type Mode = "server" | "demo";

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
  toggleAnnotationPrivacy(entryId: string, annotationId: string): void;
  updateProgress(entryId: string, page: number): void;
  createClub(input: ClubInput): string;
  updateClub(clubId: string, patch: Partial<ClubInput>): string | null;
  deleteClub(clubId: string): void;
  joinClub(clubId: string): string | null;
  cancelClubRequest(clubId: string): void;
  leaveClub(clubId: string): string | null;
  approveClubRequest(clubId: string, userId: string): string | null;
  rejectClubRequest(clubId: string, userId: string): void;
  removeClubMember(clubId: string, userId: string): void;
  setClubRole(clubId: string, userId: string, role: Exclude<ClubRole, "dono">): void;
  createClubPost(input: ClubPostInput): string | null;
  deleteClubPost(postId: string): void;
  toggleClubPostLike(postId: string): void;
  toggleClubPostPin(postId: string): void;
  toggleClubPostResolved(postId: string): void;
  replyClubPost(postId: string, body: string): void;
  createPost(p: PostInput): string;
  deletePost(postId: string): void;
  updateProfile(patch: ProfilePatch): string | null;
  markAllRead(): void;
  reset(): void;
  signOut(): void;
  toast(msg: string): void;
}

interface Ctx {
  state: State;
  me: User;
  mode: Mode;
  /** Quando o servidor existe mas falta configuração (mostrado como aviso no modo demonstração). */
  setupMissing: string[];
  actions: Actions;
  toasts: { id: string; msg: string }[];
}

const StoreContext = createContext<Ctx | null>(null);

function loadDemo(): State {
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

// undefined some no JSON; null avisa o servidor para apagar o campo (ex.: tirar a capa).
const toJson = (v: unknown) => JSON.stringify(v, (_k, x) => (x === undefined ? null : x));

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State | null>(null);
  const [mode, setMode] = useState<Mode>("demo");
  const [login, setLogin] = useState<LoginInfo | null>(null);
  const [setupMissing, setSetupMissing] = useState<string[]>([]);
  const [toasts, setToasts] = useState<{ id: string; msg: string }[]>([]);
  const saveWarned = useRef(false);
  const stateRef = useRef<State | null>(null);
  const modeRef = useRef<Mode>("demo");
  const pending = useRef(0);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  stateRef.current = state;
  modeRef.current = mode;

  const toast = useCallback((msg: string) => {
    const id = uid();
    setToasts((t) => [...t, { id, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  const startDemo = useCallback((missing: string[] = []) => {
    setSetupMissing(missing);
    setMode("demo");
    setState(loadDemo());
  }, []);

  const fetchState = useCallback(async () => {
    const res = await fetch("/api/state", { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.state) {
      setLogin(null);
      setMode("server");
      if (pending.current === 0) setState(data.state as State);
      return;
    }
    if (res.status === 401) {
      setState(null);
      setLogin({ providers: data.providers ?? {}, error: new URLSearchParams(location.search).get("error") });
      return;
    }
    if (res.status === 503) return startDemo(data.missing ?? []);
    throw new Error(`HTTP ${res.status}`);
  }, [startDemo]);

  // Começo: prévia publicada → demonstração; senão pergunta ao servidor.
  useEffect(() => {
    if ((window as { __VIVLIO_DEMO__?: boolean }).__VIVLIO_DEMO__) return startDemo();
    fetchState().catch(() => startDemo());
  }, [fetchState, startDemo]);

  // Modo demonstração: salva no navegador.
  useEffect(() => {
    if (!state || mode !== "demo") return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      if (!saveWarned.current) {
        saveWarned.current = true;
        toast("Armazenamento do navegador cheio — algumas fotos podem não ficar salvas.");
      }
    }
  }, [state, mode, toast]);

  // Contas reais: busca novidades da outra pessoa de tempos em tempos.
  useEffect(() => {
    if (mode !== "server") return;
    const tick = () => document.visibilityState === "visible" && pending.current === 0 && fetchState().catch(() => {});
    const timer = setInterval(tick, POLL_MS);
    window.addEventListener("focus", tick);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", tick);
    };
  }, [mode, fetchState]);

  /** Aplica a ação na hora (para a tela responder rápido) e, com contas reais, confirma no servidor. */
  const run = useCallback(
    <N extends OpName>(name: N, args: OpArgs<N>): { error?: string; value?: string } => {
      const cur = stateRef.current;
      if (!cur) return { error: "Carregando…" };
      const out = runOp(cur, name, args);
      if (out.error) return { error: out.error };
      stateRef.current = out.state;
      setState(out.state);
      if (modeRef.current === "server") {
        pending.current++;
        queue.current = queue.current
          .then(async () => {
            const res = await fetch("/api/action", { method: "POST", headers: { "Content-Type": "application/json" }, body: toJson({ name, args }) });
            const data = await res.json().catch(() => ({}));
            pending.current--;
            if (res.status === 401) return fetchState();
            if (!res.ok || data.error) {
              toast(data.error || "Não foi possível salvar. Tente de novo.");
              if (pending.current === 0) await fetchState().catch(() => {});
              return;
            }
            if (pending.current === 0 && data.state) setState(data.state as State);
          })
          .catch(() => {
            pending.current = Math.max(0, pending.current - 1);
            toast("Sem conexão com o servidor. A última ação pode não ter sido salva.");
          });
      }
      return { value: out.value };
    },
    [fetchState, toast],
  );

  const actions = useMemo<Actions>(() => {
    const id = (prefix: string) => prefix + uid();
    /** Para ações que devolvem mensagem de erro (ou null quando deu certo). */
    const err = <N extends OpName>(name: N, args: OpArgs<N>) => run(name, args).error ?? null;
    /** Para ações que criam algo e devolvem o id. */
    const val = <N extends OpName>(name: N, args: OpArgs<N>) => run(name, args).value ?? "";
    return {
      toast,
      follow: (t, note) => void run("follow", [t, note]),
      unfollow: (t) => void run("unfollow", [t]),
      cancelRequest: (t) => void run("cancelRequest", [t]),
      acceptRequest: (f) => void run("acceptRequest", [f]),
      rejectRequest: (f) => void run("rejectRequest", [f]),
      removeFollower: (u) => void run("removeFollower", [u]),
      sendNote: (to, body) => err("sendNote", [to, body]),
      replyNote: (n, body) => err("replyNote", [n, body]),
      togglePostLike: (p) => void run("togglePostLike", [p]),
      addPostComment: (p, body) => void run("addPostComment", [p, body]),
      toggleReviewLike: (e) => void run("toggleReviewLike", [e]),
      addReviewComment: (e, body) => void run("addReviewComment", [e, body]),
      addBook: (book) => val("addBook", [book, id("bk")]),
      addEntry: (input) => val("addEntry", [input, id("e")]),
      updateEntry: (e, patch) => void run("updateEntry", [e, patch]),
      removeEntry: (e) => void run("removeEntry", [e]),
      reorder: (ids) => void run("reorder", [ids]),
      addAnnotation: (e, a) => void run("addAnnotation", [e, a]),
      removeAnnotation: (e, n) => void run("removeAnnotation", [e, n]),
      toggleAnnotationPrivacy: (e, n) => void run("toggleAnnotationPrivacy", [e, n]),
      updateProgress: (e, page) => void run("updateProgress", [e, page]),
      createClub: (input) => val("createClub", [input, id("c")]),
      updateClub: (c, patch) => err("updateClub", [c, patch]),
      deleteClub: (c) => void run("deleteClub", [c]),
      joinClub: (c) => err("joinClub", [c]),
      cancelClubRequest: (c) => void run("cancelClubRequest", [c]),
      leaveClub: (c) => err("leaveClub", [c]),
      approveClubRequest: (c, u) => err("approveClubRequest", [c, u]),
      rejectClubRequest: (c, u) => void run("rejectClubRequest", [c, u]),
      removeClubMember: (c, u) => void run("removeClubMember", [c, u]),
      setClubRole: (c, u, r) => void run("setClubRole", [c, u, r]),
      createClubPost: (input) => err("createClubPost", [input, id("cp")]),
      deleteClubPost: (p) => void run("deleteClubPost", [p]),
      toggleClubPostLike: (p) => void run("toggleClubPostLike", [p]),
      toggleClubPostPin: (p) => void run("toggleClubPostPin", [p]),
      toggleClubPostResolved: (p) => void run("toggleClubPostResolved", [p]),
      replyClubPost: (p, body) => void run("replyClubPost", [p, body]),
      createPost: (p) => val("createPost", [p, id("p")]),
      deletePost: (p) => void run("deletePost", [p]),
      updateProfile: (patch) => err("updateProfile", [patch]),
      markAllRead: () => {
        const s = stateRef.current;
        if (s?.notifs.some((n) => n.to === s.meId && !n.read)) run("markAllRead", []);
      },
      reset() {
        if (modeRef.current !== "demo") return;
        try {
          localStorage.removeItem(KEY);
        } catch {
          /* ignora */
        }
        setState(makeSeed());
      },
      signOut() {
        authPost("/api/auth/signout", { callbackUrl: "/" }).catch(() => toast("Não foi possível sair agora."));
      },
    };
  }, [run, toast]);

  if (login) return <Login info={login} />;

  if (!state) {
    return (
      <div className="boot">
        <CoinMark size={56} />
      </div>
    );
  }

  const me = userById(state, state.meId)!;
  return <StoreContext.Provider value={{ state, me, mode, setupMissing, actions, toasts }}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore fora do StoreProvider");
  return ctx;
}
