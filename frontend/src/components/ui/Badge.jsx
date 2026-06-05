const styles = {
  Applied: "bg-blue-50 text-primary border-blue-100",
  "In Process": "bg-amber-50 text-warning border-amber-100",
  Selected: "bg-emerald-50 text-success border-emerald-100",
  Rejected: "bg-red-50 text-danger border-red-100",
  "Offer Received": "bg-indigo-50 text-indigo-700 border-indigo-100",
  Upcoming: "bg-blue-50 text-primary border-blue-100",
  Ongoing: "bg-amber-50 text-warning border-amber-100",
  Completed: "bg-emerald-50 text-success border-emerald-100",
  PASS: "bg-emerald-50 text-success border-emerald-100",
  FAIL: "bg-red-50 text-danger border-red-100",
  PENDING: "bg-slate-50 text-muted border-border",
};

export default function Badge({ label }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${
        styles[label] || "bg-slate-50 text-muted border-border"
      }`}
    >
      {label || "Unknown"}
    </span>
  );
}
