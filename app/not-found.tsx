import Link from "next/link";

export default function NotFound() {
  return (
    <div className="empty narrow">
      <h1>Página não encontrada</h1>
      <p className="muted">Essa página saiu da estante.</p>
      <Link href="/" className="btn btn-primary">
        Voltar ao feed
      </Link>
    </div>
  );
}
