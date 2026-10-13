"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ClubForm } from "@/components/ClubForm";
import { UserLink } from "@/components/UserLink";
import { canModerate, clubById, clubMembersOf, userById } from "@/lib/selectors";
import { useStore } from "@/lib/store";
import { timeAgo } from "@/lib/util";

export default function ClubConfigPage() {
  const { id } = useParams<{ id: string }>();
  const { state, me, actions } = useStore();
  const router = useRouter();
  const club = clubById(state, id);

  if (!club || !canModerate(state, club.id, me.id)) {
    return (
      <div className="empty narrow">
        <h1>Sem acesso</h1>
        <p className="muted">Só a moderação do clube pode configurá-lo.</p>
        <Link href={club ? `/clubes/${club.id}` : "/clubes"} className="btn btn-primary">
          Voltar
        </Link>
      </div>
    );
  }

  const isOwner = club.ownerId === me.id;
  const members = clubMembersOf(state, club.id);
  const requests = state.clubRequests.filter((r) => r.clubId === club.id);
  const { id: _id, ownerId: _o, createdAt: _c, ...input } = club;

  return (
    <div className="narrow">
      <Link href={`/clubes/${club.id}`} className="link-btn">
        ← {club.name}
      </Link>
      <h1 className="page-title">Configurar clube</h1>

      <h2 className="section-title">
        Pedidos para entrar <span className="count">{requests.length}</span>
      </h2>
      {requests.length === 0 ? (
        <p className="muted">Nenhum pedido pendente.</p>
      ) : (
        <ul className="people">
          {requests.map((r) => {
            const u = userById(state, r.userId);
            if (!u) return null;
            return (
              <li key={r.userId}>
                <UserLink user={u} avatar={40} sub={`pediu ${timeAgo(r.createdAt)}`} />
                <div className="people-actions">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      const err = actions.approveClubRequest(club.id, u.id);
                      actions.toast(err ?? `@${u.username} entrou no clube`);
                    }}
                  >
                    Aprovar
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => actions.rejectClubRequest(club.id, u.id)}>
                    Recusar
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <h2 className="section-title">
        Membros <span className="count">
          {members.length}/{club.maxMembers}
        </span>
      </h2>
      <ul className="people">
        {members.map((m) => {
          const u = userById(state, m.userId);
          if (!u) return null;
          return (
            <li key={m.userId}>
              <UserLink user={u} avatar={40} sub={u.name} />
              <div className="people-actions">
                {m.role === "dono" ? (
                  <span className="role-pill">dono</span>
                ) : (
                  <>
                    {isOwner ? (
                      <select value={m.role} onChange={(e) => actions.setClubRole(club.id, u.id, e.target.value as "moderador" | "membro")} aria-label="Papel">
                        <option value="membro">Membro</option>
                        <option value="moderador">Moderação</option>
                      </select>
                    ) : (
                      <span className="role-pill">{m.role}</span>
                    )}
                    <button className="btn btn-ghost btn-sm" onClick={() => confirm(`Remover @${u.username} do clube?`) && actions.removeClubMember(club.id, u.id)}>
                      Remover
                    </button>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <h2 className="section-title">Configurações</h2>
      <ClubForm
        initial={input}
        minMembers={members.length}
        submitLabel="Salvar configurações"
        onSubmit={(c) => {
          const err = actions.updateClub(club.id, c);
          if (!err) actions.toast("Clube atualizado");
          return err;
        }}
      />

      {isOwner && (
        <section className="danger-zone">
          <h2 className="section-title">Zona de perigo</h2>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              if (!confirm(`Apagar o clube "${club.name}" e todas as publicações? Isso não pode ser desfeito.`)) return;
              actions.deleteClub(club.id);
              router.push("/clubes");
            }}
          >
            Apagar clube
          </button>
        </section>
      )}
    </div>
  );
}
