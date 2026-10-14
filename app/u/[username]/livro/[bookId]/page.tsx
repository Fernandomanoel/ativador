"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar } from "@/components/Avatar";
import { Cover } from "@/components/Cover";
import { draftOf, EntryEditor } from "@/components/EntryEditor";
import { AnnotationForm, AnnotationList } from "@/components/Annotations";
import { IconHeart } from "@/components/Icons";
import { ProgressBar } from "@/components/ReadingCard";
import { Modal } from "@/components/Modal";
import { CommentForm, CommentLine } from "@/components/PostCard";
import { Stars } from "@/components/Stars";
import { formatIcon, formatLabel, statusLabel } from "@/lib/constants";
import { bookById, entryFor, userByUsername, visibleNotes } from "@/lib/selectors";
import { useStore } from "@/lib/store";
import { longDate, timeAgo } from "@/lib/util";

export default function EntryPage() {
  const { username, bookId } = useParams<{ username: string; bookId: string }>();
  const { state, me, actions } = useStore();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [reveal, setReveal] = useState(false);

  const user = userByUsername(state, username);
  const book = bookById(state, bookId);
  const entry = user && book ? entryFor(state, user.id, book.id) : undefined;

  if (!user || !book || !entry) {
    return (
      <div className="empty narrow">
        <h1>Livro não encontrado nesta estante</h1>
        <Link href={user ? `/u/${user.username}` : "/"} className="btn btn-primary">
          Voltar
        </Link>
      </div>
    );
  }

  const isMe = user.id === me.id;
  const liked = entry.likes.includes(me.id);
  const mine = entryFor(state, me.id, book.id);
  const notes = visibleNotes(entry, me.id);

  return (
    <div className="entry-page">
      <aside className="entry-poster">
        <Cover book={book} size="lg" />
        <div className="entry-poster-meta">
          <span className="tag">
            {formatIcon(entry.format)} {formatLabel(entry.format)}
          </span>
          <span className={`tag status-${entry.status}`}>{statusLabel(entry.status)}</span>
        </div>
        {!isMe && (
          <Link href={mine ? `/u/${me.username}/livro/${book.id}` : `/estante/adicionar?livro=${book.id}`} className="btn btn-secondary btn-block">
            {mine ? "Ver na minha estante" : "+ Adicionar à minha estante"}
          </Link>
        )}
        <Link href={`/livro/${book.id}`} className="btn btn-ghost btn-block">
          Todas as resenhas deste livro
        </Link>
      </aside>

      <section className="entry-main">
        <Link href={`/u/${user.username}`} className="entry-by">
          <Avatar user={user} size={28} />
          <span>
            Na estante de <strong>{user.name}</strong>
          </span>
        </Link>

        <h1 className="entry-title">
          {book.title} <span className="year">{book.year}</span>
        </h1>
        <p className="entry-author">
          de <strong>{book.author}</strong>
          {book.pages ? <span className="muted"> · {book.pages} páginas</span> : null}
        </p>

        <div className="entry-rating">
          <Stars value={entry.rating} size={22} />
          {entry.favorite && <IconHeart filled size={18} className="fav-heart" aria-label="Favorito" />}
          <span className="muted small">
            {entry.status === "lido" && entry.finishedAt ? `Lido em ${longDate(entry.finishedAt)}` : statusLabel(entry.status)}
          </span>
        </div>

        {entry.labels.length > 0 && (
          <div className="tag-row">
            {entry.labels.map((l) => (
              <span key={l} className="tag tag-label">
                #{l}
              </span>
            ))}
          </div>
        )}

        {isMe && (
          <div className="owner-actions">
            <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>
              Editar avaliação e resenha
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                if (!confirm("Remover este livro da sua estante? Resenha e anotações serão apagadas.")) return;
                actions.removeEntry(entry.id);
                router.push(`/u/${me.username}`);
              }}
            >
              Remover da estante
            </button>
          </div>
        )}

        <h2 className="section-title">Resenha</h2>
        {entry.review ? (
          entry.spoiler && !reveal && !isMe ? (
            <p className="review-text spoiler">
              Esta resenha tem spoilers.{" "}
              <button className="link-btn" onClick={() => setReveal(true)}>
                Mostrar
              </button>
            </p>
          ) : (
            <div className="review-full">
              {entry.review.split(/\n+/).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          )
        ) : (
          <p className="muted">{isMe ? "Você ainda não escreveu uma resenha." : "Sem resenha — só a nota."}</p>
        )}

        <div className="review-foot big">
          <button className={liked ? "chip-btn liked" : "chip-btn"} onClick={() => actions.toggleReviewLike(entry.id)} aria-pressed={liked}>
            <IconHeart filled={liked} size={16} /> {liked ? "Curtiu" : "Curtir resenha"}
          </button>
          <span className="muted small">{entry.likes.length} curtidas</span>
        </div>

        {entry.status === "lendo" && (
          <div className="entry-progress">
            <ProgressBar entry={entry} />
          </div>
        )}

        <h2 className="section-title">
          Anotações <span className="count">{notes.length}</span>
          {isMe && entry.notes.length > notes.filter((n) => !n.isPrivate).length && <span className="muted small">· 🔒 algumas só para você</span>}
        </h2>
        {notes.length === 0 && <p className="muted">{isMe ? "Guarde aqui trechos, páginas e pensamentos — públicos ou só para você." : "Nenhuma anotação pública."}</p>}
        <AnnotationList entry={entry} />
        {isMe && <AnnotationForm entry={entry} />}

        <h2 className="section-title">
          Comentários <span className="count">{entry.comments.length}</span>
        </h2>
        <div className="comments">
          {entry.comments.map((c) => (
            <div key={c.id} className="comment-row">
              <CommentLine c={c} />
              <span className="muted small">{timeAgo(c.createdAt)}</span>
            </div>
          ))}
          <CommentForm onSubmit={(b) => actions.addReviewComment(entry.id, b)} placeholder="Comente esta resenha…" />
        </div>
      </section>

      {editing && (
        <Modal title={book.title} onClose={() => setEditing(false)} wide>
          <EntryEditor
            initial={draftOf(entry)}
            submitLabel="Salvar"
            onCancel={() => setEditing(false)}
            onSubmit={(d) => {
              actions.updateEntry(entry.id, d);
              actions.toast("Estante atualizada");
              setEditing(false);
            }}
          />
        </Modal>
      )}
    </div>
  );
}
