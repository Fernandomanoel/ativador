import type { Annotation, Book, Club, ClubMember, ClubPost, Entry, Format, Post, Scene, State, Status, User } from "./types";

export const STATE_VERSION = 5;

const H = 3600 * 1000;
const D = 24 * H;
const ago = (ms: number) => new Date(Date.now() - ms).toISOString();

const users: User[] = [
  { id: "me", username: "bia.lendo", name: "Bia Andrade", bio: "Leitora lenta, anotadora compulsiva. Café, Clarice e fantasia de capa dura. 📚☕", isPrivate: true, joinedAt: ago(400 * D) },
  { id: "rafa", username: "rafaleu", name: "Rafael Souza", bio: "Ficção científica, fantasia e mapas no começo dos livros. Mestre de RPG nas horas vagas.", isPrivate: false, joinedAt: ago(300 * D) },
  { id: "clara", username: "clara.entrelinhas", name: "Clara Nunes", bio: "Poesia, silêncio e marca-páginas de flor seca.", isPrivate: true, joinedAt: ago(220 * D) },
  { id: "theo", username: "theo.marginalia", name: "Théo Martins", bio: "Escrevo nas margens. Clássicos brasileiros e russos. Professor de literatura.", isPrivate: false, joinedAt: ago(500 * D) },
  { id: "ju", username: "ju.booktok", name: "Juliana Prado", bio: "Romance, drama e muito choro. Se não me destruiu, não foi 5 estrelas. 💔", isPrivate: false, joinedAt: ago(180 * D) },
  { id: "nina", username: "nina.sebo", name: "Nina Okafor", bio: "Garimpo em sebo toda sexta. Edições antigas e cheiro de papel.", isPrivate: true, joinedAt: ago(260 * D) },
  { id: "jp", username: "jp.paginas", name: "João Pedro", bio: "Tentando ler 52 livros este ano. Estou no 31.", isPrivate: false, joinedAt: ago(90 * D) },
  { id: "mari", username: "mari.capitulo", name: "Mariana Lopes", bio: "Suspense psicológico e chá gelado. Tímida, mas leio muito.", isPrivate: true, joinedAt: ago(140 * D) },
  { id: "davi", username: "davi.hq", name: "Davi Rocha", bio: "Quadrinhos, mangá e graphic novels. Sim, isso é leitura.", isPrivate: false, joinedAt: ago(120 * D) },
];

const B = (id: string, title: string, author: string, year: number, pages?: number): Book => ({ id, title, author, year, pages });

/** Catálogo inicial de livros (também usado pelo servidor, sem os leitores de exemplo). */
export const books: Book[] = [
  B("b1", "A Hora da Estrela", "Clarice Lispector", 1977, 88),
  B("b2", "Torto Arado", "Itamar Vieira Junior", 2019, 264),
  B("b3", "Dom Casmurro", "Machado de Assis", 1899, 256),
  B("b4", "Cem Anos de Solidão", "Gabriel García Márquez", 1967, 448),
  B("b5", "Duna", "Frank Herbert", 1965, 680),
  B("b6", "O Hobbit", "J.R.R. Tolkien", 1937, 336),
  B("b7", "Orgulho e Preconceito", "Jane Austen", 1813, 424),
  B("b8", "Os Sete Maridos de Evelyn Hugo", "Taylor Jenkins Reid", 2017, 360),
  B("b9", "É Assim que Acaba", "Colleen Hoover", 2016, 368),
  B("b10", "Corte de Espinhos e Rosas", "Sarah J. Maas", 2015, 434),
  B("b11", "A Biblioteca da Meia-Noite", "Matt Haig", 2020, 308),
  B("b12", "1984", "George Orwell", 1949, 416),
  B("b13", "Grande Sertão: Veredas", "Guimarães Rosa", 1956, 560),
  B("b14", "Memórias Póstumas de Brás Cubas", "Machado de Assis", 1881, 208),
  B("b15", "Quarto de Despejo", "Carolina Maria de Jesus", 1960, 200),
  B("b16", "Tudo é Rio", "Carla Madeira", 2014, 210),
  B("b17", "Ensaio sobre a Cegueira", "José Saramago", 1995, 312),
  B("b18", "O Morro dos Ventos Uivantes", "Emily Brontë", 1847, 400),
  B("b19", "Frankenstein", "Mary Shelley", 1818, 280),
  B("b20", "A Paciente Silenciosa", "Alex Michaelides", 2019, 360),
  B("b21", "Persépolis", "Marjane Satrapi", 2000, 352),
  B("b22", "Crime e Castigo", "Fiódor Dostoiévski", 1866, 568),
  B("b23", "A Mão Esquerda da Escuridão", "Ursula K. Le Guin", 1969, 304),
  B("b24", "Daisy Jones & The Six", "Taylor Jenkins Reid", 2019, 368),
  B("b25", "Verity", "Colleen Hoover", 2018, 320),
  B("b26", "Sentimento do Mundo", "Carlos Drummond de Andrade", 1940, 120),
  B("b27", "Uma Vida Pequena", "Hanya Yanagihara", 2015, 784),
  B("b28", "O Pequeno Príncipe", "Antoine de Saint-Exupéry", 1943, 96),
  B("b29", "Vagabond, vol. 1", "Takehiko Inoue", 1998, 240),
  B("b30", "Mrs. Dalloway", "Virginia Woolf", 1925, 224),
  B("b31", "Pachinko", "Min Jin Lee", 2017, 528),
  B("b32", "O Avesso da Pele", "Jeferson Tenório", 2020, 192),
];

