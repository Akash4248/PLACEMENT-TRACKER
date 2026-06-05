export function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-border bg-white p-5 shadow-card">
      <div className="h-5 w-1/2 rounded bg-slate-200" />
      <div className="mt-4 h-8 w-1/3 rounded bg-slate-200" />
      <div className="mt-3 h-4 w-2/3 rounded bg-slate-100" />
    </div>
  );
}

export function TableSkeleton({ rows = 6 }) {
  return (
    <div className="animate-pulse rounded-2xl border border-border bg-white p-5 shadow-card">
      {Array.from({ length: rows }).map((_, index) => (
        <div className="mb-4 grid grid-cols-5 gap-4" key={index}>
          <div className="h-4 rounded bg-slate-200" />
          <div className="h-4 rounded bg-slate-100" />
          <div className="h-4 rounded bg-slate-100" />
          <div className="h-4 rounded bg-slate-100" />
          <div className="h-4 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="flex h-80 animate-pulse items-end gap-3 rounded-2xl border border-border bg-white p-5 shadow-card">
      {[45, 70, 52, 88, 64, 76].map((height) => (
        <div className="flex-1 rounded-t bg-blue-100" key={height} style={{ height: `${height}%` }} />
      ))}
    </div>
  );
}
