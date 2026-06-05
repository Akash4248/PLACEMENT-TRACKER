import { FiLoader } from "react-icons/fi";

export default function Loader({ label = "Loading" }) {
  return (
    <div className="inline-flex items-center gap-2 text-sm font-medium text-muted">
      <FiLoader className="h-4 w-4 animate-spin text-primary" />
      {label}
    </div>
  );
}
