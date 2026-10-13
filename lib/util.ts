export const uid = () =>
  Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);

export const nowIso = () => new Date().toISOString();

export function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "agora";
  const m = Math.floor(diff / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} d`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w} sem`;
  return new Date(iso).toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" });
}

export function longDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
}

export function plural(n: number, one: string, many: string) {
  return `${n.toLocaleString("pt-BR")} ${n === 1 ? one : many}`;
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

/** Reduz uma imagem enviada para caber no armazenamento local do protótipo. */
export function fileToDataUrl(file: File, max = 1080, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Imagem inválida"));
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas indisponível"));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

/** Limite para GIFs, que são guardados sem compressão para continuarem animados. */
export const GIF_MAX_BYTES = 1.5 * 1024 * 1024;

/**
 * Foto ou GIF para capas e avatares. Fotos são reduzidas; GIFs ficam como estão
 * (redimensionar no canvas tiraria a animação), por isso têm limite de tamanho.
 */
export function mediaToDataUrl(file: File, max = 1600): Promise<string> {
  if (!file.type.startsWith("image/")) return Promise.reject(new Error("Escolha uma foto ou um GIF."));
  if (file.type !== "image/gif") return fileToDataUrl(file, max, 0.85);
  if (file.size > GIF_MAX_BYTES) {
    return Promise.reject(new Error(`GIF grande demais (${(file.size / 1024 / 1024).toFixed(1)} MB). O limite é 1,5 MB.`));
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Não consegui ler este GIF."));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

export const isGif = (src?: string) => !!src && src.startsWith("data:image/gif");