let entryCounter = 0;
const userPos: Record<string, number> = {};

interface EOpts {
  format?: Format;
  labels?: string[];
  review?: string;
  fav?: boolean;
  spoiler?: boolean;
  progress?: number;
  when?: number;
  notes?: Omit<Annotation, "id" | "createdAt">[];
  likes?: string[];
  comments?: [string, string][];
}

function E(userId: string, bookId: string, status: Status, rating: number | undefined, o: EOpts = {}): Entry {
  entryCounter += 1;
  userPos[userId] = (userPos[userId] ?? 0) + 1;
  const t = ago(o.when ?? entryCounter * 7 * H);
  return {
    id: `e${entryCounter}`,
    userId,
    bookId,
    status,
    format: o.format ?? "fisico",
    labels: o.labels ?? [],
    rating,
    progress: o.progress,
    review: o.review ?? "",
    favorite: o.fav ?? false,
    spoiler: o.spoiler ?? false,
    position: userPos[userId],
    finishedAt: status === "lido" ? t : undefined,
    createdAt: t,
    updatedAt: t,
    notes: (o.notes ?? []).map((n, i) => ({ ...n, id: `n${entryCounter}-${i}`, createdAt: t })),
    likes: o.likes ?? [],
    comments: (o.comments ?? []).map(([authorId, body], i) => ({ id: `rc${entryCounter}-${i}`, authorId, body, createdAt: ago((o.when ?? entryCounter * 7 * H) - (i + 1) * H) })),
  };
}

