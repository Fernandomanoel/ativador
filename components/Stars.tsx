"use client";

import { useState } from "react";
import { cx } from "@/lib/util";

const Star = ({ fill }: { fill: 0 | 0.5 | 1 }) => (
  <span className="star" data-fill={fill}>
    <span className="star-bg">★</span>
    <span className="star-fg" style={{ width: `${fill * 100}%` }}>★</span>
  </span>
);

/** Nota de 1 a 10 (meias estrelas), exibida em 5 estrelas — estilo Letterboxd. */
export function Stars({ value, size = 14, className }: { value?: number; size?: number; className?: string }) {
  if (!value) return null;
  return (
    <span className={cx("stars", className)} style={{ fontSize: size }} aria-label={`${(value / 2).toLocaleString("pt-BR")} de 5 estrelas`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} fill={value >= i * 2 ? 1 : value === i * 2 - 1 ? 0.5 : 0} />
      ))}
    </span>
  );
}

export function StarInput({ value, onChange, size = 30 }: { value?: number; onChange: (v: number | undefined) => void; size?: number }) {
  const [hover, setHover] = useState<number | undefined>();
  const shown = hover ?? value ?? 0;
  return (
    <div className="star-input" style={{ fontSize: size }} onMouseLeave={() => setHover(undefined)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className="star-slot">
          <Star fill={shown >= i * 2 ? 1 : shown === i * 2 - 1 ? 0.5 : 0} />
          <button type="button" className="half left" aria-label={`${i - 0.5} estrelas`} onMouseEnter={() => setHover(i * 2 - 1)} onClick={() => onChange(i * 2 - 1)} />
          <button type="button" className="half right" aria-label={`${i} estrelas`} onMouseEnter={() => setHover(i * 2)} onClick={() => onChange(i * 2)} />
        </span>
      ))}
      {value ? (
        <button type="button" className="star-clear" onClick={() => onChange(undefined)} aria-label="Limpar nota">
          ×
        </button>
      ) : null}
    </div>
  );
}
