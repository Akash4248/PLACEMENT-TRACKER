import Button from "./Button";

export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  totalRecords = 0,
  pageSize = 20,
  onPageChange,
}) {
  if (totalRecords <= pageSize && totalPages <= 1) return null;

  const start = totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalRecords);

  return (
    <div className="mt-4 flex flex-col gap-3 rounded-xl border border-border bg-white px-4 py-3 text-sm text-muted shadow-card sm:flex-row sm:items-center sm:justify-between">
      <p>
        Showing <span className="font-semibold text-ink">{start}</span> to{" "}
        <span className="font-semibold text-ink">{end}</span> of{" "}
        <span className="font-semibold text-ink">{totalRecords}</span>
      </p>
      <div className="flex items-center gap-2">
        <Button
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          size="sm"
          variant="secondary"
        >
          Previous
        </Button>
        <span className="px-2 text-xs font-semibold text-muted">
          Page {currentPage} / {Math.max(totalPages, 1)}
        </span>
        <Button
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          size="sm"
          variant="secondary"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
