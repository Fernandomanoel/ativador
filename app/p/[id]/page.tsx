"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { FollowControls } from "@/components/FollowControls";
import { IconHeart, IconLock, IconTrash } from "@/components/Icons";
import { PostImage } from "@/components/PostImage";
import { CommentForm, CommentLine, LikeLine } from "@/components/PostCard";
import { bookById, canSeePosts, userById } from "@/lib/selectors";
import { useStore } from "@/lib/store";
import { longDate, timeAgo } from "@/lib/util";

export default function PostPage() {
  const { id } = useParams<{ id: string }>();
  const { state, me, actions } = useStore();
  const router = useRouter();
  const post = state.posts.find((p) => p.id === id);
  const author = post ? userById(state, post.authorId) : undefined;

  if (!post || !author) {
    return (
      <div className="empty narrow">
        <h1>Publicação não encontrada</h1>
        <Link href="/" className="btn btn-primary">
          Voltar ao feed
        </Link>
      </div>
    );
  }

  if (!canSeePosts(state, me.id, author)) {
    return (
      <div className="private-wall narrow">
        <span className="private-icon">
          <IconLock size={34} />
        </span>
        <h2>Publicação de conta privada</h2>
        <p className="muted">Siga @{author.username} para ver.</p>
        <FollowControls user={author} />
      </div>
    );
  }

  const book = bookById(state, post.bookId);
  const liked = post.likes.includes(me.id);

  return (
    <div className="post-detail">
      <div className="post-detail-media" onDoubleClick={() => !liked && actions.togglePostLike(post.id)}>
        <PostImage post={post} />
      </div>
      <div className="post-detail-side">
        <header className="post-head">
          <Link href={`/u/${author.username}`}>
            <Avatar user={author} size={36} ring />
          </Link>
          <div className="post-head-text">
            <Link href={`/u/${author.username}`} className="strong">
              {author.username}
            </Link>
            {book && (
              <Link href={`/livro/${book.id}`} className="post-book">
                📖 {book.title}
              </Link>
            )}
          </div>
          {author.id === me.id ? (
            <button
              className="icon-btn"
              aria-label="Apagar publicação"
              onClick={() => {
                if (!confirm("Apagar esta publicação?")) return;
                actions.deletePost(post.id);
                router.push(`/u/${me.username}`);
              }}
            >
              <IconTrash size={18} />
            </button>
          ) : (
            <FollowControls user={author} compact />
          )}
        </header>

        <div className="post-detail-comments">
          {post.caption && (
            <div className="comment-row">
              <Avatar user={author} size={28} />
              <CommentLine c={{ id: "caption", authorId: author.id, body: post.caption, createdAt: post.createdAt }} />
            </div>
          )}
          {post.comments.map((c) => {
            const u = userById(state, c.authorId);
            return (
              <div key={c.id} className="comment-row">
                {u && <Avatar user={u} size={28} />}
                <div>
                  <CommentLine c={c} />
                  <span className="muted small">{timeAgo(c.createdAt)}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="post-detail-foot">
          <div className="post-actions">
            <button className={liked ? "icon-btn liked" : "icon-btn"} onClick={() => actions.togglePostLike(post.id)} aria-pressed={liked} aria-label="Curtir">
              <IconHeart filled={liked} size={26} />
            </button>
          </div>
          <LikeLine likes={post.likes} />
          <p className="muted small">{longDate(post.createdAt)}</p>
          <CommentForm onSubmit={(b) => actions.addPostComment(post.id, b)} />
        </div>
      </div>
    </div>
  );
}
