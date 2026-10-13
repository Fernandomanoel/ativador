"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FORMATS, formatIcon, LABELS, STATUSES, statusLabel } from "@/lib/constants";
import { bookById, entriesOf, visibleNotes } from "@/lib/selectors";
import { useStore } from "@/lib/store";
import type { Entry, Format, Status, User } from "@/lib/types";
import { cx } from "@/lib/util";
import { Cover } from "./Cover";
import { IconArrowLeft, IconArrowRight, IconHeart } from "./Icons";
import { Spine } from "./Spine";
import { Stars } from "./Stars";

type View = "estante" | "lombadas" | "lista";
type Sort = "manual" | "nota" | "recentes" | "titulo" | "autor";

const SORTS: { id: Sort; label: string }[] = [
  { id: "manual", label: "Do meu jeito" },
  { id: "nota", label: "Melhor avaliados" },
  { id: "recentes", label: "Mais recentes" },
  { id: "titulo", label: "Título (A–Z)" },
  { id: "autor", label: "Autor (A–Z)" },
];

export function Shelf({ user }: { user: User }) {
  const { state, me, actions } = useStore();
  const isMe = user.id === me.id;
  const [view, setView] = useState<View>("estante");
  const [sort, setSort] = useState<Sort>("manual");
  const [status, setStatus] = useState<Status | "todos">("todos");
  const [label, setLabel] = useState<string>("");
  const [format, setFormat] = useState<Format | "">("");
  const [organize, setOrganize] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);

  const all = entriesOf(state, user.id);
  const usedLabels = LABELS.filter((l) => all.some((e) => e.labels.includes(l)));

  const shown = useMemo(() => {
    let list = all.filter(
      (e) => (status === "todos" || e.status === status) && (!label || e.labels.includes(label)) && (!format || e.format === format),
    );
    const title = (e: Entry) => bookById(state, e.bookId)?.title ?? "";
    const author = (e: Entry) => bookById(state, e.bookId)?.author ?? "";
    if (sort === "nota") list = [...list].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    if (sort === "recentes") list = [...list].sort((a, b) => (b.finishedAt ?? b.createdAt).localeCompare(a.finishedAt ?? a.createdAt));
    if (sort === "titulo") list = [...list].sort((a, b) => title(a).localeCompare(title(b), "pt-BR"));
    if (sort === "autor") list = [...list].sort((a, b) => author(a).localeCompare(author(b), "pt-BR"));
    return list;
  }, [all, status, label, format, sort, state]);

  const canOrganize = isMe && organize && sort === "manual";

  const moveTo = (id: string, targetId: string, after = false) => {
    if (id === targetId) return;
    const ids = all.map((e) => e.id).filter((x) => x !== id);
    const idx = ids.indexOf(targetId);
    ids.splice(after ? idx + 1 : idx, 0, id);
    actions.reorder(ids);
  };
  const nudge = (id: string, dir: -1 | 1) => {
    const i = shown.findIndex((e) => e.id === id);
    const neighbor = shown[i + dir];
    if (neighbor) moveTo(id, neighbor.id, dir === 1);
  };

  const dragProps = (e: Entry) =>
    canOrganize
      ? {
          draggable: true,
          onDragStart: () => setDragId(e.id),
          onDragEnd: () => setDragId(null),
          onDragOver: (ev: React.DragEvent) => ev.preventDefault(),
          onDrop: (ev: React.DragEvent) => {
            ev.preventDefault();
            if (dragId) moveTo(dragId, e.id);
            setDragId(null);
          },
        }
      : {};

  const counts = {
    lido: all.filter((e) => e.status === "lido").length,
    lendo: all.filter((e) => e.status === "lendo").length,
  };

  return (
    <section className="shelf">
      <div className="shelf-toolbar">
        <div className="seg" role="tablist" aria-label="Visualização">
          {(["estante", "lombadas", "lista"] as View[]).map((v) => (
            <button key={v} role="tab" aria-selected={view === v} className={cx(view === v && "on")} onClick={() => setView(v)}>
              {v === "estante" ? "Capas" : v === "lombadas" ? "Lombadas" : "Diário"}
            </button>
          ))}
        </div>
        <div className="shelf-toolbar-right">
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Ordenar">
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          {isMe && (
            <Link href="/estante/adicionar" className="btn btn-secondary btn-sm">
              + Livro
            </Link>
          )}
          {isMe && (
            <button
              className={cx("btn btn-sm", organize ? "btn-primary" : "btn-secondary")}
              onClick={() => {
                setOrganize((o) => !o);
                setSort("manual");
              }}
            >
              {organize ? "Pronto" : "Organizar"}
            </button>
          )}
        </div>
      </div>

      <div className="chips" role="group" aria-label="Status">
        <button className={cx("chip", status === "todos" && "on")} onClick={() => setStatus("todos")}>
          Todos <span>{all.length}</span>
        </button>
        {STATUSES.map((s) => {
          const n = all.filter((e) => e.status === s.id).length;
          if (!n) return null;
          return (
            <button key={s.id} className={cx("chip", status === s.id && "on")} onClick={() => setStatus(s.id)}>
              {s.label} <span>{n}</span>
            </button>
          );
        })}
        <span className="chip-sep" />
        {FORMATS.map((f) => (
          <button key={f.id} className={cx("chip", format === f.id && "on")} onClick={() => setFormat(format === f.id ? "" : f.id)}>
            {f.icon} {f.label}
          </button>
        ))}
      </div>

      {usedLabels.length > 0 && (
        <div className="chips labels" role="group" aria-label="Rótulos">
          {usedLabels.map((l) => (
            <button key={l} className={cx("chip chip-label", label === l && "on")} onClick={() => setLabel(label === l ? "" : l)}>
              #{l}
            </button>
          ))}
        </div>
      )}

      {canOrganize && <p className="hint">Arraste os livros (ou use as setas) para organizar sua estante do seu jeito.</p>}

      {shown.length === 0 ? (
        <div className="empty">
          <p>Nenhum livro aqui ainda.</p>
          {isMe && (
            <Link href="/estante/adicionar" className="btn btn-primary">
              Adicionar livro
            </Link>
          )}
        </div>
      ) : view === "estante" ? (
        <div className="shelf-grid">
          {shown.map((e, i) => {
            const book = bookById(state, e.bookId)!;
            return (
              <div key={e.id} className={cx("shelf-item", dragId === e.id && "dragging")} {...dragProps(e)}>
                <Link href={`/u/${user.username}/livro/${book.id}`} className="shelf-book" draggable={false}>
                  <Cover book={book} size="md" />
                  {e.status !== "lido" && <span className={cx("ribbon", e.status)}>{statusLabel(e.status)}</span>}
                  {(e.review || visibleNotes(e, me.id).length > 0) && <span className="has-review" title="Tem resenha ou anotações" />}
                </Link>
                <div className="shelf-meta">
                  <Stars value={e.rating} size={10} />
                  {e.favorite && <IconHeart filled size={10} className="fav-heart" />}
                  <span className="fmt" title={e.format}>
                    {formatIcon(e.format)}
                  </span>
                </div>
                {canOrganize && (
                  <div className="nudge">
                    <button onClick={() => nudge(e.id, -1)} disabled={i === 0} aria-label="Mover para a esquerda">
                      <IconArrowLeft size={14} />
                    </button>
                    <button onClick={() => nudge(e.id, 1)} disabled={i === shown.length - 1} aria-label="Mover para a direita">
                      <IconArrowRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : view === "lombadas" ? (
        <div className="spine-shelf">
          {shown.map((e) => {
            const book = bookById(state, e.bookId)!;
            return (
              <div key={e.id} className={cx("spine-slot", dragId === e.id && "dragging")} {...dragProps(e)}>
                <Link href={`/u/${user.username}/livro/${book.id}`} draggable={false}>
                  <Spine book={book} />
                </Link>
              </div>
            );
          })}
        </div>
      ) : (
        <table className="diary">
          <thead>
            <tr>
              <th>Quando</th>
              <th colSpan={2}>Livro</th>
              <th>Nota</th>
              <th className="hide-sm">Formato</th>
              <th className="hide-sm">Rótulos</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((e) => {
              const book = bookById(state, e.bookId)!;
              const d = new Date(e.finishedAt ?? e.createdAt);
              return (
                <tr key={e.id}>
                  <td className="diary-date">
                    <span className="mon">{d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}</span>
                    <span className="day">{d.getDate()}</span>
                  </td>
                  <td className="diary-cover">
                    <Link href={`/u/${user.username}/livro/${book.id}`}>
                      <Cover book={book} size="xs" />
                    </Link>
                  </td>
                  <td>
                    <Link href={`/u/${user.username}/livro/${book.id}`} className="strong">
                      {book.title}
                    </Link>
                    <div className="muted small">
                      {book.author} · {statusLabel(e.status)}
                    </div>
                  </td>
                  <td>
                    <Stars value={e.rating} size={12} /> {e.favorite && <IconHeart filled size={12} className="fav-heart" />}
                  </td>
                  <td className="hide-sm muted small">
                    {formatIcon(e.format)} {FORMATS.find((f) => f.id === e.format)?.label}
                  </td>
                  <td className="hide-sm">
                    <div className="tag-row">
                      {e.labels.map((l) => (
                        <span key={l} className="tag">
                          {l}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <p className="shelf-foot muted small">
        {counts.lido} lidos · {counts.lendo} lendo agora · estante sempre pública
      </p>
    </section>
  );
}
