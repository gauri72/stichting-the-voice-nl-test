export default function SkeletonCard() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-evx-border bg-evx-card-bg" aria-hidden="true">
      <div className="aspect-[4/3] animate-pulse bg-evx-bg-muted" />
      <div className="flex flex-col gap-2 p-4">
        <div className="h-4 w-3/4 animate-pulse rounded bg-evx-bg-muted" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-evx-bg-muted" />
        <div className="h-3 w-1/3 animate-pulse rounded bg-evx-bg-muted" />
      </div>
    </div>
  );
}
