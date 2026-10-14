"use client";

import Link from "next/link";
import { useState } from "react";
import { bookById, entryFor, userById } from "@/lib/selectors";
import { useStore } from "@/lib/store";
import type { Comment, Post } from "@/lib/types";
import { plural, timeAgo } from "@/lib/util";
import { Avatar } from "./Avatar";
import { IconComment, IconHeart, IconTrash } from "./Icons";
import { PostImage } from "./PostImage";
import { Stars } from "./Stars";

export function CommentLine({ c }: { c: Comment }) {
  const { state } = useStore();
  const author = userById(state, c.authorId);
  if (!author) return null;
  return (
    <p className="comment-line">
      <Link href={`/u/${author.username}`} className="strong">
        {author.username}
      </Link>{" "}
      {c.body}
    </p>
  );
}

export function CommentForm({ onSubmit, placeholder = "Adicione um comentário…" }: { onSubmit: (body: string) => void; placeholder?: string }) {
  const [text, setText] = useState("");
  return (
    <form
      className="comment-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (!text.trim()) return;
        onSubmit(text);
        setText("");
      }}
    >
      <input value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder} maxLength={500} aria-label={placeholder} />
      <button type="submit" className="link-btn" disabled={!text.trim()}>
        Publicar
      </button>
    </form>
  );
}

export function LikeLine({ likes }: { likes: string[] }) {
  const { state, me } = useStore();
  if (!likes.length) return <p className="likes muted">Seja a primeira pessoa a curtir</p>;
  const first = userById(state, likes.find((id) => id !== me.id) ?? likes[0]);
  const others = likes.length - 1;
  return (
    <p className="likes">
      Curtido por <strong>{first?.id === me.id ? "você" : first?.username}</strong>
      {others > 0 && (
        <>
          {" "}e <strong>{plural(others, "outra pessoa", "outras pessoas")}</strong>
        </>
      )}
    </p>
  );
}

export function PostCard({ post }: { post: Post }) {
  const { state, me, actions } = useStore();
  const [burst, setBurst] = useState(false);
  const author = userById(state, post.authorId);
  const book = bookById(state, post.bookId);
  if (!author) return null;
  const liked = post.likes.includes(me.id);
  const authorEntry = book ? entryFor(state, author.id, book.id) : undefined;

  const like = () => {
    if (!liked) {
      setBurst(true);
      setTimeout(() => setBurst(false), 700);
    }
    actions.togglePostLike(post.id);
  };

  return (
    <article className="post-card">
      <header className="post-head">
        <Link href={`/u/${author.username}`}>
          <Avatar user={author} size={36} ring />
        </Link>
        <div className="post-head-text">
          <span>
            <Link href={`/u/${author.username}`} className="strong">
              {author.username}
            </Link>
            <span className="muted"> · {timeAgo(post.createdAt)}</span>
          </span>
          {book && (
            <Link href={`/livro/${book.id}`} className="post-book">
              📖 {book.title}
              {authorEntry?.rating ? <Stars value={authorEntry.rating} size={11} /> : null}
            </Link>
          )}
        </div>
        {author.id === me.id && (
          <button className="icon-btn" aria-label="Apagar publicação" onClick={() => confirm("Apagar esta publicação?") && actions.deletePost(post.id)}>
            <IconTrash size={18} />
          </button>
        )}
      </header>

      <div className="post-media" onDoubleClick={() => !liked && like()}>
        <PostImage post={post} />
        {burst && <IconHeart filled size={96} className="heart-burst" />}
      </div>

      <div className="post-actions">
        <button className={liked ? "icon-btn liked" : "icon-btn"} onClick={like} aria-label={liked ? "Descurtir" : "Curtir"} aria-pressed={liked}>
          <IconHeart filled={liked} size={26} />
        </button>
        <Link href={`/p/${post.id}`} className="icon-btn" aria-label="Comentar">
          <IconComment size={25} />
        </Link>
      </div>

      <div className="post-body">
        <LikeLine likes={post.likes} />
        {post.caption && (
          <p className="caption">
            <Link href={`/u/${author.username}`} className="strong">
              {author.username}
            </Link>{" "}
            {post.caption}
          </p>
        )}
        {post.comments.length > 2 && (
          <Link href={`/p/${post.id}`} className="muted small">
            Ver todos os {post.comments.length} comentários
          </Link>
        )}
        {post.comments.slice(-2).map((c) => (
          <CommentLine key={c.id} c={c} />
        ))}
        <CommentForm onSubmit={(b) => actions.addPostComment(post.id, b)} />
      </div>
    </article>
  );
}
