"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { Cover } from "@/components/Cover";
import { Modal } from "@/components/Modal";
import { PostImage } from "@/components/PostImage";
import { NOTE_MAX } from "@/lib/constants";
import { bookById, incomingRequests, noteBetween, userById } from "@/lib/selectors";
import { useStore } from "@/lib/store";
import type { Note, Notif } from "@/lib/types";
import { cx, timeAgo } from "@/lib/util";

type Tab = "atividade" | "pedidos" | "bilhetes";

const TEXT: Record<Notif["type"], string> = {
  follow: "começou a seguir você.",
  follow_request: "pediu para seguir você.",
  follow_accepted: "aceitou seu pedido para seguir.",
  like_post: "curtiu sua foto.",
  comment_post: "comentou na sua foto.",
  like_review: "curtiu sua resenha.",
  comment_review: "comentou na sua resenha.",
  note: "enviou um bilhete para você.",
  note_reply: "respondeu seu bilhete.",
  club_request: "pediu para entrar no seu clube.",
  club_accepted: "aprovou sua entrada no clube.",
  club_reply: "respondeu sua publicação no clube.",
};

function ReplyBox({ note, onDone }: { note: Note; onDone: () => void }) {
  const { actions } = useStore();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  return (
    <>
      <blockquote className="note-quote">{note.body}</blockquote>
      <label className="field">
        <span className="field-label">Sua resposta</span>
        <textarea rows={4} maxLength={NOTE_MAX} value={text} onChange={(e) => setText(e.target.value)} autoFocus />
        <span className="field-hint">
          {text.length}/{NOTE_MAX}
        </span>
      </label>
      <ul className="note-rules">
        <li>
          Você só pode responder <strong>uma vez</strong>.
        </li>
        <li>
          Responder <strong>não aceita</strong> o pedido para seguir — isso é decidido separadamente.
        </li>
      </ul>
      {error && <p className="form-error">{error}</p>}
      <div className="modal-actions">
        <button className="btn btn-ghost" onClick={onDone}>
          Cancelar
        </button>
        <button
          className="btn btn-primary"
          disabled={!text.trim()}
          onClick={() => {
            const err = actions.replyNote(note.id, text);
            if (err) return setError(err);
            actions.toast("Resposta enviada");
            onDone();
          }}
        >
          Enviar resposta
        </button>
      </div>
    </>
  );
}

