import Link from "next/link";

export function BrandLockup({
  href = "/",
  onDark = false,
}: {
  href?: string;
  onDark?: boolean;
}) {
  return (
    <Link href={href} className="inline-flex items-center gap-3" aria-label="MindSpace home">
      <img src="/logo.png" alt="MindSpace" width={549} height={455} className="h-20 w-20 object-cover" />
      <span className={`h-7 w-px ${onDark ? "bg-white/25" : "bg-sidebar-border"}`} />
      <img src="/college-logo.png" alt="SRM Institute of Science and Technology" width={11652} height={5088} className="h-10 w-[74px] object-contain" />
    </Link>
  );
}
