"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { canSeePosts, followersOf, followingOf, userById, userByUsername } from "@/lib/selectors";
import { useStore } from "@/lib/store";
import { FollowControls } from "./FollowControls";
import { IconLock } from "./Icons";
import { UserLink } from "./UserLink";

export function PeopleList({ kind }: { kind: "seguidores" | "seguindo" }) {
  const { username } = useParams<{ username: string }>();
  const { state, me, actions } = useStore();
  const user = userByUsername(state, username);
  if (!user) return <div className="empty narrow">Leitor não encontrado.</div>;

  if (!canSeePosts(state, me.id, user)) {
    return (
      <div className="private-wall narrow">
        <span className="private-icon">
          <IconLock size={34} />
        </span>
        <h2>Lista privada</h2>
        <p className="muted">Só seguidores aprovados de @{user.username} veem quem segue e é seguido.</p>
        <Link href={`/u/${user.username}`} className="btn btn-secondary">
          Voltar ao perfil
        </Link>
      </div>
    );
  }

  const ids = kind === "seguidores" ? followersOf(state, user.id) : followingOf(state, user.id);
  return (
    <div className="narrow">
      <Link href={`/u/${user.username}`} className="link-btn">
        ← @{user.username}
      </Link>
      <h1 className="page-title">{kind === "seguidores" ? "Seguidores" : "Seguindo"}</h1>
      <ul className="people">
        {ids.length === 0 && <li className="muted">Ninguém por aqui ainda.</li>}
        {ids.map((id) => {
          const u = userById(state, id);
          if (!u) return null;
          return (
            <li key={id}>
              <UserLink user={u} avatar={44} sub={u.name} />
              <div className="people-actions">
                {user.id === me.id && kind === "seguidores" && (
                  <button className="btn btn-ghost btn-sm" onClick={() => confirm(`Remover @${u.username} dos seus seguidores?`) && actions.removeFollower(u.id)}>
                    Remover
                  </button>
                )}
                <FollowControls user={u} compact />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
