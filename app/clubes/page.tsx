"use client";

import Link from "next/link";
import { useState } from "react";
import { ClubCard } from "@/components/ClubParts";
import { IconSearch } from "@/components/Icons";
import { CLUB_FOCUS, CLUB_MAX } from "@/lib/constants";
import { memberOf, myClubs } from "@/lib/selectors";
import { useStore } from "@/lib/store";
import type { ClubFocus } from "@/lib/types";
import { cx } from "@/lib/util";

const norm = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export default function ClubsPage() {
  const { state, me } = useStore();
  const [q, setQ] = useState("");
  const [focus, setFocus] = useState<ClubFocus | "">("");
  const mine = myClubs(state);
  const others = state.clubs.filter(
    (c) => !memberOf(state, c.id, me.id) && (!focus || c.focus === focus) && (!q.trim() || norm(c.name + " " + c.description).includes(norm(q.trim()))),
  );

  return (
    <div className="clubs">
      <header className="clubs-hero">
        <div>
          <h1 className="page-title">Clubes de leitura</h1>
          <p className="muted">
            Grupos de até {CLUB_MAX} leitores, com áreas para anotações, resenhas do mês, plantão de dúvidas, estudos e galeria de quadrinhos — e regras de spoiler
            para cada tipo de leitor.
          </p>
        </div>
        <Link href="/clubes/novo" className="btn btn-primary">
          + Criar clube
        </Link>
      </header>

      <h2 className="section-title">Meus clubes</h2>
      {mine.length === 0 ? (
        <p className="muted">Você ainda não participa de nenhum clube.</p>
      ) : (
        <div className="club-grid">
          {mine.map((c) => (
            <ClubCard key={c.id} club={c} />
          ))}
        </div>
      )}

      <h2 className="section-title">Descobrir</h2>
      <div className="search-bar">
        <IconSearch size={18} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar clubes" aria-label="Buscar clubes" />
      </div>
      <div className="chips wrap" style={{ margin: "12px 0 16px" }}>
        <button className={cx("chip", !focus && "on")} onClick={() => setFocus("")}>
          Todos
        </button>
        {CLUB_FOCUS.map((f) => (
          <button key={f.id} className={cx("chip", focus === f.id && "on")} onClick={() => setFocus(focus === f.id ? "" : f.id)}>
            {f.label}
          </button>
        ))}
      </div>
      {others.length === 0 ? (
        <p className="muted">Nenhum clube encontrado. Que tal criar um?</p>
      ) : (
        <div className="club-grid">
          {others.map((c) => (
            <ClubCard key={c.id} club={c} />
          ))}
        </div>
      )}
    </div>
  );
}
