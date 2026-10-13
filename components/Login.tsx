"use client";

import { useState } from "react";
import { authPost } from "@/lib/authClient";
import { CoinMark } from "./Logo";

export interface LoginInfo {
  providers: { google?: boolean; facebook?: boolean; test?: boolean };
  error?: string | null;
}

const ERRORS: Record<string, string> = {
  CredentialsSignin: "Nome ou código de teste incorretos.",
  OAuthAccountNotLinked: "Este e-mail já está ligado a outra forma de entrar.",
  AccessDenied: "Acesso negado. Se o app ainda está em modo de teste, peça para ser adicionado como testador.",
  Configuration: "O login ainda não foi configurado por completo no servidor.",
};

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
    <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
  </svg>
);

const FacebookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
    <path fill="currentColor" d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.5 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z" />
  </svg>
);

/** Tela de entrada: Google (Gmail), Facebook e, se configurado, o acesso de teste. */
export function Login({ info }: { info: LoginInfo }) {
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const { google, facebook, test } = info.providers;

  const go = (provider: string, fields: Record<string, string> = {}) => {
    setBusy(true);
    authPost(`/api/auth/${provider === "teste" ? "callback" : "signin"}/${provider}`, { callbackUrl: "/", ...fields }).catch(() => setBusy(false));
  };

  return (
    <main className="login">
      <section className="login-card">
        <CoinMark size={64} />
        <h1 className="login-title">vivlío</h1>
        <p className="login-tagline">A rede social de quem lê. Sua estante, suas anotações e seus clubes de leitura.</p>

        {info.error && <p className="form-error">{ERRORS[info.error] ?? "Não foi possível entrar. Tente de novo."}</p>}

        <div className="login-buttons">
          {google && (
            <button className="btn login-btn google" disabled={busy} onClick={() => go("google")}>
              <GoogleIcon /> Continuar com Google
            </button>
          )}
          {facebook && (
            <button className="btn login-btn facebook" disabled={busy} onClick={() => go("facebook")}>
              <FacebookIcon /> Continuar com Facebook
            </button>
          )}
          {!google && !facebook && !test && <p className="muted small">Nenhuma forma de entrar foi configurada ainda.</p>}
        </div>

        {test && (
          <form
            className="login-test"
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim() && code) go("teste", { name: name.trim(), code });
            }}
          >
            <span className="login-divider">
              <span>{google || facebook ? "ou acesso de teste" : "acesso de teste"}</span>
            </span>
            <label className="field">
              <span className="field-label">Seu nome</span>
              <input id="login-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} autoComplete="name" />
            </label>
            <label className="field">
              <span className="field-label">Código de teste</span>
              <input id="login-code" type="password" value={code} onChange={(e) => setCode(e.target.value)} autoComplete="off" />
            </label>
            <button className="btn btn-secondary" type="submit" disabled={busy || !name.trim() || !code}>
              Entrar para testar
            </button>
          </form>
        )}

        <p className="login-foot muted small">Ao entrar, criamos seu perfil com o seu nome e foto. Você pode mudar tudo depois em Editar perfil.</p>
      </section>
    </main>
  );
}
