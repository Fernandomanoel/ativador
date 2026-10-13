"use client";

import Link from "next/link";
import { useState } from "react";
import { CLUB_AREAS, focusLabel, spoilerLabel } from "@/lib/constants";
import { bookById, canModerate, clubMembersOf, memberOf, pagesRead, userById } from "@/lib/selectors";
import { useStore } from "@/lib/store";
import type { Club, ClubArea, ClubPost } from "@/lib/types";
import { cx, fileToDataUrl, initials, timeAgo } from "@/lib/util";
import { Avatar } from "./Avatar";
import { Cover } from "./Cover";
import { IconComment, IconHeart, IconImage, IconLock, IconTrash } from "./Icons";
import { CommentForm, CommentLine } from "./PostCard";
import { PostImage } from "./PostImage";
import { StarInput, Stars } from "./Stars";

export const CLUB_TONES = [
  ["#3b2f4a", "#b56576"],
  ["#1f3a5f", "#8d99ae"],
  ["#5c3d2e", "#d4a373"],
  ["#4a1f2e", "#ff6b81"],
  ["#1d1d2b", "#6c63ff"],
  ["#2a2626", "#c9d1da"],
];

export function ClubBadge({ club, size = 56 }: { club: Club; size?: number }) {
  const [a, b] = CLUB_TONES[club.tone % CLUB_TONES.length];
  return (
    <span className="club-badge" style={{ width: size, height: size, fontSize: size * 0.34, background: `linear-gradient(135deg, ${a}, ${b})` }} aria-hidden>
      {initials(club.name)}
    </span>
  );
}

export function ClubCard({ club }: { club: Club }) {
  const { state, me } = useStore();
  const members = clubMembersOf(state, club.id);
  const book = bookById(state, club.bookId);
  const isMember = !!memberOf(state, club.id, me.id);
  const full = members.length >= club.maxMembers;
  return (
    <Link href={`/clubes/${club.id}`} className={cx("club-card", club.cover && "with-cover")}>
      {club.cover && (
        <span className="club-card-cover">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={club.cover} alt="" />
        </span>
      )}
      <div className="club-card-head">
        <ClubBadge club={club} size={48} />
        <div>
          <h3>{club.name}</h3>
          <span className="muted small">
            {focusLabel(club.focus)} · {club.access === "aberto" ? "Aberto" : "Com aprovação"}
          </span>
        </div>
      </div>
      <p className="club-card-desc">{club.description}</p>
      <div className="club-card-foot">
        {book && (
          <span className="club-card-book">
            <Cover book={book} size="xs" />
            <span className="small">
              Lendo <strong>{book.title}</strong>
            </span>
          </span>
        )}
        <span className={cx("seats", full && "full")}>
          {members.length}/{club.maxMembers}
        </span>
      </div>
      <div className="club-card-tags">
        <span className="tag">🛡️ {spoilerLabel(club.spoilerPolicy)}</span>
        {isMember && <span className="tag tag-label">Você participa</span>}
        {!isMember && full && <span className="tag">Cheio</span>}
      </div>
    </Link>
  );
}

/** Por que um post está escondido para quem vê (ou null se pode ver). */
export function spoilerReason(post: ClubPost, club: Club, myRead: number, isAuthor: boolean): string | null {
  if (isAuthor || club.spoilerPolicy === "liberado") return null;
  if (post.page && myRead < post.page) {
    return `Fala até a p. ${post.page} — ${myRead ? `você está na p. ${myRead}` : "você ainda não registrou progresso neste livro"}.`;
  }
  if (post.spoiler) return "Marcado como spoiler.";
  return null;
}

