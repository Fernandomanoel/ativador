import { getMedia } from "@/lib/server/world";

/** Imagens enviadas (fotos, capas, GIFs). Os endereços são aleatórios e não mudam. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const media = await getMedia(id).catch(() => null);
  if (!media) return new Response("Não encontrado", { status: 404 });
  return new Response(new Uint8Array(media.data), {
    headers: { "Content-Type": media.mime, "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" },
  });
}
