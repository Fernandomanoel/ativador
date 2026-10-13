"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Avatar } from "@/components/Avatar";
import { Cover } from "@/components/Cover";
import { FollowControls } from "@/components/FollowControls";
import { IconBook, IconComment, IconGrid, IconHeart, IconLock, IconPen, IconShelf } from "@/components/Icons";
import { PostImage } from "@/components/PostImage";
import { ReadingCard } from "@/components/ReadingCard";
import { ReviewCard } from "@/components/ReviewCard";
import { Shelf } from "@/components/Shelf";
import { Stars } from "@/components/Stars";
import { bookById, canSeePosts, entriesOf, followersOf, followingOf, isFollowing, readingNow, userByUsername } from "@/lib/selectors";
import { useStore } from "@/lib/store";
import { cx } from "@/lib/util";

type Tab = "estante" | "lendo" | "fotos" | "resenhas";

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { state, me } = useStore();
  const [tab, setTab] = useState<Tab>("estante");
  const user = userByUsername(state, username);

  if (!user) {
    return (
      <div className="empty narrow">
        <h1>Leitor não encontrado</h1>
        <p className="muted">O perfil @{decodeURIComponent(username)} não existe.</p>
        <Link href="/explorar" className="btn btn-primary">
          Explorar leitores
        </Link>
      </div>
    );
  }

  const isMe = user.id === me.id;
  const seePosts = canSeePosts(state, me.id, user);
  const entries = entriesOf(state, user.id);
  const posts = state.posts.filter((p) => p.authorId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const reviews = entries.filter((e) => e.review).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const favorites = entries.filter((e) => e.favorite).sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 4);
  const year = new Date().getFullYear();
  const readThisYear = entries.filter((e) => e.status === "lido" && e.finishedAt && new Date(e.finishedAt).getFullYear() === year).length;
  const followsMe = isFollowing(state, user.id, me.id) && !isMe;
  const reading = readingNow(state, user.id);

  return (
    <div className="profile">
      <header className="profile-head">
        <div className="profile-avatar">
          <Avatar user={user} size={150} ring />
        </div>
        <div className="profile-info">
          <div className="profile-row">
            <h1 className="profile-username">
              {user.username}
              {user.isPrivate && <IconLock size={18} aria-label="Conta privada" />}
            </h1>
            <FollowControls user={user} />
          </div>
          <ul className="profile-counts">
            <li>
              <strong>{entries.filter((e) => e.status === "lido").length}</strong> livros
            </li>
            <li>
              <strong>{seePosts ? posts.length : "—"}</strong> fotos
            </li>
            <li>
              {seePosts ? (
                <Link href={`/u/${user.username}/seguidores`}>
                  <strong>{followersOf(state, user.id).length}</strong> seguidores
                </Link>
              ) : (
                <span>
                  <strong>{followersOf(state, user.id).length}</strong> seguidores
                </span>
              )}
            </li>
            <li>
              {seePosts ? (
                <Link href={`/u/${user.username}/seguindo`}>
                  <strong>{followingOf(state, user.id).length}</strong> seguindo
                </Link>
              ) : (
                <span>
                  <strong>{followingOf(state, user.id).length}</strong> seguindo
                </span>
              )}
            </li>
          </ul>
          <p className="profile-name">
            {user.name} {followsMe && <span className="pill">Segue você</span>}
          </p>
          {user.bio && <p className="profile-bio">{user.bio}</p>}
          <p className="profile-stat muted small">
            <strong>{readThisYear}</strong> lidos em {year}
          </p>
        </div>
      </header>

      {favorites.length > 0 && (
        <section className="favorites">
          <h2 className="section-title">Livros favoritos</h2>
          <div className="fav-row">
            {favorites.map((e) => {
              const b = bookById(state, e.bookId)!;
              return (
                <Link key={e.id} href={`/u/${user.username}/livro/${b.id}`} className="fav-item">
                  <Cover book={b} size="md" />
                  <Stars value={e.rating} size={11} />
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <nav className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === "estante"} className={cx(tab === "estante" && "on")} onClick={() => setTab("estante")}>
          <IconShelf size={14} /> Estante
        </button>
        <button role="tab" aria-selected={tab === "lendo"} className={cx(tab === "lendo" && "on")} onClick={() => setTab("lendo")}>
          <IconBook size={14} /> Lendo{reading.length > 0 && <span className="tab-count">{reading.length}</span>}
        </button>
        <button role="tab" aria-selected={tab === "fotos"} className={cx(tab === "fotos" && "on")} onClick={() => setTab("fotos")}>
          {seePosts ? <IconGrid size={14} /> : <IconLock size={14} />} Fotos
        </button>
        <button role="tab" aria-selected={tab === "resenhas"} className={cx(tab === "resenhas" && "on")} onClick={() => setTab("resenhas")}>
          <IconPen size={14} /> Resenhas
        </button>
      </nav>

      {tab === "estante" && <Shelf user={user} />}

      {tab === "lendo" && (
        <section className="reading-tab">
          <p className="hint">
            {isMe
              ? "Suas leituras em andamento. Cada nota pode ser pública (aparece no seu perfil e no feed de quem segue você) ou só sua."
              : `O que ${user.name.split(" ")[0]} está lendo agora, com as notas que decidiu compartilhar.`}
          </p>
          {reading.length === 0 ? (
            <div className="empty">
              <p>Nenhuma leitura em andamento.</p>
              {isMe && (
                <Link href="/estante/adicionar" className="btn btn-primary">
                  Começar uma leitura
                </Link>
              )}
            </div>
          ) : (
            reading.map((e) => <ReadingCard key={e.id} entry={e} />)
          )}
        </section>
      )}

      {tab === "resenhas" &&
        (reviews.length ? (
          <div className="review-list">
            {reviews.map((e) => (
              <ReviewCard key={e.id} entry={e} showUser={false} />
            ))}
          </div>
        ) : (
          <div className="empty">
            <p>Nenhuma resenha ainda.</p>
          </div>
        ))}

      {tab === "fotos" &&
        (!seePosts ? (
          <div className="private-wall">
            <span className="private-icon">
              <IconLock size={34} />
            </span>
            <h2>Esta conta é privada</h2>
            <p className="muted">
              Siga @{user.username} para ver as fotos. A estante, as resenhas e as anotações continuam abertas para todo mundo.
            </p>
            <FollowControls user={user} />
          </div>
        ) : posts.length === 0 ? (
          <div className="empty">
            <p>{isMe ? "Você ainda não publicou fotos." : "Nenhuma foto ainda."}</p>
            {isMe && (
              <Link href="/novo" className="btn btn-primary">
                Publicar primeira foto
              </Link>
            )}
          </div>
        ) : (
          <div className="photo-grid">
            {posts.map((p) => (
              <Link key={p.id} href={`/p/${p.id}`} className="photo-tile">
                <PostImage post={p} />
                <span className="photo-hover">
                  <span>
                    <IconHeart filled size={18} /> {p.likes.length}
                  </span>
                  <span>
                    <IconComment size={18} /> {p.comments.length}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        ))}
    </div>
  );
}
