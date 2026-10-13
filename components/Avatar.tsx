import type { User } from "@/lib/types";
import { cx, hash, initials } from "@/lib/util";

const TONES = ["#ff8a3d", "#2fd38a", "#45b8f0", "#c58cff", "#ff6b81", "#ffd166", "#7bdff2", "#b8e986"];

export function Avatar({ user, size = 32, ring, className }: { user: User; size?: number; ring?: boolean; className?: string }) {
  const tone = TONES[hash(user.id) % TONES.length];
  return (
    <span className={cx("avatar", ring && "avatar-ring", className)} style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {user.avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.avatar} alt="" />
      ) : (
        <span className="avatar-fallback" style={{ background: tone }} aria-hidden>
          {initials(user.name)}
        </span>
      )}
    </span>
  );
}
