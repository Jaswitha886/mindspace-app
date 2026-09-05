import Link from "next/link";

function Glyph({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M12 6.6a2.9 2.9 0 0 0-5 1.9 2.5 2.5 0 0 0-1.2 4.2A2.7 2.7 0 0 0 8.3 17.4H12z" />
      <path d="M12 6.6a2.9 2.9 0 0 1 5 1.9 2.5 2.5 0 0 1 1.2 4.2 2.7 2.7 0 0 1-2.5 4.7H12z" />
      <path d="M12 6.6v10.8" />
    </svg>
  );
}

export function WordmarkMark({ size = "md" }: { size?: "sm" | "md" }) {
  const box = size === "sm" ? "h-9 w-9" : "h-11 w-11";
  const glyph = size === "sm" ? "h-[1.15rem] w-[1.15rem]" : "h-[1.4rem] w-[1.4rem]";
  return (
    <span
      className={`grid ${box} shrink-0 place-items-center rounded-lg bg-brand text-white shadow-(--shadow-btn)`}
    >
      <Glyph className={glyph} />
    </span>
  );
}

export function Wordmark({ href = "/" }: { href?: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2.5"
      aria-label="MindSpace home"
    >
      <WordmarkMark size="sm" />
      <span className="text-lg font-bold text-white">
        MindSpace
      </span>
    </Link>
  );
}