export function ClubPostCard({ post, club }: { post: ClubPost; club: Club }) {
  const { state, me, actions } = useStore();
  const [reveal, setReveal] = useState(false);
  const [showReplies, setShowReplies] = useState(post.area === "duvidas");
  const author = userById(state, post.authorId);
  const book = bookById(state, post.bookId);
  if (!author) return null;
  const isAuthor = post.authorId === me.id;
  const mod = canModerate(state, club.id, me.id);
  const myRead = post.bookId ? pagesRead(state, me.id, post.bookId) : Infinity;
  const reason = spoilerReason(post, club, myRead, isAuthor);
  const hidden = !!reason && !reveal;
  const liked = post.likes.includes(me.id);

  return (
    <article className={cx("club-post", post.pinned && "pinned")}>
      <header className="club-post-head">
        <Avatar user={author} size={32} />
        <div className="club-post-meta">
          <span>
            <Link href={`/u/${author.username}`} className="strong">
              {author.username}
            </Link>
            {memberOf(state, club.id, author.id)?.role !== "membro" && <span className="role-pill">{memberOf(state, club.id, author.id)?.role}</span>}
            <span className="muted small"> · {timeAgo(post.createdAt)}</span>
          </span>
          <span className="club-post-badges">
            {post.pinned && <span className="tag">📌 Fixado</span>}
            {post.area === "duvidas" && <span className={cx("tag", post.resolved ? "tag-ok" : "tag-open")}>{post.resolved ? "✓ Resolvida" : "Aberta"}</span>}
            {book && (
              <Link href={`/livro/${book.id}`} className="tag">
                📖 {book.title}
                {post.page ? ` · até p. ${post.page}` : ""}
              </Link>
            )}
            {post.rating && <Stars value={post.rating} size={11} />}
          </span>
        </div>
        {(isAuthor || mod) && (
          <div className="club-post-tools">
            {mod && (
              <button className="link-btn small" onClick={() => actions.toggleClubPostPin(post.id)}>
                {post.pinned ? "Desafixar" : "Fixar"}
              </button>
            )}
            {post.area === "duvidas" && (
              <button className="link-btn small" onClick={() => actions.toggleClubPostResolved(post.id)}>
                {post.resolved ? "Reabrir" : "Marcar resolvida"}
              </button>
            )}
            <button className="icon-btn" aria-label="Apagar" onClick={() => confirm("Apagar esta publicação?") && actions.deleteClubPost(post.id)}>
              <IconTrash size={15} />
            </button>
          </div>
        )}
      </header>

      <div className={cx("club-post-content", hidden && "blurred")}>
        {post.title && <h4>{post.title}</h4>}
        {post.body && <p className="club-post-body">{post.body}</p>}
        {post.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.image} alt={post.title || "Imagem"} className="club-post-image" />
        ) : post.scene ? (
          <div className="club-post-scene">
            <PostImage post={{ id: post.id, authorId: post.authorId, scene: post.scene, caption: post.title, createdAt: post.createdAt, likes: [], comments: [] }} />
          </div>
        ) : null}
      </div>
      {hidden && (
        <div className="spoiler-gate">
          <span>🛡️ {reason}</span>
          <button className="btn btn-secondary btn-sm" onClick={() => setReveal(true)}>
            Mostrar mesmo assim
          </button>
        </div>
      )}

      <footer className="club-post-foot">
        <button className={liked ? "chip-btn liked" : "chip-btn"} onClick={() => actions.toggleClubPostLike(post.id)} aria-pressed={liked}>
          <IconHeart filled={liked} size={14} /> {post.likes.length || ""}
        </button>
        <button className="chip-btn" onClick={() => setShowReplies((s) => !s)}>
          <IconComment size={14} /> {post.replies.length}{" "}
          {post.area === "duvidas" ? (post.replies.length === 1 ? "resposta" : "respostas") : post.replies.length === 1 ? "comentário" : "comentários"}
        </button>
      </footer>
      {showReplies && !hidden && (
        <div className="club-replies">
          {post.replies.map((c) => (
            <div key={c.id} className="comment-row">
              <CommentLine c={c} />
              <span className="muted small">{timeAgo(c.createdAt)}</span>
            </div>
          ))}
          <CommentForm onSubmit={(b) => actions.replyClubPost(post.id, b)} placeholder={post.area === "duvidas" ? "Responder a dúvida…" : "Comentar…"} />
        </div>
      )}
    </article>
  );
}

const PLACEHOLDERS: Record<ClubArea, { title: string; body: string }> = {
  anotacoes: { title: "Ex.: A faca da avó", body: "Compartilhe um trecho, uma marcação ou um pensamento…" },
  resenhas: { title: "Ex.: Minha resenha de outubro", body: "O que achou da leitura do mês?" },
  duvidas: { title: "Qual é a sua dúvida?", body: "Explique o contexto — capítulo, página, personagem…" },
  estudos: { title: "Ex.: Fichamento do capítulo 3", body: "Resumo, contexto histórico, análise, links de apoio…" },
  galeria: { title: "Ex.: Vol. 1, cap. 4 — a luta no vilarejo", body: "Legenda (volume, capítulo, o que chamou atenção)…" },
  cronograma: { title: "Ex.: Semana 2", body: "Até onde ler, datas e combinados…" },
  conversa: { title: "Assunto", body: "Puxe um assunto com o clube…" },
};

