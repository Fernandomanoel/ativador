"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClubForm, emptyClub } from "@/components/ClubForm";
import { useStore } from "@/lib/store";

export default function NewClubPage() {
  const { actions } = useStore();
  const router = useRouter();
  return (
    <div className="narrow">
      <Link href="/clubes" className="link-btn">
        ← Clubes
      </Link>
      <h1 className="page-title">Criar clube de leitura</h1>
      <ClubForm
        initial={emptyClub()}
        submitLabel="Criar clube"
        onSubmit={(c) => {
          const id = actions.createClub(c);
          actions.toast("Clube criado!");
          router.push(`/clubes/${id}`);
          return null;
        }}
      />
    </div>
  );
}