const entries: Entry[] = [
  // Bia (você)
  E("me", "b1", "lido", 10, {
    labels: ["Favoritos da vida", "Nacionais", "Me fez chorar"], fav: true, when: 5 * H,
    review: "Macabéa me atravessou. Clarice escreve como quem pede desculpas por existir e, ao mesmo tempo, grita. Li numa tarde só e fiquei uma semana pensando em \"quem já não se perguntou: sou um monstro ou isto é ser uma pessoa?\". Curto, mas cabe uma vida inteira.",
    notes: [
      { page: 13, quote: "Enquanto eu tiver perguntas e não houver resposta continuarei a escrever.", body: "Isso é sobre a própria Clarice, né? Sublinhei duas vezes." },
      { page: 52, quote: "Ela era subterrânea e nunca tinha tido floração.", body: "A imagem mais triste e bonita do livro." },
    ],
    likes: ["theo", "clara", "ju", "jp"], comments: [["theo", "A Clarice narrando pelo Rodrigo S.M. é um truque genial. Que resenha!"], ["jp", "Vou colocar na minha lista agora mesmo."]],
  }),
  E("me", "b2", "lendo", 9, {
    labels: ["Nacionais", "Clube do livro", "Releitura"], fav: true, when: 3 * D, progress: 120,
    review: "Bibiana e Belonísia carregam o livro nas costas. A segunda parte, narrada pela Belonísia, é das coisas mais poderosas que li na literatura brasileira recente.",
    notes: [{ page: 98, quote: "Sem perceber, já estávamos na terra que era nossa.", body: "Terra, corpo e voz — o tema inteiro do livro nessa frase." }],
    likes: ["theo", "nina"],
  }),
  E("me", "b6", "lido", 8, { format: "fisico", labels: ["Fantasia", "Releitura"], fav: true, when: 10 * D, review: "Releitura de inverno com chá. Bilbo continua sendo o melhor herói relutante. O capítulo das charadas no escuro segue perfeito." }),
  E("me", "b11", "lido", 6, { format: "ebook", labels: ["Booktok"], when: 18 * D, review: "Premissa linda, execução um pouco autoajuda demais. Mas a ideia das infinitas vidas na biblioteca ficou comigo." }),
  E("me", "b17", "lido", 9, { labels: ["Clássicos", "Me fez chorar"], when: 26 * D, review: "Angustiante, necessário. A mulher do médico é das personagens mais fortes que já conheci. Saramago sem travessão e eu sem fôlego.", spoiler: false }),
  E("me", "b23", "lendo", undefined, {
    format: "ebook", labels: ["Ficção científica"], when: 2 * H, progress: 118,
    notes: [
      { page: 44, quote: "A única coisa que torna a vida possível é a incerteza permanente e intolerável.", body: "Vou usar isso como epígrafe da vida." },
      { page: 97, quote: "", body: "Ainda não entendi bem o kemmer. Perguntar no clube.", isPrivate: true },
      { page: 118, quote: "", body: "Genly e Estraven finalmente conversando de verdade. A amizade mais lenta e bonita.", },
    ],
  }),
  E("me", "b30", "lendo", undefined, { format: "audiobook", labels: ["Clássicos"], when: 30 * H, progress: 96, notes: [{ page: 60, quote: "", body: "No audiobook o fluxo de consciência fica hipnótico. Ouvindo no ônibus.", isPrivate: true }] }),
  E("me", "b16", "lido", 8, { labels: ["Nacionais", "Romance", "Me fez chorar"], when: 40 * D, review: "Lucy, Venâncio e Dalva. Carla Madeira escreve com faca. Precisei parar algumas vezes." }),
  E("me", "b28", "lido", 7, { labels: ["Clássicos", "Releitura"], when: 60 * D }),
  E("me", "b8", "lido", 8, { format: "ebook", labels: ["Romance", "Booktok"], when: 75 * D, review: "Entendi o hype. Evelyn é uma personagem enorme." }),
  E("me", "b26", "lido", 9, { labels: ["Poesia", "Nacionais"], when: 90 * D, fav: true, review: "\"Tenho apenas duas mãos e o sentimento do mundo.\" Drummond para ler em voz alta." }),
  E("me", "b5", "quero-ler", undefined, { labels: ["Ficção científica"], when: 4 * D }),
  E("me", "b13", "quero-ler", undefined, { labels: ["Nacionais", "Clássicos"], when: 12 * D }),
  E("me", "b10", "abandonado", 4, { format: "ebook", labels: ["Fantasia", "Booktok"], when: 50 * D, review: "Tentei, juro. Parei na metade. Talvez não seja o momento." }),

  // Rafael
  E("rafa", "b5", "lido", 10, { labels: ["Ficção científica", "Favoritos da vida"], fav: true, when: 8 * H, review: "O medo é o assassino da mente. Política, ecologia, religião e vermes gigantes. Obra-prima absoluta da ficção científica.", likes: ["me", "jp", "davi"], comments: [["me", "Está na minha lista de quero ler faz um ano, você me convenceu."], ["rafa", "@bia.lendo vai sem medo! Os apêndices também valem."]] }),
  E("rafa", "b6", "lido", 9, { labels: ["Fantasia", "Releitura"], when: 20 * D, review: "Todo ano no mês de dezembro." }),
  E("rafa", "b23", "lido", 9, { format: "ebook", labels: ["Ficção científica"], when: 35 * D, review: "Le Guin pensando gênero em 1969 com uma delicadeza absurda. A travessia do gelo é inesquecível." }),
  E("rafa", "b12", "lido", 8, { labels: ["Ficção científica", "Clássicos"], when: 70 * D }),
  E("rafa", "b19", "lendo", undefined, { format: "audiobook", labels: ["Terror", "Clássicos"], when: 1 * D, progress: 140, notes: [{ page: 120, quote: "Cuidado, pois sou destemido e, portanto, poderoso.", body: "A criatura é muito mais eloquente do que os filmes deixam parecer." }] }),
  E("rafa", "b10", "lido", 7, { labels: ["Fantasia", "Booktok"], when: 45 * D, review: "Começa devagar, o segundo livro é que salva. Mas fadas sexy não são minha praia." }),

  // Clara (privada)
  E("clara", "b26", "lido", 10, { labels: ["Poesia", "Favoritos da vida"], fav: true, when: 2 * D, review: "Volto a esse livro sempre que o mundo pesa." }),
  E("clara", "b1", "lido", 10, { labels: ["Nacionais", "Favoritos da vida"], fav: true, when: 30 * D }),
  E("clara", "b30", "lido", 9, { labels: ["Clássicos"], when: 15 * D, review: "Um dia inteiro dentro da cabeça de Clarissa. Woolf faz o tempo escorrer." }),
  E("clara", "b18", "lendo", undefined, { labels: ["Clássicos", "Romance"], when: 5 * H, progress: 210, notes: [{ page: 88, quote: "Seja do que forem feitas as nossas almas, a dele e a minha são iguais.", body: "" }, { page: 190, quote: "", body: "Heathcliff é insuportável e eu não consigo parar de ler.", isPrivate: true }] }),

  // Théo
  E("theo", "b3", "lido", 10, { labels: ["Clássicos", "Nacionais", "Releitura"], fav: true, when: 1 * D, review: "Capitu traiu? Pergunta errada. A pergunta é: por que confiamos em Bentinho? Machado constrói o narrador menos confiável da nossa literatura e nos faz cúmplices.", notes: [{ page: 64, quote: "Olhos de cigana oblíqua e dissimulada.", body: "Note quem diz isso: José Dias. A imagem é emprestada, não é do Bento." }, { page: 182, quote: "A minha primeira amiga e o meu maior amigo, tão extremosos ambos e tão queridos também, quis o destino que acabassem juntando-se e enganando-me...", body: "O \"quis o destino\" é a confissão do ciúme." }], likes: ["me", "jp", "nina", "clara"], comments: [["jp", "Sempre achei que ela traiu, agora fiquei na dúvida kkk"], ["theo", "@jp.paginas essa é a mágica do livro!"]] }),
  E("theo", "b14", "lido", 10, { labels: ["Clássicos", "Nacionais"], fav: true, when: 25 * D, review: "Ao verme que primeiro roeu as frias carnes do meu cadáver... A dedicatória mais genial da história." }),
  E("theo", "b22", "lido", 10, { labels: ["Clássicos"], fav: true, when: 50 * D, review: "Raskólnikov e a febre. Dostoiévski escreve o pensamento antes do pensamento." }),
  E("theo", "b13", "lido", 10, { labels: ["Clássicos", "Nacionais"], fav: true, when: 120 * D, review: "Nonada. Travessia." }),
  E("theo", "b15", "lido", 9, { labels: ["Nacionais", "Não-ficção"], when: 10 * D, review: "Carolina escreve a fome com uma precisão que nenhum romance alcança. Leitura obrigatória." }),
  E("theo", "b32", "lendo", undefined, { labels: ["Nacionais"], when: 6 * H, progress: 60, notes: [{ page: 31, quote: "", body: "A segunda pessoa como recurso de luto. Tenório escreve para o pai e para nós." }] }),

  // Juliana
  E("ju", "b9", "lido", 9, { format: "ebook", labels: ["Romance", "Booktok", "Me fez chorar"], when: 4 * H, review: "Chorei no ônibus. Chorei no trabalho. Chorei escrevendo essa resenha. Lily merecia o mundo. 😭", likes: ["mari", "jp"], comments: [["mari", "Eu li em um dia e fiquei destruída"]] }),
  E("ju", "b8", "lido", 10, { labels: ["Romance", "Booktok", "Favoritos da vida"], fav: true, when: 20 * D, review: "EVELYN HUGO. Só isso. Leiam." }),
  E("ju", "b24", "lido", 9, { format: "audiobook", labels: ["Romance", "Booktok"], when: 30 * D, review: "No audiobook parece um documentário de verdade!" }),
  E("ju", "b10", "lido", 10, { labels: ["Fantasia", "Romance", "Booktok"], fav: true, when: 40 * D, review: "Rhysand. Não preciso dizer mais nada." }),
  E("ju", "b25", "lido", 8, { format: "ebook", labels: ["Suspense", "Booktok"], when: 55 * D, review: "O final me deixou de boca aberta por dez minutos." }),
  E("ju", "b27", "lendo", undefined, {
    labels: ["Me fez chorar"], when: 3 * H, progress: 312,
    notes: [
      { page: 96, quote: "", body: "Diário de leitura, dia 1: os quatro amigos já me conquistaram. Willem é meu favorito. 💛", },
      { page: 210, quote: "Amizade é observar alguém de perto, saber o que está acontecendo.", body: "Tô sublinhando metade do livro. Fotos amanhã!", },
      { page: 312, quote: "", body: "Parei pra respirar. Gente, avisem quando eu precisar de lenço.", },
      { page: 300, quote: "", body: "Ideia de vídeo: ranking dos personagens até a metade.", isPrivate: true },
    ],
  }),

  // Nina (privada, você segue)
  E("nina", "b4", "lido", 10, { labels: ["Clássicos", "Favoritos da vida"], fav: true, when: 9 * D, review: "Edição de 1977 achada num sebo do centro por 12 reais. Macondo nunca foi tão cheiroso." }),
  E("nina", "b31", "lido", 9, { labels: ["Romance"], when: 22 * D, review: "Quatro gerações e eu emocionada em todas." }),
  E("nina", "b7", "lido", 8, { labels: ["Clássicos", "Romance", "Releitura"], when: 44 * D }),
  E("nina", "b2", "lendo", undefined, { labels: ["Nacionais"], when: 12 * H, progress: 150, notes: [{ page: 140, quote: "", body: "Lendo junto com o clube. A faca da avó é o objeto mais carregado de sentido que já vi.", }] }),

  // João Pedro
  E("jp", "b12", "lido", 8, { format: "ebook", labels: ["Ficção científica", "Clássicos"], when: 2 * D, review: "Assustador como ainda é atual. Livro 31/52!" }),
  E("jp", "b20", "lido", 7, { labels: ["Suspense"], when: 6 * D, review: "Previ o plot twist na página 200 mas mesmo assim gostei." }),
  E("jp", "b11", "lido", 8, { format: "ebook", labels: ["Booktok"], when: 14 * D }),
  E("jp", "b28", "lendo", undefined, { labels: ["Clássicos"], when: 10 * H, progress: 40 }),

  // Mariana (privada)
  E("mari", "b20", "lido", 9, { labels: ["Suspense", "Favoritos da vida"], fav: true, when: 7 * D, review: "Não leia nenhuma resenha antes. Nem esta." }),
  E("mari", "b25", "lido", 9, { format: "ebook", labels: ["Suspense", "Booktok"], when: 16 * D }),
  E("mari", "b9", "lido", 8, { format: "ebook", labels: ["Romance", "Booktok"], when: 33 * D }),

  // Davi
  E("davi", "b21", "lido", 10, { labels: ["HQ & mangá", "Não-ficção", "Favoritos da vida"], fav: true, when: 3 * D, review: "Autobiografia em preto e branco que diz mais sobre o Irã que qualquer livro de história.", likes: ["theo", "me"] }),
  E("davi", "b29", "lido", 10, { labels: ["HQ & mangá"], fav: true, when: 11 * D, review: "Cada quadro do Inoue é uma pintura." }),
  E("davi", "b19", "lido", 7, { labels: ["Terror", "Clássicos"], when: 19 * D }),
];

