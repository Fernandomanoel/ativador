import { useId } from "react";

/** Marca do Vivlío: uma maçã cunhada numa moeda de prata. */
export function CoinMark({ size = 32, className }: { size?: number; className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} role="img" aria-label="Vivlío">
      <defs>
        <radialGradient id={`face-${id}`} cx="38%" cy="32%" r="75%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset=".35" stopColor="#dfe4ea" />
          <stop offset=".75" stopColor="#a7b0bb" />
          <stop offset="1" stopColor="#7d8794" />
        </radialGradient>
        <linearGradient id={`rim-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f4f6f8" />
          <stop offset=".5" stopColor="#8e98a4" />
          <stop offset="1" stopColor="#5d6672" />
        </linearGradient>
        <linearGradient id={`apple-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#b9c1ca" />
          <stop offset="1" stopColor="#6b7581" />
        </linearGradient>
      </defs>
      {/* aro serrilhado */}
      <circle cx="32" cy="32" r="31" fill={`url(#rim-${id})`} />
      <circle cx="32" cy="32" r="29.2" fill="none" stroke="#5d6672" strokeWidth="1.6" strokeDasharray="1.1 1.2" opacity=".55" />
      {/* face */}
      <circle cx="32" cy="32" r="26.5" fill={`url(#face-${id})`} />
      <circle cx="32" cy="32" r="23.2" fill="none" stroke="#7d8794" strokeWidth=".8" opacity=".7" />
      {/* pontos do anel interno, como numa moeda antiga */}
      {Array.from({ length: 24 }).map((_, i) => {
        const a = (i / 24) * Math.PI * 2;
        return <circle key={i} cx={32 + Math.cos(a) * 24.8} cy={32 + Math.sin(a) * 24.8} r=".55" fill="#6b7581" opacity=".8" />;
      })}
      {/* maçã em relevo: sombra + corpo + brilho */}
      <g transform="translate(0 1.5)">
        <path
          d="M32 22.5c-2.6-1.9-6.2-2.3-8.7-.4-3.4 2.6-3.7 8-1.6 12.7 1.9 4.3 5.1 8 8 8 1 0 1.6-.5 2.3-.5s1.3.5 2.3.5c2.9 0 6.1-3.7 8-8 2.1-4.7 1.8-10.1-1.6-12.7-2.5-1.9-6.1-1.5-8.7.4z"
          fill="#4b535d"
          opacity=".35"
          transform="translate(.8 .9)"
        />
        <path
          d="M32 22.5c-2.6-1.9-6.2-2.3-8.7-.4-3.4 2.6-3.7 8-1.6 12.7 1.9 4.3 5.1 8 8 8 1 0 1.6-.5 2.3-.5s1.3.5 2.3.5c2.9 0 6.1-3.7 8-8 2.1-4.7 1.8-10.1-1.6-12.7-2.5-1.9-6.1-1.5-8.7.4z"
          fill={`url(#apple-${id})`}
          stroke="#59626d"
          strokeWidth=".7"
        />
        <path d="M32 22.6c-.2-2.3.4-4.4 1.8-6" stroke="#4b535d" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <path d="M33.4 19.2c1.6-2.4 4.4-3.2 6.6-2.7-.9 2.5-3.6 3.9-6.6 2.7z" fill="#8e98a4" stroke="#59626d" strokeWidth=".6" />
        <path d="M24.6 26.2c.8-1.7 2.3-2.6 3.8-2.7" stroke="#ffffff" strokeWidth="1.3" strokeLinecap="round" opacity=".85" fill="none" />
      </g>
    </svg>
  );
}

export function Logo({ size = 30 }: { size?: number }) {
  return (
    <span className="logo">
      <CoinMark size={size} />
      <span className="logo-word">vivlío</span>
    </span>
  );
}
