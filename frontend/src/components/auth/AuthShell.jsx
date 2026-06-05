import { motion } from "framer-motion";
import { FiBarChart2, FiBriefcase, FiCheckCircle, FiLayers, FiUsers } from "react-icons/fi";

const stats = [
  { label: "Students", value: "248", icon: FiUsers },
  { label: "Companies", value: "36", icon: FiBriefcase },
  { label: "Offers", value: "74", icon: FiCheckCircle },
];

const pipeline = [
  { label: "Applied", width: "92%" },
  { label: "In Process", width: "68%" },
  { label: "Selected", width: "44%" },
];

export default function AuthShell({ children }) {
  return (
    <main className="relative grid min-h-screen overflow-hidden bg-canvas lg:grid-cols-[1fr_520px]">
      <div className="auth-grid absolute inset-0 opacity-80" />
      <motion.div
        aria-hidden="true"
        className="absolute left-16 top-24 hidden h-44 w-44 rounded-[2rem] border border-blue-100 bg-white/70 shadow-card lg:block"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden="true"
        className="absolute bottom-24 left-[42%] hidden h-28 w-28 rounded-[1.5rem] border border-slate-200 bg-white/80 shadow-card lg:block"
        animate={{ y: [0, 12, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />

      <section className="relative hidden border-r border-border bg-white/70 p-12 backdrop-blur lg:flex lg:flex-col lg:justify-between">
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary text-white shadow-card">
            <FiBriefcase className="h-5 w-5" />
          </div>
          <div>
            <p className="text-lg font-bold text-ink">CampusTrack</p>
            <p className="text-sm text-muted">Campus Interview Tracking</p>
          </div>
        </motion.div>

        <motion.div
          className="max-w-2xl"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
        >
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Placement operations</p>
          <h1 className="mt-4 max-w-xl text-4xl font-bold leading-tight text-ink">
            A calmer way to manage interviews, rounds, and outcomes.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-muted">
            Keep every drive visible with live KPIs, structured workflows, and clean placement reports.
          </p>

          <div className="mt-8 grid max-w-2xl grid-cols-3 gap-3">
            {stats.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  className="rounded-2xl border border-border bg-white p-4 shadow-card"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: 0.1 + index * 0.08 }}
                  whileHover={{ y: -3 }}
                  key={item.label}
                >
                  <Icon className="h-4 w-4 text-primary" />
                  <p className="mt-3 text-2xl font-bold text-ink">{item.value}</p>
                  <p className="mt-1 text-xs font-medium text-muted">{item.label}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          className="grid grid-cols-[1fr_0.8fr] gap-4"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.18 }}
        >
          <div className="rounded-2xl border border-border bg-white p-5 shadow-card">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-ink">Recruitment Pipeline</p>
                <p className="text-xs text-muted">Current semester</p>
              </div>
              <FiLayers className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-4">
              {pipeline.map((item, index) => (
                <div key={item.label}>
                  <div className="mb-1.5 flex justify-between text-xs font-medium text-muted">
                    <span>{item.label}</span>
                    <span>{item.width}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <motion.div
                      className="h-2 rounded-full bg-primary"
                      initial={{ width: 0 }}
                      animate={{ width: item.width }}
                      transition={{ duration: 0.7, delay: 0.35 + index * 0.12 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-white p-5 shadow-card">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-ink">Offer Rate</p>
              <FiBarChart2 className="h-5 w-5 text-success" />
            </div>
            <p className="mt-6 text-4xl font-bold text-ink">42%</p>
            <p className="mt-2 text-xs leading-5 text-muted">Selections converted to confirmed offers.</p>
          </div>
        </motion.div>
      </section>

      <section className="relative flex min-h-screen items-center justify-center p-4 sm:p-6">
        {children}
      </section>
    </main>
  );
}
