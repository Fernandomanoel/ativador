"use client";

import Link from "next/link";
import { useState } from "react";
import { NOTE_MAX } from "@/lib/constants";
import { hasRequested, isFollowing, noteBetween } from "@/lib/selectors";
import { useStore } from "@/lib/store";
import type { User } from "@/lib/types";
import { timeAgo } from "@/lib/util";
import { Avatar } from "./Avatar";
import { IconMail } from "./Icons";
import { Modal } from "./Modal";

export function NoteRules() {
  return (
    <ul className="note-rules">
      <li>Você pode enviar <strong>um único bilhete</strong> para esta pessoa.</li>
      <li>Ela pode responder <strong>uma única vez</strong>.</li>
      <li>Responder o bilhete <strong>não significa</strong> aceitar o pedido para seguir.</li>
    </ul>
  );
}

function NoteComposer({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <label className="field">
      <span className="field-label">Bilhete (opcional)</span>
      <textarea
        rows={4}
        maxLength={NOTE_MAX}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Conte por que você quer acompanhar as publicações dessa pessoa…"
      />
      <span className="field-hint">{value.length}/{NOTE_MAX}</span>
    </label>
  );
}

export function FollowControls({ user, compact }: { user: User; compact?: boolean }) {
  const { state, me, actions } = useStore();
  const [modal, setModal] = useState<null | "request" | "note" | "view">(null);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (user.id === me.id) {
    return compact ? null : (
      <Link href="/configuracoes" className="btn btn-secondary">
        Editar perfil
      </Link>
    );
  }

  const following = isFollowing(state, me.id, user.id);
  const requested = hasRequested(state, me.id, user.id);
  const sentNote = noteBetween(state, me.id, user.id);
  const canNote = user.isPrivate && !following;

  const close = () => {
    setModal(null);
    setText("");
    setError(null);
  };

  let main;
  if (following) {
    main = (
      <button className="btn btn-secondary" onClick={() => confirm(`Deixar de seguir @${user.username}?`) && actions.unfollow(user.id)}>
        Seguindo
      </button>
    );
  } else if (requested) {
    main = (
      <button className="btn btn-secondary" onClick={() => confirm("Cancelar o pedido para seguir?") && actions.cancelRequest(user.id)}>
        Solicitado
      </button>
    );
  } else if (user.isPrivate) {
    main = (
      <button className="btn btn-primary" onClick={() => setModal("request")}>
        Pedir para seguir
      </button>
    );
  } else {
    main = (
      <button
        className="btn btn-primary"
        onClick={() => {
          actions.follow(user.id);
          actions.toast(`Agora você segue @${user.username}`);
        }}
      >
        Seguir
      </button>
    );
  }

  return (
    <>
      <div className="follow-controls">
        {main}
        {canNote && !compact && (
          <button className="btn btn-secondary" onClick={() => setModal(sentNote ? "view" : "note")}>
            <IconMail size={16} /> {sentNote ? (sentNote.reply ? "Bilhete respondido" : "Bilhete enviado") : "Bilhete"}
          </button>
        )}
      </div>

      {modal === "request" && (
        <Modal title="Pedir para seguir" onClose={close}>
          <div className="modal-user">
            <Avatar user={user} size={56} />
            <div>
              <strong>{user.name}</strong>
              <p className="muted">@{user.username} tem uma conta privada. As publicações ficam visíveis só depois que o pedido for aceito — a estante continua aberta para todo mundo.</p>
            </div>
          </div>
          {!sentNote ? (
            <>
              <NoteComposer value={text} onChange={setText} />
              <NoteRules />
            </>
          ) : (
            <p className="muted small">Você já enviou seu bilhete para @{user.username}.</p>
          )}
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={close}>
              Cancelar
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                actions.follow(user.id, sentNote ? undefined : text);
                actions.toast(text.trim() && !sentNote ? "Pedido e bilhete enviados" : "Pedido enviado");
                close();
              }}
            >
              {text.trim() && !sentNote ? "Enviar pedido e bilhete" : "Enviar pedido"}
            </button>
          </div>
        </Modal>
      )}

      {modal === "note" && (
        <Modal title={`Bilhete para @${user.username}`} onClose={close}>
          <NoteComposer value={text} onChange={setText} />
          <NoteRules />
          {error && <p className="form-error">{error}</p>}
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={close}>
              Cancelar
            </button>
            <button
              className="btn btn-primary"
              disabled={!text.trim()}
              onClick={() => {
                const err = actions.sendNote(user.id, text);
                if (err) return setError(err);
                actions.toast("Bilhete enviado");
                close();
              }}
            >
              Enviar bilhete
            </button>
          </div>
        </Modal>
      )}

      {modal === "view" && sentNote && (
        <Modal title={`Seu bilhete para @${user.username}`} onClose={close}>
          <div className="note-thread">
            <div className="note-bubble mine">
              <p>{sentNote.body}</p>
              <span className="muted small">você · {timeAgo(sentNote.createdAt)}</span>
            </div>
            {sentNote.reply ? (
              <div className="note-bubble">
                <p>{sentNote.reply}</p>
                <span className="muted small">
                  @{user.username} · {timeAgo(sentNote.repliedAt!)}
                </span>
              </div>
            ) : (
              <p className="muted small center">Aguardando resposta. @{user.username} pode responder uma única vez.</p>
            )}
          </div>
          {sentNote.reply && !following && <p className="muted small center">Responder não é aceitar: o pedido para seguir continua {requested ? "pendente" : "não enviado"}.</p>}
          {!requested && !following && (
            <div className="modal-actions">
              <button
                className="btn btn-primary"
                onClick={() => {
                  actions.follow(user.id);
                  actions.toast("Pedido enviado");
                  close();
                }}
              >
                Pedir para seguir
              </button>
            </div>
          )}
        </Modal>
      )}
    </>
  );
}
