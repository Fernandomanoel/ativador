"use client";

import { useStore } from "@/lib/store";
import { bookById } from "@/lib/selectors";
import type { Book, Post } from "@/lib/types";
import { cx } from "@/lib/util";
import { Cover } from "./Cover";
import { Spine } from "./Spine";

const TONES = [
  ["#3a2a20", "#7b5a43"],
  ["#2d1e2f", "#c06c84"],
  ["#1b2a33", "#5e8a9a"],
  ["#4a3b22", "#d4a373"],
  ["#2b2f24", "#8a9a5b"],
  ["#1d1d2b", "#6c63ff"],
  ["#33261d", "#bc8a5f"],
  ["#2a2626", "#a3a3a3"],
  ["#20302a", "#84a98c"],
  ["#3b1f2b", "#e5989b"],
];

/** Foto da publicação. Fotos enviadas aparecem como imagem; as de exemplo são cenas ilustradas. */
export function PostImage({ post, className }: { post: Post; className?: string }) {
  const { state } = useStore();
  if (post.image) {
    return (
      <div className={cx("post-image", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={post.image} alt={post.caption || "Foto"} />
      </div>
    );
  }
  const scene = post.scene ?? { kind: "flatlay" as const, tone: 0, bookIds: post.bookId ? [post.bookId] : [] };
  const books = (scene.bookIds ?? []).map((id) => bookById(state, id)).filter(Boolean) as Book[];
  const [a, b] = TONES[scene.tone % TONES.length];
  return (
    <div className={cx("post-image", "scene", `scene-${scene.kind}`, className)} style={{ ["--s-a" as string]: a, ["--s-b" as string]: b }} role="img" aria-label={post.caption}>
      {scene.kind === "flatlay" && books[0] && (
        <>
          <span className="prop-mug" />
          <span className="prop-leaf" />
          <span className="prop-pencil" />
          <div className="flat-book">
            <Cover book={books[0]} size="lg" />
          </div>
        </>
      )}
      {scene.kind === "stack" && (
        <div className="stack">
          {books.map((bk) => (
            <Spine key={bk.id} book={bk} horizontal />
          ))}
        </div>
      )}
      {scene.kind === "shelf" && (
        <div className="scene-shelf">
          <div className="scene-shelf-row">
            {books.map((bk) => (
              <Spine key={bk.id} book={bk} />
            ))}
            <span className="prop-plant" />
          </div>
          <div className="scene-shelf-board" />
        </div>
      )}
      {scene.kind === "quote" && (
        <div className="quote-card">
          <p>“{scene.text}”</p>
          {books[0] && (
            <span className="quote-src">
              — {books[0].author}, <em>{books[0].title}</em>
            </span>
          )}
        </div>
      )}
      {scene.kind === "open" && (
        <div className="open-book">
          <div className="page left">
            {Array.from({ length: 11 }).map((_, i) => (
              <span key={i} className="line" style={{ width: `${70 + ((i * 37) % 30)}%` }} />
            ))}
          </div>
          <div className="page right">
            {Array.from({ length: 4 }).map((_, i) => (
              <span key={i} className="line" style={{ width: `${75 + ((i * 23) % 25)}%` }} />
            ))}
            <span className="highlight">{scene.text}</span>
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className="line" style={{ width: `${65 + ((i * 41) % 35)}%` }} />
            ))}
            <span className="margin-note">!!</span>
          </div>
          <span className="prop-pencil" />
        </div>
      )}
    </div>
  );
}
