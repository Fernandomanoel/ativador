"use client";

import Link from "next/link";
import { useState } from "react";
import { Cover } from "@/components/Cover";
import { FollowControls } from "@/components/FollowControls";
import { IconComment, IconHeart, IconSearch } from "@/components/Icons";
import { PostImage } from "@/components/PostImage";
import { ReviewCard } from "@/components/ReviewCard";
import { Stars } from "@/components/Stars";
import { UserLink } from "@/components/UserLink";
import { avgRating, reviewsOfBook, visiblePosts } from "@/lib/selectors";
import { useStore } from "@/lib/store";

const norm = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export default function ExplorePage() {
  const { state, me } = useStore();
  const [q, setQ] = useState("");
  const query = norm(q.trim());

  const people = query ? state.users.filter((u) => norm(u.username + " " + u.name).includes(query)) : [];
  const books = query ? state.books.filter((b) => norm(b.title + " " + b.author).includes(query)) : [];

  const popular = [...state.books]
    .map((b) => ({ b, n: reviewsOfBook(state, b.id).length }))
    .sort((a, b) => b.n - a.n)
    .slice(0, 8);
  const recentReviews = state.entries
    .filter((e) => e.review && e.userId !== me.id)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 6);
  const photos = visiblePosts(state, me.id)
    .filter((p) => p.authorId !== me.id)
    .sort((a, b) => b.likes.length - a.likes.length);

  return (
    <div className="explore">
      <div className="search-bar big">
        <IconSearch size={18} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar leitores e livros" aria-label="Buscar" />
      </div>

      {query ? (
        <div className="search-results">
          <section>
            <h2 className="section-title">Leitores</h2>
            {people.length === 0 && <p className="muted">Ninguém com esse nome.</p>}
            <ul className="people">
              {people.map((u) => (
                <li key={u.id}>
                  <UserLink user={u} avatar={44} sub={u.name} />
                  <FollowControls user={u} compact />
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h2 className="section-title">Livros</h2>
            {books.length === 0 && (
              <p className="muted">
                Nenhum livro. <Link href="/estante/adicionar">Adicionar à estante</Link>
              </p>
            )}
            <div className="pick-grid">
              {books.map((b) => (
                <Link key={b.id} href={`/livro/${b.id}`} className="pick">
                  <Cover book={b} size="sm" />
                  <span className="pick-title">{b.title}</span>
                  <span className="muted small">{b.author}</span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <>
          <section>
            <h2 className="section-title">Populares no Vivlío</h2>
            <div className="popular-row">
              {popular.map(({ b, n }) => (
                <Link key={b.id} href={`/livro/${b.id}`} className="popular">
                  <Cover book={b} size="md" />
                  <span className="popular-meta">
                    <Stars value={Math.round(avgRating(reviewsOfBook(state, b.id)) ?? 0)} size={10} />
                    <span className="muted small">{n} estantes</span>
                  </span>
                </Link>
              ))}
            </div>
          </section>

          <div className="explore-cols">
            <section>
              <h2 className="section-title">Resenhas recentes</h2>
              <div className="review-list">
                {recentReviews.map((e) => (
                  <ReviewCard key={e.id} entry={e} />
                ))}
              </div>
            </section>
            <section>
              <h2 className="section-title">Fotos</h2>
              <div className="photo-grid small">
                {photos.map((p) => (
                  <Link key={p.id} href={`/p/${p.id}`} className="photo-tile">
                    <PostImage post={p} />
                    <span className="photo-hover">
                      <span>
                        <IconHeart filled size={16} /> {p.likes.length}
                      </span>
                      <span>
                        <IconComment size={16} /> {p.comments.length}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
              <p className="muted small">Fotos de contas privadas só aparecem para seguidores aprovados.</p>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