const P = (id: string, authorId: string, hoursAgo: number, caption: string, scene: Scene, bookId?: string, likes: string[] = [], comments: [string, string][] = []): Post => ({
  id,
  authorId,
  scene,
  caption,
  bookId,
  createdAt: ago(hoursAgo * H),
  likes,
  comments: comments.map(([authorId, body], i) => ({ id: `${id}c${i}`, authorId, body, createdAt: ago((hoursAgo - i - 0.5) * H) })),
});

const posts: Post[] = [
  P("p1", "ju", 1.5, "Pilha da semana!! Qual eu começo? 👀 #booktok #tbr", { kind: "stack", tone: 1, bookIds: ["b27", "b24", "b25", "b8", "b9"] }, undefined, ["me", "mari", "jp", "rafa"], [["mari", "Uma Vida Pequena e se prepara pra sofrer"], ["me", "Evelyn Hugo de novo? kkkk"]]),
  P("p2", "theo", 5, "Margens de Dom Casmurro, 14ª releitura. Cada vez um lápis de cor diferente.", { kind: "open", tone: 2, bookIds: ["b3"], text: "Olhos de cigana oblíqua e dissimulada." }, "b3", ["me", "jp", "nina"], [["jp", "Que caligrafia linda, professor"]]),
  P("p3", "rafa", 9, "Chegou! Edição de colecionador com mapa desdobrável 🏜️", { kind: "flatlay", tone: 3, bookIds: ["b5"] }, "b5", ["jp", "davi", "me"], [["davi", "Que capa absurda"]]),
  P("p4", "nina", 14, "Achados de sexta no sebo. 12 reais o Cem Anos, dá pra acreditar?", { kind: "shelf", tone: 4, bookIds: ["b4", "b7", "b31", "b18", "b30", "b22"] }, "b4", ["me", "theo"], [["me", "Nina me leva no próximo garimpo!!"]]),
  P("p5", "me", 20, "Terminei A Hora da Estrela e não sei o que fazer com meus sentimentos.", { kind: "quote", tone: 5, bookIds: ["b1"], text: "Enquanto eu tiver perguntas e não houver resposta continuarei a escrever." }, "b1", ["theo", "clara", "ju", "nina"], [["clara", "Clarice sempre faz isso com a gente."]]),
  P("p6", "davi", 28, "Domingo de Vagabond. Volume 1 relido pela terceira vez.", { kind: "flatlay", tone: 6, bookIds: ["b29"] }, "b29", ["rafa"]),
  P("p7", "jp", 33, "31 de 52. A meta tá viva!", { kind: "stack", tone: 7, bookIds: ["b12", "b20", "b11", "b28"] }, undefined, ["ju", "me"], [["ju", "Bora que dá!!"]]),
  P("p8", "clara", 40, "Drummond em voz baixa.", { kind: "quote", tone: 8, bookIds: ["b26"], text: "Tenho apenas duas mãos e o sentimento do mundo." }, "b26", ["me"]),
  P("p9", "mari", 52, "Leitura de madrugada, chá gelado e nenhum barulho.", { kind: "flatlay", tone: 2, bookIds: ["b20"] }, "b20", ["ju"]),
  P("p10", "me", 70, "Minha estante de nacionais ganhou reforço 🇧🇷", { kind: "shelf", tone: 9, bookIds: ["b2", "b16", "b1", "b26", "b13", "b15"] }, undefined, ["theo", "nina", "jp"], [["theo", "Que curadoria!"]]),
  P("p11", "ju", 80, "Sobrevivi (mais ou menos) a É Assim que Acaba.", { kind: "quote", tone: 1, bookIds: ["b9"], text: "Só porque alguém não está sangrando, não significa que não esteja ferido." }, "b9", ["mari", "jp", "me"]),
  P("p12", "theo", 100, "Uma página de Grande Sertão por dia.", { kind: "open", tone: 4, bookIds: ["b13"], text: "Viver é muito perigoso." }, "b13", ["me", "clara"]),
  P("p13", "rafa", 130, "Pilha de inverno: tudo que tenha neve ou dragão.", { kind: "stack", tone: 3, bookIds: ["b6", "b23", "b10", "b19"] }, undefined, ["ju", "davi"]),
];


