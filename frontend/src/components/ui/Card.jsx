export default function Card({ children, className = "" }) {
  return (
    <section className={`rounded-2xl border border-border bg-white shadow-card ${className}`}>
      {children}
    </section>
  );
}
