import type { Book } from "@/lib/types";
import { cx, hash } from "@/lib/util";
import { bookColors } from "./Cover";

/** Lombada de livro, usada na visualização "Lombadas" e nas cenas das fotos. */
export function Spine({ book, horizontal, className }: { book: Book; horizontal?: boolean; className?: string }) {
  const [bg, fg] = bookColors(book);
  const h = hash(book.title);
  const height = 78 + (h % 22); // % da prateleira
  const width = 26 + ((book.pages ?? 300) / 784) * 26 + (h % 6);
  return (
    <span
      className={cx("spine", horizontal && "spine-h", className)}
      style={{
        ["--c-bg" as string]: bg,
        ["--c-fg" as string]: fg,
        ["--sp-h" as string]: `${height}%`,
        ["--sp-w" as string]: `${Math.round(width)}px`,
      }}
      title={`${book.title} — ${book.author}`}
    >
      <span className="spine-band" />
      <span className="spine-title">{book.title}</span>
      <span className="spine-author">{book.author.split(" ").slice(-1)[0]}</span>
    </span>
  );
}