/* ---------- Clubes de leitura ---------- */

const clubs: Club[] = [
  {
    id: "c1", name: "Clube da Clarice", tone: 0, ownerId: "me", focus: "nacionais", access: "aprovacao", spoilerPolicy: "sem-spoiler", maxMembers: 30,
    areas: ["anotacoes", "resenhas", "duvidas", "cronograma", "conversa"], bookId: "b2", createdAt: ago(120 * D),
    description: "Literatura brasileira, um livro por mês, sem pressa e sem spoiler.",
    rules: "1. Nada de spoiler fora das páginas marcadas.\n2. Resenhas do mês até o dia 30.\n3. Gentileza sempre.",
  },
  {
    id: "c2", name: "Estudos Machadianos", tone: 1, ownerId: "theo", focus: "estudos", access: "aberto", spoilerPolicy: "liberado", maxMembers: 50,
    areas: ["estudos", "duvidas", "anotacoes", "cronograma"], bookId: "b3", createdAt: ago(300 * D),
    description: "Grupo de estudo para vestibular, faculdade e curiosos. Fichamentos, contexto e muita discussão sobre narradores.",
    rules: "Spoilers liberados: aqui a gente estuda a obra inteira.",
  },
  {
    id: "c3", name: "Painel & Quadrinho", tone: 2, ownerId: "davi", focus: "quadrinhos", access: "aberto", spoilerPolicy: "marcados", maxMembers: 50,
    areas: ["galeria", "resenhas", "conversa"], bookId: "b29", createdAt: ago(90 * D),
    description: "Quadrinhos, mangás e graphic novels. Compartilhe páginas, quadros favoritos e edições da sua coleção.",
    rules: "Marque spoilers. Poste o volume e o capítulo na legenda.",
  },
  {
    id: "c4", name: "Romances que Destroem", tone: 3, ownerId: "ju", focus: "booktok", access: "aprovacao", spoilerPolicy: "sem-spoiler", maxMembers: 5,
    areas: ["resenhas", "galeria", "conversa"], bookId: "b27", createdAt: ago(60 * D),
    description: "Só livros que fazem chorar. Grupo pequeno e íntimo de booktokers.",
    rules: "Proibido spoiler. Lencinhos por sua conta.",
  },
];

