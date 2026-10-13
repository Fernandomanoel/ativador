# Ligar o login e o banco de dados (Vercel)

O Vivlío já tem back-end: contas reais, banco de dados e as regras de privacidade
aplicadas no servidor. Para funcionar no site da Vercel faltam algumas chaves, que
só o dono das contas pode criar. Enquanto alguma faltar, o site abre em **modo
demonstração** e mostra no topo o que falta.

Todas as variáveis abaixo ficam em **Vercel → projeto → Settings → Environment
Variables**, marcadas para **Production** (e Preview, se quiser testar no link do PR).
Depois de mudar variáveis, publique de novo: **Deployments → ⋯ → Redeploy**.

> Use o **endereço de produção** (o domínio que aparece em *Settings → Domains*,
> depois de mesclar o PR no `main`). Os links de prévia de PR pedem login na
> Vercel, então a outra pessoa não conseguiria abrir.

## 1. Banco de dados

**Vercel → projeto → Storage → Create Database → Neon (Postgres) → Create** e
ligue ao projeto. A Vercel cria `DATABASE_URL` sozinha. As tabelas são criadas
automaticamente no primeiro acesso.

## 2. Segredo do login

| Variável | Valor |
| --- | --- |
| `AUTH_SECRET` | Uma frase longa e aleatória (32+ caracteres). Não compartilhe. |

## 3. Testar já, sem Google/Facebook (opcional)

| Variável | Valor |
| --- | --- |
| `VIVLIO_TEST_CODE` | Um código que você escolhe, por exemplo `estante2026`. |

Na tela de entrada aparece **"Acesso de teste"**: cada pessoa digita o próprio nome
e esse código. Passe o código só para quem vai testar e apague a variável quando o
Google/Facebook estiverem funcionando.

## 4. Entrar com Google (Gmail)

1. Acesse https://console.cloud.google.com e crie um projeto chamado *Vivlio*.
2. **APIs e serviços → Tela de consentimento OAuth**: tipo *Externo*, nome *Vivlío*,
   seu e-mail. Em **Usuários de teste**, adicione os dois Gmails que vão testar.
3. **Credenciais → Criar credenciais → ID do cliente OAuth → Aplicativo da Web**.
   Em *URIs de redirecionamento autorizados* coloque:
   `https://SEU-DOMINIO/api/auth/callback/google`
4. Copie para a Vercel:

| Variável | Valor |
| --- | --- |
| `AUTH_GOOGLE_ID` | ID do cliente |
| `AUTH_GOOGLE_SECRET` | Chave secreta do cliente |

## 5. Entrar com Facebook

1. Acesse https://developers.facebook.com → **Meus apps → Criar app** → caso de uso
   *Autenticar e solicitar dados dos usuários com o Login do Facebook*.
2. **Login do Facebook → Configurações**: em *URIs de redirecionamento do OAuth
   válidos* coloque `https://SEU-DOMINIO/api/auth/callback/facebook`.
3. **Configurações do app → Básico**: copie para a Vercel:

| Variável | Valor |
| --- | --- |
| `AUTH_FACEBOOK_ID` | ID do aplicativo |
| `AUTH_FACEBOOK_SECRET` | Chave secreta do aplicativo |

4. Enquanto o app estiver em **modo de desenvolvimento**, só entra quem tem função
   no app: em **Funções do app → Testadores**, adicione a outra pessoa (ela precisa
   aceitar o convite no Facebook).

## Como funciona por dentro

- `auth.ts`: login com Auth.js (Google, Facebook e o acesso de teste). No primeiro
  login o leitor é criado com nome e foto da conta; o mesmo e-mail no Google e no
  Facebook vira a mesma pessoa.
- `lib/logic.ts`: as regras do app (seguir, bilhete único, resposta única, clubes
  com até 50 membros…), as mesmas no navegador e no servidor.
- `app/api/action`: recebe cada ação, valida os dados (`lib/server/validate.ts`) e
  aplica as regras em nome de quem está logado.
- `app/api/state`: devolve só o que a pessoa pode ver (`projectFor` em
  `lib/server/world.ts`): notas "só minhas", fotos de contas privadas, bilhetes e
  posts de clubes ficam de fora para quem não deve ver.
- `app/api/media/[id]`: fotos, capas e GIFs enviados ficam numa tabela própria.
- Fase de testes: os dados ficam num documento JSON no Postgres, gravado com
  controle de versão. Para crescer além de alguns grupos de teste, o próximo passo
  é passar para tabelas separadas (o desenho está em `docs/schema.prisma`).

## Rodando no seu computador

```bash
npm install
VIVLIO_TEST_CODE=teste npm run dev
```

Sem `DATABASE_URL`, o modo de desenvolvimento usa um Postgres embutido gravado em
`.data/`. Abra duas janelas (uma anônima) e entre com nomes diferentes.