export default function NotificationsPage() {
  const { state, me, actions } = useStore();
  const requests = incomingRequests(state);
  const [tab, setTab] = useState<Tab>(requests.length ? "pedidos" : "atividade");
  const [replying, setReplying] = useState<Note | null>(null);
  const notifs = state.notifs.filter((n) => n.to === me.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const received = state.notes.filter((n) => n.to === me.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const sent = state.notes.filter((n) => n.from === me.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  // Marca como lidas ao sair da página, para que os destaques apareçam nesta visita.
  useEffect(() => () => actions.markAllRead(), [actions]);

  return (
    <div className="narrow">
      <h1 className="page-title">Atividade</h1>
      <nav className="tabs tabs-left" role="tablist">
        <button role="tab" aria-selected={tab === "atividade"} className={cx(tab === "atividade" && "on")} onClick={() => setTab("atividade")}>
          Notificações
        </button>
        <button role="tab" aria-selected={tab === "pedidos"} className={cx(tab === "pedidos" && "on")} onClick={() => setTab("pedidos")}>
          Pedidos {requests.length > 0 && <span className="badge">{requests.length}</span>}
        </button>
        <button role="tab" aria-selected={tab === "bilhetes"} className={cx(tab === "bilhetes" && "on")} onClick={() => setTab("bilhetes")}>
          Bilhetes
        </button>
      </nav>

      {tab === "atividade" && (
        <ul className="notif-list">
          {notifs.length === 0 && <li className="muted">Nada por aqui ainda.</li>}
          {notifs.map((n) => {
            const actor = userById(state, n.actor);
            if (!actor) return null;
            const post = n.postId ? state.posts.find((p) => p.id === n.postId) : undefined;
            const entry = n.entryId ? state.entries.find((e) => e.id === n.entryId) : undefined;
            const book = entry ? bookById(state, entry.bookId) : undefined;
            const href =
              n.clubId ? (n.type === "club_request" ? `/clubes/${n.clubId}/config` : `/clubes/${n.clubId}`) :
              post ? `/p/${post.id}` : entry && book ? `/u/${me.username}/livro/${book.id}` : n.type === "note" || n.type === "note_reply" ? "#bilhetes" : `/u/${actor.username}`;
            return (
              <li key={n.id} className={cx("notif", !n.read && "unread")}>
                <Link href={`/u/${actor.username}`}>
                  <Avatar user={actor} size={44} />
                </Link>
                <p>
                  <Link href={`/u/${actor.username}`} className="strong">
                    {actor.username}
                  </Link>{" "}
                  {href.startsWith("#") ? (
                    <button className="link-btn plain" onClick={() => setTab(n.type === "note" ? "pedidos" : "bilhetes")}>
                      {TEXT[n.type]}
                    </button>
                  ) : (
                    <Link href={href}>{TEXT[n.type]}</Link>
                  )}{" "}
                  <span className="muted small">{timeAgo(n.createdAt)}</span>
                </p>
                {post && (
                  <Link href={`/p/${post.id}`} className="notif-thumb">
                    <PostImage post={post} />
                  </Link>
                )}
                {book && (
                  <Link href={`/u/${me.username}/livro/${book.id}`} className="notif-cover">
                    <Cover book={book} size="xs" />
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {tab === "pedidos" && (
        <>
          {!me.isPrivate && <p className="hint">Sua conta é pública: novas pessoas seguem você direto, sem pedido.</p>}
          {requests.length === 0 ? (
            <p className="muted">Nenhum pedido pendente.</p>
          ) : (
            <ul className="request-list">
              {requests.map((r) => {
                const u = userById(state, r.from)!;
                const note = noteBetween(state, u.id, me.id);
                return (
                  <li key={u.id} className="request">
                    <div className="request-head">
                      <Link href={`/u/${u.username}`}>
                        <Avatar user={u} size={48} />
                      </Link>
                      <div>
                        <Link href={`/u/${u.username}`} className="strong">
                          {u.username}
                        </Link>
                        <div className="muted small">
                          {u.name} · pediu {timeAgo(r.createdAt)}
                        </div>
                      </div>
                      <div className="request-actions">
                        <button className="btn btn-primary btn-sm" onClick={() => actions.acceptRequest(u.id)}>
                          Aceitar
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => actions.rejectRequest(u.id)}>
                          Recusar
                        </button>
                      </div>
                    </div>
                    {note && (
                      <div className="request-note">
                        <span className="note-label">✉️ Bilhete</span>
                        <p>{note.body}</p>
                        {note.reply ? (
                          <p className="note-reply">
                            <strong>Sua resposta:</strong> {note.reply}
                          </p>
                        ) : (
                          <button className="link-btn" onClick={() => setReplying(note)}>
                            Responder (uma única vez)
                          </button>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      {tab === "bilhetes" && (
        <div className="notes-cols">
          <section>
            <h2 className="section-title">Recebidos</h2>
            {received.length === 0 && <p className="muted">Nenhum bilhete recebido.</p>}
            {received.map((n) => {
              const u = userById(state, n.from)!;
              return (
                <article key={n.id} className="note-card">
                  <header>
                    <Avatar user={u} size={28} />
                    <Link href={`/u/${u.username}`} className="strong">
                      {u.username}
                    </Link>
                    <span className="muted small">{timeAgo(n.createdAt)}</span>
                  </header>
                  <p>{n.body}</p>
                  {n.reply ? (
                    <p className="note-reply">
                      <strong>Você respondeu:</strong> {n.reply}
                    </p>
                  ) : (
                    <button className="btn btn-secondary btn-sm" onClick={() => setReplying(n)}>
                      Responder uma vez
                    </button>
                  )}
                </article>
              );
            })}
          </section>
          <section>
            <h2 className="section-title">Enviados</h2>
            {sent.length === 0 && <p className="muted">Você ainda não enviou bilhetes. Eles servem para se apresentar a contas privadas.</p>}
            {sent.map((n) => {
              const u = userById(state, n.to)!;
              return (
                <article key={n.id} className="note-card">
                  <header>
                    <Avatar user={u} size={28} />
                    <Link href={`/u/${u.username}`} className="strong">
                      {u.username}
                    </Link>
                    <span className="muted small">{timeAgo(n.createdAt)}</span>
                  </header>
                  <p>{n.body}</p>
                  {n.reply ? (
                    <p className="note-reply">
                      <strong>{u.username} respondeu:</strong> {n.reply}
                    </p>
                  ) : (
                    <p className="muted small">Aguardando resposta…</p>
                  )}
                </article>
              );
            })}
          </section>
        </div>
      )}

      {replying && (
        <Modal title={`Responder @${userById(state, replying.from)?.username}`} onClose={() => setReplying(null)}>
          <ReplyBox note={replying} onDone={() => setReplying(null)} />
        </Modal>
      )}
    </div>
  );
}
