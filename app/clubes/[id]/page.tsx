"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Avatar } from "@/components/Avatar";
import { ClubBadge, ClubComposer, ClubPostCard, CLUB_TONES, MembersOnly } from "@/components/ClubParts";
import { Cover } from "@/components/Cover";
import { IconSettings, IconUsers } from "@/components/Icons";
import { ProgressBar } from "@/components/ReadingCard";
import { UserLink } from "@/components/UserLink";
import { CLUB_AREAS, focusLabel, SPOILER_POLICIES } from "@/lib/constants";
import { bookById, canModerate, clubById, clubIsFull, clubMembersOf, entryFor, hasClubRequest, memberOf, userById } from "@/lib/selectors";
import { useStore } from "@/lib/store";
import type { ClubArea } from "@/lib/types";
import { cx } from "@/lib/util";

type Tab = ClubArea | "membros" | "sobre";

export default function ClubPage() {
  const { id } = useParams<{ id: string }>();
  const { state, me, actions } = useStore();
  const club = clubById(state, id);
  const [tab, setTab] = useState<Tab | null>(null);

  if (!club) {
    return (
      <div className="empty narrow">
        <h1>Clube não encontrado</h1>
        <Link href="/clubes" className="btn btn-primary">
          Ver clubes
        </Link>
      </div>
    );
  }

  const members = clubMembersOf(state, club.id);
  const me_ = memberOf(state, club.id, me.id);
  const isMember = !!me_;
  const mod = canModerate(state, club.id, me.id);
  const full = clubIsFull(state, club.id);
  const requested = hasClubRequest(state, club.id, me.id);
  const book = bookById(state, club.bookId);
  const myEntry = book ? entryFor(state, me.id, book.id) : undefined;
  const policy = SPOILER_POLICIES.find((p) => p.id === club.spoilerPolicy)!;
  const active: Tab = tab ?? (isMember ? club.areas[0] : "sobre");
  const [a, b] = CLUB_TONES[club.tone % CLUB_TONES.length];
  const pendingCount = state.clubRequests.filter((r) => r.clubId === club.id).length;

  const posts = (area: ClubArea) =>
    state.clubPosts
      .filter((p) => p.clubId === club.id && p.area === area)
      .sort((x, y) => Number(!!y.pinned) - Number(!!x.pinned) || y.createdAt.localeCompare(x.createdAt));

  const join = () => {
    const err = actions.joinClub(club.id);
    if (err) return actions.toast(err);
    actions.toast(club.access === "aberto" ? `Bem-vindo(a) ao ${club.name}!` : "Pedido enviado à moderação");
  };

  let action;
  if (isMember) {
    action = mod ? (
      <Link href={`/clubes/${club.id}/config`} className="btn btn-secondary">
        <IconSettings size={16} /> Configurar{pendingCount > 0 && <span className="badge">{pendingCount}</span>}
      </Link>
    ) : (
      <button
        className="btn btn-secondary"
        onClick={() => {
          if (!confirm(`Sair do ${club.name}?`)) return;
          const err = actions.leaveClub(club.id);
          if (err) actions.toast(err);
        }}
      >
        Participando ✓
      </button>
    );
  } else if (requested) {
    action = (
      <button className="btn btn-secondary" onClick={() => actions.cancelClubRequest(club.id)}>
        Pedido enviado
      </button>
    );
  } else if (full) {
    action = (
      <button className="btn btn-secondary" disabled>
        Clube cheio
      </button>
    );
  } else {
    action = (
      <button className="btn btn-primary" onClick={join}>
        {club.access === "aberto" ? "Entrar no clube" : "Pedir para entrar"}
      </button>
    );
  }

  return (
    <div className="club-page">
      <header className={cx("club-hero", club.cover && "with-cover")} style={{ background: `linear-gradient(120deg, ${a}, ${b})` }}>
        {club.cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="club-hero-img" src={club.cover} alt="" />
        )}
        <div className="club-hero-inner">
          <ClubBadge club={club} size={84} />
          <div className="club-hero-text">
            <span className="club-kicker">{focusLabel(club.focus)}</span>
            <h1>{club.name}</h1>
            <p>{club.description}</p>
            <div className="club-hero-chips">
              <span>
                <IconUsers size={14} /> {members.length}/{club.maxMembers} membros
              </span>
              <span>🛡️ {policy.label}</span>
              <span>{club.access === "aberto" ? "🔓 Aberto" : "🔐 Com aprovação"}</span>
            </div>
          </div>
          <div className="club-hero-action">{action}</div>
        </div>
      </header>

      <div className="club-layout">
        <div className="club-main">
          <nav className="area-tabs" role="tablist" aria-label="Áreas do clube">
            {club.areas.map((ar) => {
              const info = CLUB_AREAS.find((x) => x.id === ar)!;
              return (
                <button key={ar} role="tab" aria-selected={active === ar} className={cx(active === ar && "on")} onClick={() => setTab(ar)}>
                  {info.icon} {info.label}
                </button>
              );
            })}
            <button role="tab" aria-selected={active === "membros"} className={cx(active === "membros" && "on")} onClick={() => setTab("membros")}>
              👥 Membros
            </button>
            <button role="tab" aria-selected={active === "sobre"} className={cx(active === "sobre" && "on")} onClick={() => setTab("sobre")}>
              ℹ️ Sobre
            </button>
          </nav>

          {active === "sobre" && (
            <section className="club-about">
              <h2 className="section-title">Regras</h2>
              <p className="pre">{club.rules || "Sem regras definidas."}</p>
              <h2 className="section-title">Política de spoiler</h2>
              <p>
                <strong>{policy.label}:</strong> {policy.hint}
              </p>
              {!isMember && <MembersOnly club={club} />}
            </section>
          )}

          {active === "membros" && (
            <ul className="people">
              {members
                .sort((x, y) => ["dono", "moderador", "membro"].indexOf(x.role) - ["dono", "moderador", "membro"].indexOf(y.role))
                .map((m) => {
                  const u = userById(state, m.userId);
                  if (!u) return null;
                  return (
                    <li key={m.userId}>
                      <UserLink user={u} avatar={40} sub={m.role === "dono" ? "Criou o clube" : m.role === "moderador" ? "Moderação" : u.name} />
                      {m.role !== "membro" && <span className="role-pill">{m.role}</span>}
                    </li>
                  );
                })}
              <li className="muted small">
                {club.maxMembers - members.length > 0 ? `${club.maxMembers - members.length} vaga(s) restante(s)` : "Sem vagas no momento"}
              </li>
            </ul>
          )}

          {active !== "sobre" && active !== "membros" &&
            (isMember ? (
              <section className="club-area">
                <ClubComposer club={club} area={active} />
                {posts(active).length === 0 ? (
                  <p className="muted center" style={{ padding: 24 }}>
                    Nada por aqui ainda. Comece a conversa!
                  </p>
                ) : (
                  posts(active).map((p) => <ClubPostCard key={p.id} post={p} club={club} />)
                )}
              </section>
            ) : (
              <MembersOnly club={club} />
            ))}
        </div>

        <aside className="club-side">
          {book && (
            <div className="club-side-card">
              <h3 className="section-mini">Leitura do mês</h3>
              <Link href={`/livro/${book.id}`} className="club-book">
                <Cover book={book} size="sm" />
                <span>
                  <strong>{book.title}</strong>
                  <span className="muted small block">{book.author}</span>
                </span>
              </Link>
              {isMember &&
                (myEntry?.status === "lendo" ? (
                  <>
                    <ProgressBar entry={myEntry} />
                    <Link href={`/u/${me.username}/livro/${book.id}`} className="link-btn small">
                      Atualizar meu progresso
                    </Link>
                  </>
                ) : myEntry?.status === "lido" ? (
                  <p className="muted small">✓ Você já leu este livro.</p>
                ) : (
                  <Link href={`/estante/adicionar?livro=${book.id}`} className="btn btn-secondary btn-sm btn-block">
                    Começar a ler
                  </Link>
                ))}
              {club.spoilerPolicy !== "liberado" && isMember && (
                <p className="muted small">🛡️ Posts que passam da sua página ficam escondidos.</p>
              )}
            </div>
          )}
          <div className="club-side-card">
            <h3 className="section-mini">Membros</h3>
            <div className="avatar-row">
              {members.slice(0, 12).map((m) => {
                const u = userById(state, m.userId);
                return u ? (
                  <Link key={m.userId} href={`/u/${u.username}`} title={u.name}>
                    <Avatar user={u} size={32} />
                  </Link>
                ) : null;
              })}
            </div>
            <div className="seat-bar">
              <span style={{ width: `${(members.length / club.maxMembers) * 100}%` }} />
            </div>
            <span className="muted small">
              {members.length} de {club.maxMembers} vagas ocupadas
            </span>
          </div>
        </aside>
      </div>
    </div>
  );
}
