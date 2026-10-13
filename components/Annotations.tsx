"use client";

import { useState } from "react";
import { visibleNotes } from "@/lib/selectors";
import { useStore } from "@/lib/store";
import type { Annotation, Entry } from "@/lib/types";
import { cx } from "@/lib/util";
import { IconLock, IconQuote, IconTrash } from "./Icons";

export function AnnotationItem({ entry, n, compact }: { entry: Entry; n: Annotation; compact?: boolean }) {
  const { me, actions } = useStore();
  const isMe = entry.userId === me.id;
  return (
    <li className={cx("annotation", n.isPrivate && "is-private", compact && "compact")}>
      <span className="annotation-page">{n.page ? `p. ${n.page}` : "—"}</span>
      <div>
        {n.quote && (
          <blockquote>
            <IconQuote size={14} /> {n.quote}
          </blockquote>
        )}
        {n.body && <p>{n.body}</p>}
        {isMe && (
          <button className={cx("privacy-chip", n.isPrivate && "private")} onClick={() => actions.toggleAnnotationPrivacy(entry.id, n.id)} title="Alternar visibilidade">
            {n.isPrivate ? (
              <>
                <IconLock size={11} /> Só eu
              </>
            ) : (
              "🌐 Pública"
            )}
          </button>
        )}
      </div>
      {isMe && (
        <button className="icon-btn" aria-label="Apagar anotação" onClick={() => confirm("Apagar esta anotação?") && actions.removeAnnotation(entry.id, n.id)}>
          <IconTrash size={16} />
        </button>
      )}
    </li>
  );
}

export function AnnotationList({ entry, limit }: { entry: Entry; limit?: number }) {
  const { me } = useStore();
  const notes = [...visibleNotes(entry, me.id)].sort((a, b) => (b.page ?? 0) - (a.page ?? 0));
  const shown = limit ? notes.slice(0, limit) : notes.sort((a, b) => (a.page ?? 1e9) - (b.page ?? 1e9));
  if (!shown.length) return null;
  return (
    <ol className="annotations">
      {shown.map((n) => (
        <AnnotationItem key={n.id} entry={entry} n={n} compact={!!limit} />
      ))}
    </ol>
  );
}

/** Formulário de anotação com escolha de visibilidade (pública ou só eu). */
export function AnnotationForm({ entry }: { entry: Entry }) {
  const { me, actions } = useStore();
  const [note, setNote] = useState({ page: entry.progress ? String(entry.progress) : "", quote: "", body: "" });
  const [isPrivate, setPrivate] = useState(me.isPrivate);
  return (
    <form
      className="annotation-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (!note.quote.trim() && !note.body.trim()) return;
        actions.addAnnotation(entry.id, { page: note.page ? Number(note.page) : undefined, quote: note.quote.trim(), body: note.body.trim(), isPrivate });
        actions.toast(isPrivate ? "Nota guardada só para você" : "Nota publicada");
        setNote({ page: note.page, quote: "", body: "" });
      }}
    >
      <div className="annotation-form-row">
        <input type="number" min={1} placeholder="Pág." value={note.page} onChange={(e) => setNote({ ...note, page: e.target.value })} aria-label="Página" />
        <input placeholder="Trecho do livro (opcional)" value={note.quote} onChange={(e) => setNote({ ...note, quote: e.target.value })} aria-label="Trecho" />
      </div>
      <textarea rows={2} placeholder="Sua nota de leitura…" value={note.body} onChange={(e) => setNote({ ...note, body: e.target.value })} aria-label="Nota" />
      <div className="annotation-form-foot">
        <div className="seg" role="radiogroup" aria-label="Visibilidade da nota">
          <button type="button" role="radio" aria-checked={!isPrivate} className={cx(!isPrivate && "on")} onClick={() => setPrivate(false)}>
            🌐 Pública
          </button>
          <button type="button" role="radio" aria-checked={isPrivate} className={cx(isPrivate && "on")} onClick={() => setPrivate(true)}>
            <IconLock size={12} /> Só eu
          </button>
        </div>
        <button className="btn btn-primary btn-sm" type="submit">
          Guardar nota
        </button>
      </div>
    </form>
  );
}
