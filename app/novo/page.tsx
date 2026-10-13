"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { IconImage, IconLock } from "@/components/Icons";
import { bookById, entriesOf } from "@/lib/selectors";
import { useStore } from "@/lib/store";
import { fileToDataUrl } from "@/lib/util";

export default function NewPostPage() {
  const { state, me, actions } = useStore();
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [bookId, setBookId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const myBooks = entriesOf(state, me.id);

  async function take(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Envie uma foto (JPG, PNG, WEBP…).");
    try {
      setError(null);
      setImage(await fileToDataUrl(file));
    } catch {
      setError("Não consegui ler esta imagem.");
    }
  }

  return (
    <div className="new-post">
      <h1 className="page-title">Nova publicação</h1>
      <div className="new-post-grid">
        <div
          className={drag ? "dropzone drag" : "dropzone"}
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            take(e.dataTransfer.files[0]);
          }}
          onClick={() => input.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && input.current?.click()}
        >
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="Pré-visualização" />
          ) : (
            <div className="dropzone-empty">
              <IconImage size={56} />
              <p>Arraste a foto aqui</p>
              <span className="btn btn-primary btn-sm">Escolher do dispositivo</span>
            </div>
          )}
          <input ref={input} type="file" accept="image/*" hidden onChange={(e) => take(e.target.files?.[0])} />
        </div>

        <form
          className="new-post-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!image) return setError("Escolha uma foto primeiro.");
            const id = actions.createPost({ image, caption: caption.trim(), bookId: bookId || undefined });
            actions.toast("Foto publicada!");
            router.push(`/p/${id}`);
          }}
        >
          <div className="new-post-user">
            <Avatar user={me} size={32} /> <strong>{me.username}</strong>
          </div>
          <label className="field">
            <span className="field-label">Legenda</span>
            <textarea rows={5} maxLength={2200} value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Escreva uma legenda… #booktok" />
            <span className="field-hint">{caption.length}/2.200</span>
          </label>
          <label className="field">
            <span className="field-label">Marcar livro da sua estante</span>
            <select value={bookId} onChange={(e) => setBookId(e.target.value)}>
              <option value="">Nenhum</option>
              {myBooks.map((e) => (
                <option key={e.id} value={e.bookId}>
                  {bookById(state, e.bookId)?.title}
                </option>
              ))}
            </select>
          </label>
          <p className="muted small privacy-hint">
            {me.isPrivate ? (
              <>
                <IconLock size={12} /> Sua conta é privada: só seguidores aprovados verão esta foto.
              </>
            ) : (
              <>
                Sua conta é pública: qualquer leitor verá esta foto. <Link href="/configuracoes">Alterar</Link>
              </>
            )}
          </p>
          {error && <p className="form-error">{error}</p>}
          <div className="modal-actions">
            {image && (
              <button type="button" className="btn btn-ghost" onClick={() => setImage(null)}>
                Trocar foto
              </button>
            )}
            <button className="btn btn-primary" type="submit" disabled={!image}>
              Compartilhar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