const M = (clubId: string, userId: string, role: ClubMember["role"] = "membro", days = 30): ClubMember => ({ clubId, userId, role, joinedAt: ago(days * D) });

const clubMembers: ClubMember[] = [
  M("c1", "me", "dono", 120), M("c1", "nina", "moderador", 110), M("c1", "theo", "membro", 100), M("c1", "clara", "membro", 50), M("c1", "jp", "membro", 20),
  M("c2", "theo", "dono", 300), M("c2", "me", "membro", 200), M("c2", "jp", "membro", 60), M("c2", "nina", "membro", 90),
  M("c3", "davi", "dono", 90), M("c3", "rafa", "moderador", 80),
  M("c4", "ju", "dono", 60), M("c4", "mari", "moderador", 55), M("c4", "jp", "membro", 30), M("c4", "nina", "membro", 20), M("c4", "clara", "membro", 10),
];

const CP = (
  id: string, clubId: string, area: ClubPost["area"], authorId: string, hoursAgo: number, title: string, body: string,
  extra: Partial<ClubPost> = {}, replies: [string, string][] = [],
): ClubPost => ({
  id, clubId, area, authorId, title, body, spoiler: false, createdAt: ago(hoursAgo * H), likes: [],
  ...extra,
  replies: replies.map(([authorId, body], i) => ({ id: `${id}r${i}`, authorId, body, createdAt: ago((hoursAgo - i - 1) * H) })),
});

