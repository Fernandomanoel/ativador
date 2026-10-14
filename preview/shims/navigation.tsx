// Substitui next/navigation e next/link por um roteador em memória:
// o visualizador do claude.ai roda a página num frame sem rotas de servidor.
import { createContext, useContext, useSyncExternalStore, type AnchorHTMLAttributes, type ReactNode } from "react";

let current = "/";
const listeners = new Set<() => void>();
const stack: string[] = [];

export function navigate(href: string, replace = false) {
  if (href === current) return;
  if (!replace) stack.push(current);
  current = href;
  listeners.forEach((l) => l());
  try {
    window.scrollTo({ top: 0 });
  } catch {
    /* ignora */
  }
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useHref() {
  return useSyncExternalStore(subscribe, () => current);
}

const ParamsContext = createContext<Record<string, string>>({});
export const ParamsProvider = ParamsContext.Provider;

export function usePathname() {
  return useHref().split("?")[0];
}
export function useSearchParams() {
  const q = useHref().split("?")[1] ?? "";
  return new URLSearchParams(q);
}
export function useParams<T extends Record<string, string>>(): T {
  return useContext(ParamsContext) as T;
}
export function useRouter() {
  return {
    push: (h: string) => navigate(h),
    replace: (h: string) => navigate(h, true),
    back: () => {
      const prev = stack.pop();
      if (prev) navigate(prev, true);
    },
    refresh: () => {},
    prefetch: () => {},
  };
}
export function notFound(): never {
  throw new Error("not found");
}

export default function Link({ href, children, onClick, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children?: ReactNode; prefetch?: boolean }) {
  const { prefetch: _p, ...props } = rest as typeof rest & { prefetch?: boolean };
  return (
    <a
      {...props}
      href={href}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey) {
          e.preventDefault();
          return;
        }
        e.preventDefault();
        navigate(href);
      }}
    >
      {children}
    </a>
  );
}
