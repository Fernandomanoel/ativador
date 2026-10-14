"use client";

/** Envia um formulário de login/logout do Auth.js (com o token anti-CSRF). */
export async function authPost(path: string, fields: Record<string, string>) {
  const { csrfToken } = (await (await fetch("/api/auth/csrf")).json()) as { csrfToken: string };
  const form = document.createElement("form");
  form.method = "POST";
  form.action = path;
  for (const [k, v] of Object.entries({ ...fields, csrfToken })) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = k;
    input.value = v;
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
}
