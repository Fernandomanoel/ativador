import { NextResponse } from "next/server";
import { currentUserId, enabled, missingSetup } from "@/auth";
import { loadWorld, projectFor } from "@/lib/server/world";

export const dynamic = "force-dynamic";

/** Estado do Vivlío visto pelo leitor logado. */
export async function GET() {
  const missing = missingSetup();
  if (missing.length) return NextResponse.json({ error: "not_configured", missing }, { status: 503 });
  const uid = await currentUserId();
  if (!uid) return NextResponse.json({ error: "login", providers: enabled }, { status: 401 });
  const world = await loadWorld();
  if (!world.users.some((u) => u.id === uid)) return NextResponse.json({ error: "login", providers: enabled }, { status: 401 });
  return NextResponse.json({ state: projectFor(world, uid) }, { headers: { "Cache-Control": "no-store" } });
}