const clubPosts: ClubPost[] = [
  // Clube da Clarice — Torto Arado
  CP("cp1", "c1", "cronograma", "me", 200, "Cronograma de outubro: Torto Arado", "Semana 1: até a p. 70 (fim de \"Fio de corte\")\nSemana 2: até a p. 140\nSemana 3: até a p. 200\nSemana 4: fim + resenhas do mês", { bookId: "b2", pinned: true, likes: ["nina", "theo", "jp"] }),
  CP("cp2", "c1", "anotacoes", "nina", 30, "A faca da avó", "O objeto atravessa a história inteira e muda de significado a cada parte. Reparem no que acontece com ela.", { bookId: "b2", page: 140, likes: ["me"] }, [["me", "Sim!! Arrepiei na p. 138."]]),
  CP("cp3", "c1", "anotacoes", "theo", 20, "Quando a narradora muda", "A virada de narradora é o coração do livro — e o que ela revela muda tudo que lemos antes.", { bookId: "b2", page: 190, likes: ["clara"] }),
  CP("cp4", "c1", "duvidas", "jp", 26, "O que é o Jarê?", "Aparece várias vezes e eu não conhecia. É uma religião?", { bookId: "b2", page: 45, resolved: true }, [["nina", "É uma religião de matriz africana da Chapada Diamantina, com elementos do candomblé e do espiritismo. O livro trata com muito respeito."], ["jp", "Obrigado, Nina! Agora faz muito mais sentido."]]),
  CP("cp5", "c1", "duvidas", "clara", 6, "Alguém achou a edição com o posfácio?", "A minha não tem e queria ler o comentário do autor.", { bookId: "b2" }),
  CP("cp6", "c1", "resenhas", "theo", 50, "Torto Arado — 5 estrelas", "Um livro sobre terra e voz. Itamar recupera o romance regionalista sem nenhuma nostalgia.", { bookId: "b2", rating: 10, spoiler: false, likes: ["me", "nina"] }),
  CP("cp7", "c1", "conversa", "me", 4, "Próxima leitura?", "Estou pensando entre Quarto de Despejo e Tudo é Rio para novembro. Votem nos comentários!", { likes: ["jp"] }, [["theo", "Quarto de Despejo, sem dúvida."], ["clara", "Tudo é Rio 🥹"]]),

  // Estudos Machadianos — Dom Casmurro
  CP("cp8", "c2", "estudos", "theo", 100, "Fichamento: o narrador não confiável", "Bento escreve décadas depois, já convencido da traição. Tudo o que vemos de Capitu passa por esse filtro. Pontos para discutir:\n• quem dá a Capitu os \"olhos de ressaca\"?\n• o capítulo do retrato de Escobar\n• o título \"Dom Casmurro\" como apelido dado pelos outros", { bookId: "b3", pinned: true, likes: ["me", "jp", "nina"] }, [["jp", "Isso cai no vestibular, né?"], ["theo", "Cai bastante! Principalmente a questão do narrador."]]),
  CP("cp9", "c2", "duvidas", "jp", 12, "Escobar era mesmo o pai?", "No final ele afirma que Ezequiel é igual ao Escobar. A gente pode confiar?", { bookId: "b3", page: 240 }, [["theo", "Essa é a pergunta que o livro quer que você faça — e não responde. Repare que quem vê a semelhança é sempre o Bento."]]),
  CP("cp10", "c2", "anotacoes", "me", 40, "Capítulo dos olhos de ressaca", "\"Olhos de ressaca? Vá, de ressaca.\" — a imagem do mar puxando é perfeita para o ciúme dele.", { bookId: "b3", page: 64, likes: ["theo"] }),

  // Painel & Quadrinho
  CP("cp11", "c3", "galeria", "davi", 8, "Vagabond vol. 1 — a luta no vilarejo", "O traço do Inoue nesse capítulo é absurdo. Olhem a expressão do Takezo.", { bookId: "b29", likes: ["rafa"], scene: { kind: "flatlay", tone: 5, bookIds: ["b29"] } }, [["rafa", "Esse volume me fez começar a ler mangá."]]),
  CP("cp12", "c3", "galeria", "rafa", 30, "Minha coleção de Persépolis", "Edição completa capa dura, achada num sebo. Alguém tem a edição em dois volumes?", { bookId: "b21", scene: { kind: "stack", tone: 7, bookIds: ["b21", "b29", "b19"] } }),
  CP("cp13", "c3", "resenhas", "davi", 60, "Persépolis — obra-prima", "Preto e branco, traço simples, impacto enorme.", { bookId: "b21", rating: 10, spoiler: true }),

  // Romances que Destroem
  CP("cp14", "c4", "resenhas", "mari", 24, "Uma Vida Pequena até a p. 300", "Sem spoiler: preparem o coração. Estou mais apegada ao Willem do que a pessoas reais.", { bookId: "b27", page: 300, likes: ["ju"] }),
  CP("cp15", "c4", "conversa", "ju", 3, "Live de domingo?", "Quem topa uma live lendo juntos domingo às 20h?", { likes: ["mari", "jp", "nina"] }, [["nina", "Eu!"]]),
];

