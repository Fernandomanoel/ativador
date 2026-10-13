"use client";

import Link from "next/link";
import { useState } from "react";
import { statusLabel } from "@/lib/constants";
import { bookById, userById } from "@/lib/selectors";
import { useStore } from "@/lib/store";
import type { Entry } from "@/lib/types";
import { cx, timeAgo } from "@/lib/util";
import { Avatar } from "./Avatar";
import { Cover } from "./Cover";
import { IconComment, IconHeart } from "./Icons";
import { Stars } from "./Stars";

/** Resenha no estilo Letterboxd: capa à esquerda, nota em estrelas e texto. */
export function ReviewCard({ entry, showUser = true, clamp = true }: { entry: Entry; showUser?: boolean; clamp?: boolean }) {
  const { state, me, actions } = useStore();
  const [reveal, setReveal] = useState(false);
  const user = userById(state, entry.userId);
  const book = bookById(state, entry.bookId);
  if (!user || !book) return null;
  const liked = entry.likes.includes(me.id);
  const href = `/u/${user.username}/livro/${book.id}`;

  return (
    <article className="review-card">
      <Link href={href} className="review-cover">
        <Cover book={book} size="sm" />
      </Link>
      <div className="review-main">
        {showUser && (
          <div className="review-by">
            <Avatar user={user} size={22} />
            <span className="muted">
              Resenha de{" "}
              <Link href={`/u/${user.username}`} className="strong">
                {user.name}
              </Link>
            </span>
          </div>
        )}
        <h3 className="review-title">
          <Link href={href}>{book.title}</Link> <span className="muted year">{book.year}</span>
        </h3>
        <div className="review-meta">
          <Stars value={entry.rating} size={13} />
          {entry.favorite && <IconHeart filled size={13} className="fav-heart" aria-label="Favorito" />}
          <span className="muted small">
            {statusLabel(entry.status)} · {timeAgo(entry.updatedAt)}
          </span>
        </div>
        {entry.review &&
          (entry.spoiler && !reveal ? (
            <p className="review-text spoiler">
              Esta resenha tem spoilers.{" "}
              <button className="link-btn" onClick={() => setReveal(true)}>
                Mostrar mesmo assim
              </button>
            </p>
          ) : (
            <p className={cx("review-text", clamp && "clamp")}>{entry.review}</p>
          ))}
        <div className="review-foot">
          <button className={liked ? "chip-btn liked" : "chip-btn"} onClick={() => actions.toggleReviewLike(entry.id)} aria-pressed={liked}>
            <IconHeart filled={liked} size={14} /> {entry.likes.length || ""} {liked ? "Curtida" : "Curtir"}
          </button>
          <Link href={href} className="chip-btn">
            <IconComment size={14} /> {entry.comments.length || ""}
          </Link>
          {entry.notes.length > 0 && (
            <Link href={href} className="muted small">
              {entry.notes.length} {entry.notes.length === 1 ? "anotação" : "anotações"}
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
