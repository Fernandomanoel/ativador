"use client";

import { useState } from "react";
import type { Book } from "@/lib/types";
import { cx, hash } from "@/lib/util";

const PALETTE: [string, string][] = [
  ["#1f3a5f", "#f2e8cf"],
  ["#7a2e2e", "#f6e7d7"],
  ["#5e3a6e", "#f1e9da"],
  ["#c9a227", "#1b1b1b"],
  ["#3b2f4a", "#efd9c3"],
  ["#d96c4f", "#fff4e6"],
  ["#1b4965", "#fbe8a6"],
  ["#5c3d2e", "#f3e1c7"],
  ["#2b3a67", "#e9c46a"],
  ["#8d99ae", "#1d2433"],
  ["#a0522d", "#f7f3e3"],
  ["#b56576", "#fff1e6"],
  ["#14213d", "#fca311"],
  ["#e5989b", "#2b2d42"],
  ["#e9e3d5", "#7a2e2e"],
  ["#222222", "#e0c097"],
];

export function bookColors(book: Pick<Book, "title" | "author">) {
  return PALETTE[hash(book.title + book.author) % PALETTE.length];
}

/** Capa: usa a imagem real quando existe; senão, gera uma capa tipográfica. */
export function Cover({ book, className, size = "md" }: { book: Book; className?: string; size?: "xs" | "sm" | "md" | "lg" }) {
  const [broken, setBroken] = useState(false);
  const [bg, fg] = bookColors(book);
  const variant = hash(book.id + book.title) % 4;
  return (
    <div className={cx("cover", `cover-${size}`, className)} style={{ ["--c-bg" as string]: bg, ["--c-fg" as string]: fg }} title={`${book.title} — ${book.author}`}>
      <div className={cx("cover-art", `v${variant}`)} aria-hidden>
        <span className="cover-orn" />
        <span className="cover-title">{book.title}</span>
        <span className="cover-author">{book.author}</span>
      </div>
      {book.coverUrl && !broken && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={book.coverUrl} alt="" loading="lazy" onError={() => setBroken(true)} />
      )}
      <span className="sr-only">{book.title}</span>
    </div>
  );
}