export function ClubComposer({ club, area }: { club: Club; area: ClubArea }) {
  const { state, actions } = useStore();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ title: "", body: "", page: "", spoiler: false, rating: undefined as number | undefined, image: "" as string, useBook: true });
  const [error, setError] = useState<string | null>(null);
  const book = bookById(state, club.bookId);
  const info = CLUB_AREAS.find((a) => a.id === area)!;
  const ph = PLACEHOLDERS[area];

  if (!open) {
    return (
      <button className="composer-collapsed" onClick={() => setOpen(true)}>
        <span>{info.icon}</span> {area === "duvidas" ? "Fazer uma pergunta…" : area === "galeria" ? "Compartilhar imagem…" : `Publicar em ${info.label}…`}
      </button>
    );
  }

  return (
    <form
      className="club-composer"
      onSubmit={(e) => {
        e.preventDefault();
        const err = actions.createClubPost({
          clubId: club.id,
          area,
          title: f.title,
          body: f.body,
          image: f.image || undefined,
          bookId: f.useBook ? club.bookId : undefined,
          page: f.useBook && f.page ? Number(f.page) : undefined,
          rating: area === "resenhas" ? f.rating : undefined,
          spoiler: f.spoiler,
        });
        if (err) return setError(err);
        actions.toast("Publicado no clube");
        setF({ title: "", body: "", page: "", spoiler: false, rating: undefined, image: "", useBook: true });
        setError(null);
        setOpen(false);
      }}
    >
      <p className="muted small">
        {info.icon} {info.hint}
      </p>
      <input placeholder={ph.title} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} maxLength={120} aria-label="Título" />
      <textarea rows={4} placeholder={ph.body} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} maxLength={4000} aria-label="Texto" />
      {area === "resenhas" && (
        <div className="composer-row">
          <span className="field-label">Nota</span>
          <StarInput value={f.rating} onChange={(v) => setF({ ...f, rating: v })} size={24} />
        </div>
      )}
      {(area === "galeria" || area === "estudos" || area === "conversa" || area === "anotacoes") && (
        <div className="composer-row">
          <label className="btn btn-secondary btn-sm">
            <IconImage size={16} /> {f.image ? "Trocar imagem" : "Adicionar imagem"}
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) setF({ ...f, image: await fileToDataUrl(file, 1400) });
              }}
            />
          </label>
          {f.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={f.image} alt="" className="composer-thumb" />
          )}
        </div>
      )}
      {book && (
        <div className="composer-row wrap">
          <label className="toggle">
            <input type="checkbox" checked={f.useBook} onChange={(e) => setF({ ...f, useBook: e.target.checked })} />
            <span className="toggle-ui" /> Sobre <strong>{book.title}</strong>
          </label>
          {f.useBook && club.spoilerPolicy !== "liberado" && (
            <label className="inline-field">
              até a página
              <input type="number" min={1} value={f.page} onChange={(e) => setF({ ...f, page: e.target.value })} placeholder="—" />
            </label>
          )}
        </div>
      )}
      {club.spoilerPolicy === "marcados" && (
        <label className="toggle">
          <input type="checkbox" checked={f.spoiler} onChange={(e) => setF({ ...f, spoiler: e.target.checked })} />
          <span className="toggle-ui" /> Contém spoiler
        </label>
      )}
      {club.spoilerPolicy === "sem-spoiler" && (
        <p className="muted small">🛡️ Clube sem spoiler: informe a página — quem ainda não chegou lá não verá o conteúdo.</p>
      )}
      {error && <p className="form-error">{error}</p>}
      <div className="modal-actions">
        <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-primary">
          Publicar
        </button>
      </div>
    </form>
  );
}

export function MembersOnly({ club }: { club: Club }) {
  return (
    <div className="private-wall">
      <span className="private-icon">
        <IconLock size={30} />
      </span>
      <h2>Conteúdo só para membros</h2>
      <p className="muted">
        As publicações de “{club.name}” ficam dentro do clube. Entre para participar das áreas abaixo.
      </p>
      <ul className="area-list">
        {club.areas.map((a) => {
          const info = CLUB_AREAS.find((x) => x.id === a)!;
          return (
            <li key={a}>
              <span>{info.icon}</span>
              <div>
                <strong>{info.label}</strong>
                <span className="muted small block">{info.hint}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
