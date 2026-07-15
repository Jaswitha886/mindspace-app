// Page heading: a title with a plain supporting line underneath. No overline,
// no decoration — weight and space carry it.
export function PageTitle({
  children,
  sub,
}: {
  children: React.ReactNode;
  sub?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <h1 className="t-h1">{children}</h1>
      {sub && <p className="t-body max-w-prose">{sub}</p>}
    </div>
  );
}
