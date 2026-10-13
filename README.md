# Vivlío

**A rede social de quem lê.** Sua estante, suas avaliações, resenhas e anotações, e fotos dos seus livros. A estética escura e de "diário de leitura" vem do Letterboxd, e o jeito de interagir (feed, perfil, curtidas, comentários, seguir) vem do Instagram.

> Logo: uma maçã cunhada numa moeda de prata (`components/Logo.tsx`, `public/icon.svg`).

Esta é a **fase 1: o front-end**. É um protótipo navegável com dados de exemplo, e tudo o que você faz fica salvo no próprio navegador (`localStorage`). O back-end vem na fase 2 (veja abaixo).

## O que já funciona

| Área | O que tem |
| --- | --- |
| **Estante** | Livros com status (Lido, Lendo, Quero ler, Abandonado), formato (Físico, E-book, Audiobook) e **rótulos pré-estabelecidos** (Clássicos, Nacionais, Fantasia, Me fez chorar…). Três visualizações: **Capas** em prateleiras de madeira, **Lombadas** e **Diário**. Filtros por status, formato e rótulo. Ordenação por nota, data, título, autor ou **do seu jeito**: em "Organizar" você arrasta os livros ou usa as setas no celular. |
| **Livro na estante** | Clicar num livro abre a nota em meias estrelas, o favorito, a resenha (com aviso de spoiler), as **anotações por página com trechos citados**, as curtidas e os comentários. |
| **Perfil** | Foto, bio, contadores, 4 livros favoritos e as abas Estante, Fotos e Resenhas. |
| **Fotos** | Publicar foto (enviar ou arrastar), legenda e marcar um livro da estante. Curtir (também com dois cliques na foto) e comentar. |
| **Feed** | Fotos e resenhas de quem você segue, a fileira "Lendo agora" (estilo stories) e sugestões de leitores. |
| **Explorar** | Busca de leitores e livros, livros populares, resenhas recentes e grade de fotos. |
| **Página do livro** | Gráfico de notas, quem tem o livro na estante e todas as resenhas. |
| **Adicionar livro** | Catálogo do Vivlío, busca na Open Library (capas reais) ou cadastro manual com foto da capa. |

### Privacidade (modo "leitor tímido")

- A conta pode ser **privada**, como no Instagram: as **fotos** e as listas de seguidores/seguindo só aparecem para seguidores aprovados.
- A **estante é sempre pública**: livros, notas, resenhas e anotações ficam visíveis para todo mundo.
- Quem quer seguir uma conta privada envia um **pedido** e pode mandar **um único bilhete** (até 280 caracteres).
- A pessoa privada pode **responder o bilhete uma única vez**. **Responder não aceita o pedido**: aceitar e recusar são botões separados.
- Se a conta virar pública, os pedidos pendentes são aprovados automaticamente.

Para testar: entre em **Atividade → Pedidos** (o `jp.paginas` mandou um bilhete) ou visite `@mari.capitulo` e clique em **Pedir para seguir**.

## Rodando localmente

```bash
npm install
npm run dev        # http://localhost:3000
```

Outros comandos: `npm run build`, `npm run typecheck`.

Em **Configurações → Restaurar dados de exemplo** você volta ao estado inicial.

## Estrutura

```
app/                  páginas (Next.js App Router)
  page.tsx            feed
  u/[username]/       perfil, livro na estante, seguidores/seguindo
  livro/[bookId]/     página pública do livro
  p/[id]/             publicação
  novo/               nova foto
  estante/adicionar/  adicionar livro
  notificacoes/       atividade, pedidos e bilhetes
  configuracoes/      perfil e privacidade
components/           Shelf, Cover, Spine, PostCard, ReviewCard, FollowControls, Logo…
lib/                  tipos, regras de privacidade (selectors.ts), estado (store.tsx), dados de exemplo
docs/schema.prisma    modelo de dados planejado para o back-end
```

## Próximos passos (fase 2: back-end)

- Contas reais (cadastro e login), banco de dados (o esquema já está em `docs/schema.prisma`) e upload de fotos num storage.
- Levar para o servidor as mesmas regras de privacidade de `lib/selectors.ts`, `lib/store.tsx` (bilhete único, resposta única, responder ≠ aceitar).
- Vídeos curtos nas publicações.
