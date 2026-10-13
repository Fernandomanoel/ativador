"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar } from "@/components/Avatar";
import { IconLock } from "@/components/Icons";
import { incomingRequests } from "@/lib/selectors";
import { useStore } from "@/lib/store";
import { mediaToDataUrl } from "@/lib/util";
import { CoverPicker } from "@/components/CoverPicker";

export default function SettingsPage() {
  const { state, me, actions } = useStore();
  const router = useRouter();
  const [form, setForm] = useState({ name: me.name, username: me.username, bio: me.bio, avatar: me.avatar, cover: me.cover, isPrivate: me.isPrivate });
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pending = incomingRequests(state).length;

  return (
    <div className="narrow">
      <h1 className="page-title">Editar perfil</h1>
      <form
        className="settings"
        onSubmit={(e) => {
          e.preventDefault();
          if (!form.isPrivate && me.isPrivate && pending > 0 && !confirm(`Tornar a conta pública vai aprovar ${pending} pedido(s) pendente(s). Continuar?`)) return;
          const err = actions.updateProfile({ ...form, name: form.name.trim() || me.name, bio: form.bio.slice(0, 150) });
          if (err) return setError(err);
          actions.toast("Perfil atualizado");
          router.push(`/u/${form.username.trim().toLowerCase()}`);
        }}
      >
        <CoverPicker label="Capa do perfil" value={form.cover} onChange={(cover) => setForm({ ...form, cover })} />

        <div className="settings-avatar">
          <Avatar user={{ ...me, avatar: form.avatar, name: form.name || me.name }} size={72} />
          <div>
            <strong>{form.username}</strong>
            <label className="link-btn">
              Alterar foto do perfil (foto ou GIF)
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (!f) return;
                  try {
                    setAvatarError(null);
                    setForm({ ...form, avatar: await mediaToDataUrl(f, 320) });
                  } catch (err) {
                    setAvatarError((err as Error).message);
                  }
                }}
              />
            </label>
            {avatarError && <span className="form-error">{avatarError}</span>}
            {form.avatar && (
              <button type="button" className="link-btn muted" onClick={() => setForm({ ...form, avatar: undefined })}>
                Remover foto
              </button>
            )}
          </div>
        </div>

        <label className="field">
          <span className="field-label">Nome</span>
          <input value={form.name} maxLength={60} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </label>
        <label className="field">
          <span className="field-label">Nome de usuário</span>
          <input value={form.username} maxLength={30} onChange={(e) => setForm({ ...form, username: e.target.value })} />
        </label>
        <label className="field">
          <span className="field-label">Bio</span>
          <textarea rows={3} maxLength={150} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          <span className="field-hint">{form.bio.length}/150</span>
        </label>

        <section className="privacy-box">
          <label className="toggle big">
            <input type="checkbox" checked={form.isPrivate} onChange={(e) => setForm({ ...form, isPrivate: e.target.checked })} />
            <span className="toggle-ui" />
            <span>
              <strong>
                <IconLock size={14} /> Conta privada
              </strong>
              <span className="muted small block">
                Só seguidores aprovados por você veem suas fotos e quem você segue. Quem quiser seguir pode mandar <strong>um único bilhete</strong>, e você pode responder <strong>uma única vez</strong> — responder não aprova o pedido.
              </span>
            </span>
          </label>
          <p className="hint">📚 Sua estante, avaliações, resenhas e anotações são sempre públicas.</p>
        </section>

        {error && <p className="form-error">{error}</p>}
        <div className="modal-actions">
          <button type="submit" className="btn btn-primary">
            Salvar
          </button>
        </div>
      </form>

      <section className="danger-zone">
        <h2 className="section-title">Protótipo</h2>
        <p className="muted small">Tudo o que você faz fica salvo só neste navegador. Para recomeçar do zero com os dados de exemplo:</p>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => {
            if (!confirm("Apagar tudo e restaurar os dados de exemplo?")) return;
            actions.reset();
            router.push("/");
          }}
        >
          Restaurar dados de exemplo
        </button>
      </section>
    </div>
  );
}
