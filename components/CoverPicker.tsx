"use client";

import { useRef, useState } from "react";
import { cx, isGif, mediaToDataUrl } from "@/lib/util";
import { IconImage } from "./Icons";

/** Escolha de capa (foto ou GIF animado) com pré-visualização. */
export function CoverPicker({
  value,
  onChange,
  label,
  fallback,
  round,
}: {
  value?: string;
  onChange: (v: string | undefined) => void;
  label: string;
  fallback?: string; // fundo quando não há capa (gradiente do clube, por exemplo)
  round?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div className="cover-picker">
      <span className="field-label">{label}</span>
      <button
        type="button"
        className={cx("cover-preview", round && "round", !value && "empty")}
        style={!value && fallback ? { background: fallback } : undefined}
        onClick={() => input.current?.click()}
        aria-label={value ? "Trocar capa" : "Escolher capa"}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" />
        ) : (
          <span className="cover-empty">
            <IconImage size={26} />
            Foto ou GIF
          </span>
        )}
        {isGif(value) && <span className="gif-badge">GIF</span>}
      </button>
      <div className="cover-actions">
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => input.current?.click()} disabled={busy}>
          {busy ? "Carregando…" : value ? "Trocar" : "Escolher foto ou GIF"}
        </button>
        {value && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange(undefined)}>
            Remover
          </button>
        )}
        <span className="muted small">GIFs animados até 1,5 MB.</span>
      </div>
      {error && <p className="form-error">{error}</p>}
      <input
        ref={input}
        type="file"
        accept="image/*"
        hidden
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          setBusy(true);
          setError(null);
          try {
            onChange(await mediaToDataUrl(f, round ? 400 : 1600));
          } catch (err) {
            setError((err as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      />
    </div>
  );
}