export function makeSeed(): State {
  return {
    version: STATE_VERSION,
    meId: "me",
    users,
    books,
    entries: entries.map((e) => ({ ...e })),
    posts,
    follows: [
      // você segue
      { from: "me", to: "rafa", createdAt: ago(200 * D) },
      { from: "me", to: "theo", createdAt: ago(300 * D) },
      { from: "me", to: "ju", createdAt: ago(100 * D) },
      { from: "me", to: "nina", createdAt: ago(80 * D) },
      { from: "me", to: "davi", createdAt: ago(60 * D) },
      // seguem você
      { from: "theo", to: "me", createdAt: ago(290 * D) },
      { from: "nina", to: "me", createdAt: ago(79 * D) },
      { from: "ju", to: "me", createdAt: ago(90 * D) },
      { from: "clara", to: "me", createdAt: ago(50 * D) },
      // entre eles
      { from: "rafa", to: "davi", createdAt: ago(100 * D) },
      { from: "davi", to: "rafa", createdAt: ago(100 * D) },
      { from: "jp", to: "theo", createdAt: ago(80 * D) },
      { from: "jp", to: "ju", createdAt: ago(80 * D) },
      { from: "jp", to: "rafa", createdAt: ago(70 * D) },
      { from: "mari", to: "ju", createdAt: ago(60 * D) },
      { from: "ju", to: "mari", createdAt: ago(60 * D) },
      { from: "theo", to: "clara", createdAt: ago(150 * D) },
      { from: "clara", to: "theo", createdAt: ago(150 * D) },
      { from: "nina", to: "theo", createdAt: ago(100 * D) },
      { from: "theo", to: "nina", createdAt: ago(100 * D) },
    ],
    requests: [
      // pedidos para você (conta privada)
      { from: "jp", to: "me", createdAt: ago(3 * H) },
      { from: "davi", to: "me", createdAt: ago(26 * H) },
      // seu pedido pendente para Clara
      { from: "me", to: "clara", createdAt: ago(4 * D) },
    ],
    notes: [
      { id: "nt1", from: "jp", to: "me", body: "Oi Bia! Vi sua resenha de A Hora da Estrela pelo perfil do Théo e amei. Também estou tentando ler mais nacionais — posso te seguir? 🙂", createdAt: ago(3 * H) },
      { id: "nt2", from: "me", to: "clara", body: "Clara, suas resenhas de poesia são lindas. Tô começando a ler Drummond e queria acompanhar suas fotos!", createdAt: ago(4 * D), reply: "Obrigada, de verdade 🌿 Sou bem tímida com o perfil, mas a minha estante está aberta — começa por Sentimento do Mundo.", repliedAt: ago(3 * D) },
    ],
    notifs: [
      { id: "nf1", to: "me", actor: "jp", type: "follow_request", createdAt: ago(3 * H), read: false },
      { id: "nf2", to: "me", actor: "jp", type: "note", createdAt: ago(3 * H), read: false },
      { id: "nf3", to: "me", actor: "theo", type: "like_review", entryId: "e1", createdAt: ago(4 * H), read: false },
      { id: "nf4", to: "me", actor: "theo", type: "comment_review", entryId: "e1", createdAt: ago(4 * H), read: false },
      { id: "nf5", to: "me", actor: "clara", type: "comment_post", postId: "p5", createdAt: ago(18 * H), read: true },
      { id: "nf6", to: "me", actor: "davi", type: "follow_request", createdAt: ago(26 * H), read: true },
      { id: "nf7", to: "me", actor: "nina", type: "like_post", postId: "p5", createdAt: ago(30 * H), read: true },
      { id: "nf8", to: "me", actor: "clara", type: "note_reply", createdAt: ago(3 * D), read: true },
      { id: "nf9", to: "me", actor: "mari", type: "club_request", clubId: "c1", createdAt: ago(5 * H), read: false },
    ],
    clubs,
    clubMembers,
    // Pedidos para entrar no Clube da Clarice, que você modera. O clube da Ju (5/5) está cheio.
    clubRequests: [
      { clubId: "c1", userId: "mari", createdAt: ago(5 * H) },
      { clubId: "c1", userId: "davi", createdAt: ago(30 * H) },
    ],
    clubPosts,
  };
}
