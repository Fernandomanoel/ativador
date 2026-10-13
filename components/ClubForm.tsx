"use client";

import { useState } from "react";
import { CLUB_ACCESS, CLUB_AREAS, CLUB_FOCUS, CLUB_MAX, SPOILER_POLICIES } from "@/lib/constants";
import { useStore } from "@/lib/store";
import type { ClubInput } from "@/lib/store";
import type { ClubFocus } from "@/lib/types";
import { cx } from "@/lib/util";
import { CLUB_TONES } from "./ClubParts";
import { CoverPicker } from "./CoverPicker";

export const emptyClub = (): ClubInput => ({
  name: "",
  description: "",
  rules: "",
  focus: "geral",
  access: "aprovacao",
  spoilerPolicy: "marcados",
  maxMembers: 30,
  areas: CLUB_FOCUS[0].areas,
  bookId: undefined,
  tone: 0,
});

/** Formulário de criação e configuração do clube. */
export function ClubForm({ initial, minMembers = 2, submitLabel, onSubmit }: { initial: ClubInput; minMembers?: number; submitLabel: string; onSubmit: (c: ClubInput) => string | null }) {
  const { state } = useStore();
  const [c, setC] = useState<ClubInput>(initial);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof ClubInput>(k: K, v: ClubInput[K]) => setC((x) => ({ ...x, [k]: v }));

  const pickFocus = (focus: ClubFocus) => {
    const f = CLUB_FOCUS.find((x) => x.id === focus)!;
    // Ao trocar o foco, sugere as áreas e a política de spoiler daquele tipo de clube.
    setC((x) => ({ ...x, focus, areas: f.areas, spoilerPolicy: f.spoiler }));
  };

  return (
    <form
      className="club-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (!c.name.trim()) return setError("Dê um nome ao clube.");
        if (!c.areas.length) return setError("Ative pelo menos uma área.");
        const err = onSubmit({ ...c, name: c.name.trim(), description: c.description.trim(), rules: c.rules.trim() });
        if (err) setError(err);
      }}
    >
      <label className="field">
        <span className="field-label">Nome do clube</span>
        <input value={c.name} maxLength={60} onChange={(e) => set("name", e.target.value)} placeholder="Ex.: Clube da Clarice" />
      </label>
      <label className="field">
        <span className="field-label">Descrição</span>
        <textarea rows={2} maxLength={300} value={c.description} onChange={(e) => set("description", e.target.value)} placeholder="Sobre o que é o clube?" />
      </label>

      <CoverPicker
        label="Capa do clube"
        value={c.cover}
        onChange={(cover) => set("cover", cover)}
        fallback={`linear-gradient(120deg, ${CLUB_TONES[c.tone % CLUB_TONES.length][0]}, ${CLUB_TONES[c.tone % CLUB_TONES.length][1]})`}
      />

      <fieldset>
        <legend>Cor {c.cover && <span className="muted small">(usada no selo e quando não há capa)</span>}</legend>
        <div className="tone-row">
          {CLUB_TONES.map(([a, b], i) => (
            <button
              type="button"
              key={i}
              className={cx("tone", c.tone === i && "on")}
              style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}
              onClick={() => set("tone", i)}
              aria-label={`Cor ${i + 1}`}
            />
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>Foco do clube</legend>
        <div className="chips wrap">
          {CLUB_FOCUS.map((f) => (
            <button type="button" key={f.id} className={cx("chip", c.focus === f.id && "on")} onClick={() => pickFocus(f.id)}>
              {f.label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>Leitura do mês</legend>
        <select value={c.bookId ?? ""} onChange={(e) => set("bookId", e.target.value || undefined)}>
          <option value="">Nenhuma por enquanto</option>
          {[...state.books]
            .sort((a, b) => a.title.localeCompare(b.title, "pt-BR"))
            .map((b) => (
              <option key={b.id} value={b.id}>
                {b.title} — {b.author}
              </option>
            ))}
        </select>
      </fieldset>

      <fieldset>
        <legend>Áreas do clube</legend>
        <div className="area-toggles">
          {CLUB_AREAS.map((a) => {
            const on = c.areas.includes(a.id);
            return (
              <label key={a.id} className={cx("area-toggle", on && "on")}>
                <input type="checkbox" checked={on} onChange={() => set("areas", on ? c.areas.filter((x) => x !== a.id) : [...c.areas, a.id])} />
                <span className="area-icon">{a.icon}</span>
                <span>
                  <strong>{a.label}</strong>
                  <span className="muted small block">{a.hint}</span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend>Spoilers</legend>
        <div className="radio-cards">
          {SPOILER_POLICIES.map((p) => (
            <label key={p.id} className={cx("radio-card", c.spoilerPolicy === p.id && "on")}>
              <input type="radio" name="spoiler" checked={c.spoilerPolicy === p.id} onChange={() => set("spoilerPolicy", p.id)} />
              <strong>{p.label}</strong>
              <span className="muted small">{p.hint}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>Entrada</legend>
        <div className="radio-cards two">
          {CLUB_ACCESS.map((p) => (
            <label key={p.id} className={cx("radio-card", c.access === p.id && "on")}>
              <input type="radio" name="access" checked={c.access === p.id} onChange={() => set("access", p.id)} />
              <strong>{p.label}</strong>
              <span className="muted small">{p.hint}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>
          Limite de membros: <strong className="limit-value">{c.maxMembers}</strong> de no máximo {CLUB_MAX}
        </legend>
        <input type="range" min={Math.max(2, minMembers)} max={CLUB_MAX} value={c.maxMembers} onChange={(e) => set("maxMembers", Number(e.target.value))} aria-label="Limite de membros" />
        <span className="muted small">Grupos pequenos mantêm a conversa sob controle. O limite nunca passa de {CLUB_MAX}.</span>
      </fieldset>

      <label className="field">
        <span className="field-label">Regras do clube</span>
        <textarea rows={3} maxLength={1000} value={c.rules} onChange={(e) => set("rules", e.target.value)} placeholder="Combinados, prazos, etiqueta…" />
      </label>

      {error && <p className="form-error">{error}</p>}
      <div className="modal-actions">
        <button type="submit" className="btn btn-primary">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
