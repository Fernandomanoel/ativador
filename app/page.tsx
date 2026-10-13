"use client";

import Link from "next/link";
import { Cover } from "@/components/Cover";
import { FollowControls } from "@/components/FollowControls";
import { PostCard } from "@/components/PostCard";
import { ReadingNoteCard } from "@/components/ReadingCard";
import { ReviewCard } from "@/components/ReviewCard";
import { UserLink } from "@/components/UserLink";
import { bookById, followersOf, followingOf, isFollowing, userById, visiblePosts } from "@/lib/selectors";
import { useStore } from "@/lib/store";
import type { Annotation, Entry, Post } from "@/lib/types";

type Item =
  | { kind: "post"; at: string; post: Post }
  | { kind: "review"; at: string; entry: Entry }
  | { kind: "note"; at: string; entry: Entry; note: Annotation };

export default function FeedPage() {
  const { state, me } = useStore();
  const circle = new Set([me.id, ...followingOf(state, me.id)]);

  // Um "story" por leitor: o livro que está lendo agora (o mais recente).
  const seen = new Set<string>();
  const reading = state.entries
    .filter((e) => e.status === "lendo" && circle.has(e.userId))
    .sort((a, b) => Number(b.userId === me.id) - Number(a.userId === me.id) || b.updatedAt.localeCompare(a.updatedAt))
    .filter((e) => !seen.has(e.userId) && seen.add(e.userId));

  const items: Item[] = [
    ...visiblePosts(state, me.id)
      .filter((p) => circle.has(p.authorId))
      .map((post) => ({ kind: "post" as const, at: post.createdAt, post })),
    ...state.entries
      .filter((e) => circle.has(e.userId) && e.review && e.userId !== me.id)
      .map((entry) => ({ kind: "review" as const, at: entry.updatedAt, entry })),
    // Diário de leitura: só a nota pública mais recente de cada leitura em andamento.
    ...state.entries
      .filter((e) => circle.has(e.userId) && e.userId !== me.id && e.status === "lendo")
      .flatMap((entry) => {
        const pub = entry.notes.filter((n) => !n.isPrivate).sort((a, b) => (b.page ?? 0) - (a.page ?? 0))[0];
        return pub ? [{ kind: "note" as const, at: entry.updatedAt, entry, note: pub }] : [];
      }),
  ].sort((a, b) => b.at.localeCompare(a.at));

  const suggestions = state.users
    .filter((u) => u.id !== me.id && !isFollowing(state, me.id, u.id))
    .sort((a, b) => followersOf(state, b.id).filter((f) => circle.has(f)).length - followersOf(state, a.id).filter((f) => circle.has(f)).length)
    .slice(0, 5);

  return (
    <div className="feed-layout">
      <div className="feed-col">
        {reading.length > 0 && (
          <section className="stories" aria-label="Lendo agora">
            {reading.map((e) => {
              const u = userById(state, e.userId)!;
              const b = bookById(state, e.bookId)!;
              return (
                <Link key={e.id} href={`/u/${u.username}/livro/${b.id}`} className="story">
                  <span className="story-ring">
                    <span className="story-inner">
                      <Cover book={b} size="xs" />
                    </span>
                  </span>
                  <span className="story-name">{u.id === me.id ? "Você" : u.username}</span>
                </Link>
              );
            })}
          </section>
        )}

        {items.length === 0 ? (
          <section className="welcome">
            <h2>Bem-vindo(a) ao Vivlío, {me.name.split(" ")[0]}!</h2>
            <p className="muted">Seu feed mostra fotos, resenhas e notas de leitura de quem você segue. Para começar:</p>
            <ol className="welcome-steps">
              <li>
                <Link href="/configuracoes">Complete seu perfil</Link> com foto, capa e bio.
              </li>
              <li>
                <Link href="/estante/adicionar">Coloque um livro na estante</Link> ou marque o que está lendo agora.
              </li>
              <li>
                <Link href="/explorar">Encontre outros leitores</Link> e siga quem você conhece.
              </li>
              <li>
                <Link href="/clubes">Crie um clube de leitura</Link> e chame alguém para participar.
              </li>
            </ol>
          </section>
        ) : (
          items.map((it) =>
            it.kind === "post" ? (
              <PostCard key={it.post.id} post={it.post} />
            ) : it.kind === "note" ? (
              <ReadingNoteCard key={it.note.id} entry={it.entry} note={it.note} />
            ) : (
              <div key={it.entry.id} className="feed-review">
                <ReviewCard entry={it.entry} />
              </div>
            ),
          )
        )}
      </div>

      <aside className="feed-side">
        <div className="side-me">
          <UserLink user={me} avatar={48} sub={me.name} />
          <Link href="/configuracoes" className="link-btn small">
            Editar
          </Link>
        </div>

        <h4 className="side-title">Sugestões para você</h4>
        <ul className="side-list">
          {suggestions.map((u) => {
            const mutual = followersOf(state, u.id).filter((f) => circle.has(f) && f !== me.id);
            return (
              <li key={u.id}>
                <UserLink
                  user={u}
                  avatar={36}
                  sub={mutual.length ? `Seguido(a) por ${userById(state, mutual[0])?.username}${mutual.length > 1 ? ` + ${mutual.length - 1}` : ""}` : u.isPrivate ? "Conta privada" : "Novo por aqui"}
                />
                <FollowControls user={u} compact />
              </li>
            );
          })}
        </ul>

        <h4 className="side-title">Na estante dos amigos</h4>
        <div className="side-covers">
          {Array.from(new Set(state.entries.filter((e) => circle.has(e.userId) && e.userId !== me.id && (e.rating ?? 0) >= 9).map((e) => e.bookId)))
            .slice(0, 8)
            .map((id) => {
              const b = bookById(state, id)!;
              return (
                <Link key={id} href={`/livro/${id}`}>
                  <Cover book={b} size="xs" />
                </Link>
              );
            })}
        </div>

        <p className="side-foot muted small">
          Vivlío · protótipo · {new Date().getFullYear()}
        </p>
      </aside>
    </div>
  );
}
