import { FiLoader } from "react-icons/fi";

const variants = {
  primary: "bg-primary text-white hover:bg-primary-hover shadow-sm",
  secondary: "bg-white text-ink border border-border hover:bg-slate-50",
  danger: "bg-danger text-white hover:bg-red-700 shadow-sm",
  ghost: "text-muted hover:text-ink hover:bg-slate-100",
};

export default function Button({
  children,
  className = "",
  loading = false,
  size = "md",
  variant = "primary",
  ...props
}) {
  const sizes = {
    sm: "h-9 px-3 text-xs",
    md: "h-10 px-4 text-sm",
    lg: "h-11 px-5 text-sm",
  };

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <FiLoader className="h-4 w-4 animate-spin" /> : null}
      {children}
    </button>
  );
}
