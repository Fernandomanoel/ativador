import Link from "next/link";
import type { User } from "@/lib/types";
import { Avatar } from "./Avatar";
import { IconLock } from "./Icons";

export function UserLink({ user, avatar = 0, sub }: { user: User; avatar?: number; sub?: React.ReactNode }) {
  return (
    <Link href={`/u/${user.username}`} className="user-link">
      {avatar > 0 && <Avatar user={user} size={avatar} />}
      <span className="user-link-text">
        <span className="user-link-name">
          {user.username}
          {user.isPrivate && <IconLock size={12} className="lock-inline" aria-label="Conta privada" />}
        </span>
        {sub && <span className="user-link-sub">{sub}</span>}
      </span>
    </Link>
  );
}
