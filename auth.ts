import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import Credentials from "next-auth/providers/credentials";
import Facebook from "next-auth/providers/facebook";
import Google from "next-auth/providers/google";
import { dbConfigured } from "@/lib/server/db";
import { ensureUser } from "@/lib/server/world";

// Login do Vivlío: Google (Gmail) e Facebook. Cada provedor só aparece quando
// as chaves dele estão nas variáveis de ambiente (veja docs/LOGIN.md).
// O "acesso de teste" é opcional: entra só com um nome e o código definido em
// VIVLIO_TEST_CODE, para testar com outra pessoa antes de configurar Google/Facebook.

const isDev = process.env.NODE_ENV !== "production";

export const enabled = {
  google: !!(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET),
  facebook: !!(process.env.AUTH_FACEBOOK_ID && process.env.AUTH_FACEBOOK_SECRET),
  test: !!process.env.VIVLIO_TEST_CODE,
};

export const authSecret = process.env.AUTH_SECRET || (isDev ? "vivlio-dev-secret-nao-use-em-producao" : "");

/** O que falta configurar para o login funcionar (vazio = pronto). */
export function missingSetup(): string[] {
  const missing: string[] = [];
  if (!dbConfigured()) missing.push("banco de dados (DATABASE_URL)");
  if (!authSecret) missing.push("AUTH_SECRET");
  if (!enabled.google && !enabled.facebook && !enabled.test) missing.push("um jeito de entrar: Google, Facebook ou VIVLIO_TEST_CODE");
  return missing;
}

const providers: Provider[] = [];
if (enabled.google) providers.push(Google({ clientId: process.env.AUTH_GOOGLE_ID, clientSecret: process.env.AUTH_GOOGLE_SECRET }));
if (enabled.facebook) providers.push(Facebook({ clientId: process.env.AUTH_FACEBOOK_ID, clientSecret: process.env.AUTH_FACEBOOK_SECRET }));
if (enabled.test) {
  providers.push(
    Credentials({
      id: "teste",
      name: "Acesso de teste",
      credentials: { name: { label: "Seu nome" }, code: { label: "Código de teste", type: "password" } },
      authorize(c) {
        const name = typeof c?.name === "string" ? c.name.trim().slice(0, 40) : "";
        if (!name || c?.code !== process.env.VIVLIO_TEST_CODE) return null;
        const key = name
          .normalize("NFD")
          .replace(/\p{Diacritic}/gu, "")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-");
        return { id: key, name };
      },
    }),
  );
}

export const { handlers, auth } = NextAuth({
  providers,
  secret: authSecret || undefined,
  trustHost: true,
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  pages: { signIn: "/", error: "/" },
  callbacks: {
    async jwt({ token, account, user }) {
      // No login, liga a conta do provedor a um leitor do Vivlío (criando se for a primeira vez).
      if (account) {
        token.uid = await ensureUser({
          key: `${account.provider}:${account.providerAccountId}`,
          name: user?.name,
          email: account.provider === "teste" ? null : user?.email,
          image: user?.image,
        });
      }
      return token;
    },
    session({ session, token }) {
      return { ...session, uid: typeof token.uid === "string" ? token.uid : undefined };
    },
  },
});

/** Id do leitor logado (ou null). */
export async function currentUserId(): Promise<string | null> {
  if (missingSetup().length) return null;
  const session = (await auth()) as { uid?: string } | null;
  return session?.uid ?? null;
}
