import { NextResponse } from "next/server";
import { currentUserId } from "@/auth";
import { BadInput, isOpName } from "@/lib/server/validate";
import { applyAction } from "@/lib/server/world";

export const dynamic = "force-dynamic";

/** Executa uma ação do leitor logado com as mesmas regras do app (lib/logic.ts). */
export async function POST(req: Request) {
  const uid = await currentUserId();
  if (!uid) return NextResponse.json({ error: "Entre na sua conta de novo." }, { status: 401 });
  let body: { name?: unknown; args?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }
  if (!isOpName(body.name)) return NextResponse.json({ error: "Ação desconhecida." }, { status: 400 });
  try {
    const out = await applyAction(uid, body.name, body.args ?? []);
    return NextResponse.json(out, { status: out.error ? 422 : 200, headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    const msg = e instanceof BadInput ? "Dados inválidos." : e instanceof Error ? e.message : "Erro no servidor.";
    return NextResponse.json({ error: msg }, { status: e instanceof BadInput ? 400 : 500 });
  }
}
