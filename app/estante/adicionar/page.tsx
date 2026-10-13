"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Cover } from "@/components/Cover";
import { draftOf, emptyDraft, EntryEditor } from "@/components/EntryEditor";
import { IconSearch } from "@/components/Icons";
import { bookById, entryFor } from "@/lib/selectors";
import { useStore } from "@/lib/store";
import type { Book } from "@/lib/types";
import { fileToDataUrl } from "@/lib/util";

type Found = Omit<Book, "id"> & { id?: string; olKey?: string };

const norm = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

function AddBook() {
  const { state, me, actions } = useStore();
  const router = useRouter();
  const params = useSearchParams();
  const preset = bookById(state, params.get("livro") ?? undefined);

  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<Found | null>(preset ?? null);
  const [remote, setRemote] = useState<Found[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [remoteError, setRemoteError] = useState<string | null>(null);
  const [manual, setManual] = useState(false);
  const [m, setM] = useState({ title: "", author: "", year: "", cover: "" });

  const local = q.trim()
    ? state.books.filter((b) => norm(b.title + " " + b.author).includes(norm(q.trim()))).slice(0, 12)
    : state.books.slice(0, 12);

  async function searchOpenLibrary() {
    if (!q.trim()) return;
    setLoading(true);
    setRemoteError(null);
    try {
      const res = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=12&fields=key,title,author_name,first_publish_year,cover_i,number_of_pages_median`);
      const data = await res.json();
      setRemote(
        (data.docs ?? []).map((d: { key: string; title: string; author_name?: string[]; first_publish_year?: number; cover_i?: number; number_of_pages_median?: number }) => ({
          olKey: d.key,
          title: d.title,
          author: d.author_name?.[0] ?? "Autor desconhecido",
          year: d.first_publish_year,
          pages: d.number_of_pages_median,
          coverUrl: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg` : undefined,
        })),
      );
    } catch {
      setRemoteError("Não foi possível falar com a Open Library agora. Cadastre o livro manualmente.");
    } finally {
      setLoading(false);
    }
  }

  if (picked) {
    const existing = picked.id ? entryFor(state, me.id, picked.id) : undefined;
    const previewBook: Book = { id: picked.id ?? "preview", ...picked };
    return (
      <div className="narrow">
        <button className="link-btn" onClick={() => setPicked(null)}>
          ← Escolher outro livro
        </button>
        <div className="add-picked">
          <Cover book={previewBook} size="md" />
          <div>
            <h1 className="entry-title">{picked.title}</h1>
            <p className="entry-author">
              de <strong>{picked.author}</strong> {picked.year && <span className="muted">· {picked.year}</span>}
            </p>
            {existing && <p className="pill">Já está na sua estante — salvar vai atualizar.</p>}
          </div>
        </div>
        <EntryEditor
          initial={existing ? draftOf(existing) : emptyDraft()}
          submitLabel={existing ? "Atualizar estante" : "Colocar na estante"}
          onCancel={() => setPicked(null)}
          onSubmit={(d) => {
            const bookId = picked.id ?? actions.addBook({ title: picked.title, author: picked.author, year: picked.year, pages: picked.pages, coverUrl: picked.coverUrl });
            actions.addEntry({ ...d, bookId });
            actions.toast("Livro na estante!");
            router.push(`/u/${me.username}/livro/${bookId}`);
          }}
        />
      </div>
    );
  }

  return (
    <div className="narrow">
      <h1 className="page-title">Adicionar à estante</h1>
      <form
        className="search-bar"
        onSubmit={(e) => {
          e.preventDefault();
          searchOpenLibrary();
        }}
      >
        <IconSearch size={18} />
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Título ou autor…" aria-label="Buscar livro" />
        <button className="btn btn-secondary btn-sm" type="submit" disabled={!q.trim() || loading}>
          {loading ? "Buscando…" : "Buscar na Open Library"}
        </button>
      </form>

      <h2 className="section-title">No Vivlío</h2>
      {local.length ? (
        <div className="pick-grid">
          {local.map((b) => (
            <button key={b.id} className="pick" onClick={() => setPicked(b)}>
              <Cover book={b} size="sm" />
              <span className="pick-title">{b.title}</span>
              <span className="muted small">{b.author}</span>
              {entryFor(state, me.id, b.id) && <span className="pill">na estante</span>}
            </button>
          ))}
        </div>
      ) : (
        <p className="muted">Nada encontrado no catálogo do Vivlío.</p>
      )}

      {remoteError && <p className="form-error">{remoteError}</p>}
      {remote && (
        <>
          <h2 className="section-title">Open Library</h2>
          {remote.length ? (
            <div className="pick-grid">
              {remote.map((b) => (
                <button key={b.olKey} className="pick" onClick={() => setPicked(state.books.find((x) => norm(x.title) === norm(b.title) && norm(x.author) === norm(b.author)) ?? b)}>
                  <Cover book={{ id: b.olKey ?? b.title, ...b }} size="sm" />
                  <span className="pick-title">{b.title}</span>
                  <span className="muted small">
                    {b.author} {b.year ? `· ${b.year}` : ""}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="muted">Nenhum resultado.</p>
          )}
        </>
      )}

      <div className="manual">
        {!manual ? (
          <button className="link-btn" onClick={() => setManual(true)}>
            Não achou? Cadastre o livro manualmente
          </button>
        ) : (
          <form
            className="manual-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (!m.title.trim() || !m.author.trim()) return;
              setPicked({ title: m.title.trim(), author: m.author.trim(), year: m.year ? Number(m.year) : undefined, coverUrl: m.cover || undefined });
            }}
          >
            <h2 className="section-title">Cadastro manual</h2>
            <label className="field">
              <span className="field-label">Título</span>
              <input required value={m.title} onChange={(e) => setM({ ...m, title: e.target.value })} />
            </label>
            <label className="field">
              <span className="field-label">Autor(a)</span>
              <input required value={m.author} onChange={(e) => setM({ ...m, author: e.target.value })} />
            </label>
            <label className="field">
              <span className="field-label">Ano</span>
              <input type="number" value={m.year} onChange={(e) => setM({ ...m, year: e.target.value })} />
            </label>
            <label className="field">
              <span className="field-label">Foto da capa (opcional)</span>
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f) setM({ ...m, cover: await fileToDataUrl(f, 600) });
                }}
              />
            </label>
            <button className="btn btn-primary" type="submit">
              Continuar
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function AddBookPage() {
  return (
    <Suspense>
      <AddBook />
    </Suspense>
  );
}
