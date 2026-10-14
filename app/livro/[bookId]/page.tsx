"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { Cover } from "@/components/Cover";
import { ReviewCard } from "@/components/ReviewCard";
import { Stars } from "@/components/Stars";
import { avgRating, bookById, entryFor, reviewsOfBook, userById } from "@/lib/selectors";
import { useStore } from "@/lib/store";

export default function BookPage() {
  const { bookId } = useParams<{ bookId: string }>();
  const { state, me } = useStore();
  const book = bookById(state, bookId);
  if (!book) {
    return (
      <div className="empty narrow">
        <h1>Livro não encontrado</h1>
      </div>
    );
  }
  const entries = reviewsOfBook(state, book.id);
  const avg = avgRating(entries);
  const hist = Array.from({ length: 10 }, (_, i) => entries.filter((e) => e.rating === i + 1).length);
  const max = Math.max(1, ...hist);
  const mine = entryFor(state, me.id, book.id);
  const readers = entries.filter((e) => e.status === "lido").length;
  const reading = entries.filter((e) => e.status === "lendo").length;

  return (
    <div className="entry-page">
      <aside className="entry-poster">
        <Cover book={book} size="lg" />
        <Link href={mine ? `/u/${me.username}/livro/${book.id}` : `/estante/adicionar?livro=${book.id}`} className="btn btn-primary btn-block">
          {mine ? "Na sua estante" : "+ Adicionar à estante"}
        </Link>
      </aside>
      <section className="entry-main">
        <h1 className="entry-title">
          {book.title} <span className="year">{book.year}</span>
        </h1>
        <p className="entry-author">
          de <strong>{book.author}</strong>
          {book.pages ? <span className="muted"> · {book.pages} páginas</span> : null}
        </p>

        <div className="book-stats">
          <div>
            <strong>{readers}</strong>
            <span className="muted small">leram</span>
          </div>
          <div>
            <strong>{reading}</strong>
            <span className="muted small">lendo</span>
          </div>
          <div className="ratings-hist" aria-label="Distribuição das notas">
            <span className="hist-star">★</span>
            <div className="hist-bars">
              {hist.map((n, i) => (
                <span key={i} className="hist-bar" style={{ height: `${Math.max(4, (n / max) * 100)}%` }} title={`${(i + 1) / 2}★: ${n}`} />
              ))}
            </div>
            <span className="hist-star">★★★★★</span>
            {avg && <span className="hist-avg">{(avg / 2).toFixed(1).replace(".", ",")}</span>}
          </div>
        </div>

        <h2 className="section-title">Nas estantes</h2>
        <div className="avatar-row">
          {entries.map((e) => {
            const u = userById(state, e.userId)!;
            return (
              <Link key={e.id} href={`/u/${u.username}/livro/${book.id}`} title={`${u.name} — ${e.rating ? e.rating / 2 + "★" : e.status}`} className="avatar-stack-item">
                <Avatar user={u} size={40} />
                <Stars value={e.rating} size={8} />
              </Link>
            );
          })}
        </div>

        <h2 className="section-title">Resenhas</h2>
        <div className="review-list">
          {entries.filter((e) => e.review).length === 0 && <p className="muted">Ninguém escreveu sobre este livro ainda.</p>}
          {entries
            .filter((e) => e.review)
            .map((e) => (
              <ReviewCard key={e.id} entry={e} />
            ))}
        </div>
      </section>
    </div>
  );
}
