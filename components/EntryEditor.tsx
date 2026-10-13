"use client";

import { useState } from "react";
import { FORMATS, LABELS, STATUSES } from "@/lib/constants";
import type { Entry, Format, Status } from "@/lib/types";
import { cx } from "@/lib/util";
import { StarInput } from "./Stars";

export type EntryDraft = Pick<Entry, "status" | "format" | "labels" | "rating" | "review" | "favorite" | "spoiler" | "finishedAt">;

export const emptyDraft = (): EntryDraft => ({
  status: "lido",
  format: "fisico",
  labels: [],
  rating: undefined,
  review: "",
  favorite: false,
  spoiler: false,
  finishedAt: new Date().toISOString(),
});

export const draftOf = (e: Entry): EntryDraft => ({
  status: e.status,
  format: e.format,
  labels: e.labels,
  rating: e.rating,
  review: e.review,
  favorite: e.favorite,
  spoiler: e.spoiler,
  finishedAt: e.finishedAt,
});

/** Formulário de livro na estante: status, formato, rótulos, nota, resenha. */
export function EntryEditor({ initial, submitLabel, onSubmit, onCancel }: { initial: EntryDraft; submitLabel: string; onSubmit: (d: EntryDraft) => void; onCancel?: () => void }) {
  const [d, setD] = useState<EntryDraft>(initial);
  const set = <K extends keyof EntryDraft>(k: K, v: EntryDraft[K]) => setD((x) => ({ ...x, [k]: v }));
  const toggleLabel = (l: string) => set("labels", d.labels.includes(l) ? d.labels.filter((x) => x !== l) : [...d.labels, l]);

  return (
    <form
      className="entry-editor"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ ...d, finishedAt: d.status === "lido" ? d.finishedAt ?? new Date().toISOString() : undefined });
      }}
    >
      <fieldset>
        <legend>Status</legend>
        <div className="seg seg-full">
          {STATUSES.map((s) => (
            <button type="button" key={s.id} className={cx(d.status === s.id && "on")} onClick={() => set("status", s.id as Status)}>
              {s.label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>Formato</legend>
        <div className="seg seg-full">
          {FORMATS.map((f) => (
            <button type="button" key={f.id} className={cx(d.format === f.id && "on")} onClick={() => set("format", f.id as Format)}>
              {f.icon} {f.label}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="editor-row">
        <fieldset>
          <legend>Nota</legend>
          <StarInput value={d.rating} onChange={(v) => set("rating", v)} />
        </fieldset>
        <fieldset>
          <legend>Favorito</legend>
          <label className="toggle">
            <input type="checkbox" checked={d.favorite} onChange={(e) => set("favorite", e.target.checked)} />
            <span className="toggle-ui" /> Entre os favoritos
          </label>
        </fieldset>
        {d.status === "lido" && (
          <fieldset>
            <legend>Terminei em</legend>
            <input
              type="date"
              value={(d.finishedAt ?? new Date().toISOString()).slice(0, 10)}
              onChange={(e) => set("finishedAt", e.target.value ? new Date(e.target.value + "T12:00:00").toISOString() : undefined)}
            />
          </fieldset>
        )}
      </div>

      <fieldset>
        <legend>Rótulos</legend>
        <div className="chips wrap">
          {LABELS.map((l) => (
            <button type="button" key={l} className={cx("chip chip-label", d.labels.includes(l) && "on")} onClick={() => toggleLabel(l)} aria-pressed={d.labels.includes(l)}>
              #{l}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="field">
        <span className="field-label">Resenha</span>
        <textarea rows={6} value={d.review} onChange={(e) => set("review", e.target.value)} placeholder="O que esse livro fez com você?" maxLength={5000} />
      </label>
      <label className="toggle">
        <input type="checkbox" checked={d.spoiler} onChange={(e) => set("spoiler", e.target.checked)} />
        <span className="toggle-ui" /> Contém spoilers
      </label>

      <div className="modal-actions">
        {onCancel && (
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancelar
          </button>
        )}
        <button type="submit" className="btn btn-primary">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
