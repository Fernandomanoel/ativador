# Vivlío

**A rede social de quem lê.** Sua estante, suas leituras em andamento, avaliações, resenhas, anotações, fotos dos seus livros e clubes de leitura. A estética escura e de "diário de leitura" vem do Letterboxd, e o jeito de interagir (feed, perfil, curtidas, comentários, seguir) vem do Instagram. A paleta não usa verde: os destaques são laranja (estrelas e progresso), azul (botões) e rosa (curtidas).

> Logo: uma maçã cunhada numa moeda de prata (`components/Logo.tsx`, `public/icon.svg`).

O app tem **contas reais** (login com Google/Gmail e Facebook), banco de dados Postgres e as regras de privacidade aplicadas no servidor. Para ligar o login e o banco na Vercel, siga **[docs/LOGIN.md](docs/LOGIN.md)**. Enquanto não estiver configurado, o site abre em **modo demonstração**, com dados de exemplo salvos no próprio navegador (o mesmo modo da prévia no claude.ai).

## O que já funciona

| Área | O que tem |
| --- | --- |
| **Estante** | Livros com status (Lido, Lendo, Quero ler, Abandonado), formato (Físico, E-book, Audiobook) e **rótulos pré-estabelecidos** (Clássicos, Nacionais, Fantasia, Me fez chorar…). Três visualizações: **Capas** em prateleiras de madeira, **Lombadas** e **Diário**. Filtros por status, formato e rótulo. Ordenação por nota, data, título, autor ou **do seu jeito**: em "Organizar" você arrasta os livros ou usa as setas no celular. |
| **Lendo** | Aba do perfil com as leituras em andamento: barra de progresso ("estou na página…") e um **diário de leitura** em que cada nota é **pública** ou **só minha**. As notas públicas aparecem no perfil e no feed de quem segue, o que serve para influencers mostrarem o que estão lendo e anotando. |
| **Clubes de leitura** | Grupos de **até 50 membros** (o limite é configurável de 2 a 50). Áreas que a moderação liga e desliga: Anotações, Resenhas do mês, Plantão de dúvidas (com "resolvida"), Área de estudos, Galeria (quadrinhos e mangás), Cronograma e Bate-papo. Foco (leitura em grupo, estudos, quadrinhos & mangá, booktok, clássicos, nacionais), leitura do mês, entrada aberta ou com aprovação, papéis (dono, moderação, membro) e posts fixados. |
| **Spoilers nos clubes** | Três políticas: **Zero spoiler** (posts que citam uma página ficam escondidos para quem ainda não chegou lá, de acordo com o progresso de cada um), **Spoilers marcados** (borrados até clicar) e **Liberado** (para estudo e releitura). |
| **Livro na estante** | Clicar num livro abre a nota em meias estrelas, o favorito, a resenha (com aviso de spoiler), as **anotações por página com trechos citados**, as curtidas e os comentários. |
| **Perfil** | **Capa personalizada (foto ou GIF animado)**, foto de perfil (também aceita GIF), bio, contadores, 4 livros favoritos e as abas Estante, Lendo, Fotos e Resenhas. Os clubes também podem ter capa com foto ou GIF. GIFs ficam sem compressão para continuarem animados, com limite de 1,5 MB. |
| **Fotos** | Publicar foto (enviar ou arrastar), legenda e marcar um livro da estante. Curtir (também com dois cliques na foto) e comentar. |
| **Feed** | Fotos, resenhas e notas públicas de leitura de quem você segue, a fileira "Lendo agora" (estilo stories) e sugestões de leitores. |
| **Explorar** | Busca de leitores e livros, livros populares, resenhas recentes e grade de fotos. |
| **Página do livro** | Gráfico de notas, quem tem o livro na estante e todas as resenhas. |
| **Adicionar livro** | Catálogo do Vivlío, busca na Open Library (capas reais) ou cadastro manual com foto da capa. |

### Privacidade (modo "leitor tímido")

- A conta pode ser **privada**, como no Instagram: as **fotos** e as listas de seguidores/seguindo só aparecem para seguidores aprovados.
- A **estante é sempre pública**: livros, notas e resenhas ficam visíveis para todo mundo. Cada **anotação** pode ser marcada como **só minha**, e aí só a dona ou o dono da estante vê.
- Quem quer seguir uma conta privada envia um **pedido** e pode mandar **um único bilhete** (até 280 caracteres).
- A pessoa privada pode **responder o bilhete uma única vez**. **Responder não aceita o pedido**: aceitar e recusar são botões separados.
- Se a conta virar pública, os pedidos pendentes são aprovados automaticamente.

Para testar os clubes: abra **Clubes → Clube da Clarice**. A Bia está na p. 120 de *Torto Arado*, então as anotações das páginas 140 e 190 aparecem escondidas. Em **Configurar**, aprove pedidos e mude áreas, spoilers e limite. A aba **Lendo** do perfil da `ju.booktok` mostra um diário de leitura público.

Para testar a privacidade: entre em **Atividade → Pedidos** (o `jp.paginas` mandou um bilhete) ou visite `@mari.capitulo` e clique em **Pedir para seguir**.

## Visualização online

Prévia navegável, que abre no celular: https://claude.ai/artifact/MhTrEQXwWDwmCgm5Liamwn (privada; compartilhe pelo menu **Share** da página).

Ela é gerada a partir deste mesmo código por `npm run preview:build`, que monta `preview/dist/vivlio.html`: uma página única com roteamento em memória, para rodar no visualizador do claude.ai. Lá as confirmações ("Tem certeza?") são aceitas automaticamente, porque o visualizador não mostra essas caixas, e as capas da Open Library não carregam.

## Rodando localmente

```bash
npm install
VIVLIO_TEST_CODE=teste npm run dev   # http://localhost:3000
```

Sem `DATABASE_URL`, o desenvolvimento usa um Postgres embutido gravado em `.data/`. Entre com o "acesso de teste" (nome + código `teste`) em duas janelas para simular duas pessoas.

Outros comandos: `npm run build`, `npm run typecheck`, `npm run preview:build`.

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
  clubes/             clubes de leitura (lista, criar, página do clube, configurar)
  configuracoes/      perfil e privacidade
components/           Shelf, Cover, Spine, PostCard, ReviewCard, ReadingCard, Annotations, ClubParts, ClubForm, Logo…
  api/                login (auth), state, action, media
auth.ts               login com Auth.js: Google, Facebook e acesso de teste
lib/logic.ts          regras do app (mesmo código no navegador e no servidor)
lib/server/           banco (db.ts), validação (validate.ts), dados e privacidade (world.ts)
lib/                  tipos, seletores de privacidade, estado do app (store.tsx), dados de exemplo
docs/LOGIN.md         como ligar login e banco na Vercel
docs/schema.prisma    modelo de tabelas para a próxima etapa
```

## Próximos passos

- Passar os dados do documento JSON para tabelas separadas (desenho em `docs/schema.prisma`) quando houver mais gente que os grupos de teste.
- Esconder no servidor o conteúdo de posts com spoiler (hoje ele chega ao navegador e fica borrado na tela).
- Atualização em tempo real (hoje o app busca novidades a cada 20 segundos e ao voltar para a aba).
- Vídeos curtos nas publicações.
