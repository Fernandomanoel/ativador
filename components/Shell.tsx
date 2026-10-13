"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { incomingRequests, unreadCount } from "@/lib/selectors";
import { useStore } from "@/lib/store";
import { cx } from "@/lib/util";
import { Avatar } from "./Avatar";
import { IconHeart, IconHome, IconPlus, IconSearch, IconUsers } from "./Icons";
import { Logo } from "./Logo";

export function Shell({ children }: { children: ReactNode }) {
  const { state, me, toasts } = useStore();
  const path = usePathname();
  const badge = unreadCount(state) + incomingRequests(state).length;
  const is = (p: string) => (p === "/" ? path === "/" : path.startsWith(p));
  const myShelf = `/u/${me.username}`;

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <Link href="/" aria-label="Vivlío — início">
            <Logo />
          </Link>
          <nav className="topnav" aria-label="Principal">
            <Link href="/" className={cx(is("/") && "active")}>Feed</Link>
            <Link href="/explorar" className={cx(is("/explorar") && "active")}>Explorar</Link>
            <Link href={myShelf} className={cx(path === myShelf && "active")}>Minha estante</Link>
            <Link href="/clubes" className={cx(is("/clubes") && "active")}>Clubes</Link>
            <Link href="/notificacoes" className={cx(is("/notificacoes") && "active")}>
              Atividade{badge > 0 && <span className="badge">{badge}</span>}
            </Link>
          </nav>
          <div className="topbar-right">
            <Link href="/estante/adicionar" className="btn btn-secondary btn-sm hide-sm">
              + Livro
            </Link>
            <Link href="/novo" className="btn btn-primary btn-sm hide-sm">
              Publicar foto
            </Link>
            <Link href="/notificacoes" className="icon-btn show-sm notif-icon" aria-label="Atividade">
              <IconHeart size={24} />
              {badge > 0 && <span className="dot" />}
            </Link>
            <Link href={myShelf} aria-label="Seu perfil" className="hide-sm">
              <Avatar user={me} size={32} />
            </Link>
          </div>
        </div>
      </header>

      <main className="page">{children}</main>

      <nav className="bottombar" aria-label="Navegação">
        <Link href="/" className={cx(is("/") && "active")} aria-label="Feed">
          <IconHome />
        </Link>
        <Link href="/explorar" className={cx(is("/explorar") && "active")} aria-label="Explorar">
          <IconSearch />
        </Link>
        <Link href="/novo" className={cx(is("/novo") && "active")} aria-label="Publicar foto">
          <IconPlus />
        </Link>
        <Link href="/clubes" className={cx(is("/clubes") && "active")} aria-label="Clubes de leitura">
          <IconUsers />
        </Link>
        <Link href={myShelf} className={cx(path.startsWith(myShelf) && "active")} aria-label="Perfil">
          <Avatar user={me} size={26} />
        </Link>
      </nav>

      <div className="toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="toast">
            {t.msg}
          </div>
        ))}
      </div>
    </>
  );
}
