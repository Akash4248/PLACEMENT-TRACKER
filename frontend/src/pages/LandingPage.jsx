import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  FiBarChart2,
  FiBriefcase,
  FiCheckCircle,
  FiFileText,
  FiLayers,
  FiUsers,
} from "react-icons/fi";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";

const features = [
  ["Student Management", FiUsers],
  ["Company Management", FiBriefcase],
  ["Interview Tracking", FiLayers],
  ["Recruitment Funnel", FiBarChart2],
  ["Analytics Dashboard", FiCheckCircle],
  ["PDF Reports", FiFileText],
];

function MockCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-border bg-white/90 p-4 shadow-card">
      <p className="text-2xl font-bold text-ink">{value}</p>
      <p className="mt-1 text-sm text-muted">{label}</p>
    </div>
  );
}

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-canvas">
      <nav className="sticky top-0 z-30 border-b border-border bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-sm font-bold text-white">CT</div>
            <span className="text-base font-bold text-ink">CampusTrack</span>
          </div>
          <div className="hidden items-center gap-6 text-sm font-semibold text-muted md:flex">
            <a href="#features">Features</a>
            <a href="#analytics">Analytics</a>
            <a href="#about">About</a>
          </div>
          <div className="flex items-center gap-2">
            <Link className="hidden text-sm font-semibold text-muted sm:inline" to="/login">Login</Link>
            <Link className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-white" to="/signup">Get Started</Link>
          </div>
        </div>
      </nav>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_0.95fr] lg:py-24">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Campus placement SaaS</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight text-ink sm:text-6xl">
            Campus Recruitment Management Made Simple
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
            Manage students, companies, interview rounds, recruitment funnels, analytics, and placement reports from a single platform.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/signup"><Button size="lg">Get Started</Button></Link>
            <Link to="/dashboard"><Button size="lg" variant="secondary">View Demo</Button></Link>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.08 }}>
          <Card className="p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-ink">Placement Operations</p>
                <p className="text-xs text-muted">Live dashboard preview</p>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-success">Online</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <MockCard label="Students" value="1000+" />
              <MockCard label="Companies" value="25+" />
              <MockCard label="Applications" value="4000+" />
              <MockCard label="Placement Rate" value="72%" />
            </div>
            <div className="mt-5 space-y-3">
              {["Applied", "Aptitude", "Coding", "Technical", "Selected"].map((item, index) => (
                <div className="flex items-center gap-3" key={item}>
                  <div className="h-2 rounded-full bg-primary" style={{ width: `${90 - index * 13}%` }} />
                  <span className="w-20 text-xs font-semibold text-muted">{item}</span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 pb-16 sm:grid-cols-2 sm:px-6 xl:grid-cols-4">
        {["1000+ Students Managed", "25+ Companies", "4000+ Applications", "95% Workflow Automation"].map((item) => (
          <Card className="p-5 text-center" key={item}>
            <p className="text-lg font-bold text-ink">{item}</p>
          </Card>
        ))}
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6" id="features">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-ink">Everything placement teams need</h2>
          <p className="mt-2 text-sm text-muted">Built for scale, clarity, and repeatable campus workflows.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {features.map(([label, Icon], index) => (
            <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.04 }} key={label}>
              <Card className="p-5">
                <Icon className="h-5 w-5 text-primary" />
                <h3 className="mt-4 text-base font-semibold text-ink">{label}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">Enterprise-ready tools for placement officers and department coordinators.</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6" id="analytics">
        <Card className="p-6">
          <h2 className="text-2xl font-bold text-ink">Analytics Showcase</h2>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-5 lg:col-span-2">
              <div className="flex h-56 items-end gap-3">
                {[60, 85, 45, 72, 95, 68, 78].map((height) => (
                  <div className="flex-1 rounded-t-lg bg-primary" key={height} style={{ height: `${height}%` }} />
                ))}
              </div>
            </div>
            <div className="space-y-3">
              {["Department analytics", "Top recruiters", "PDF reports", "Funnel health"].map((item) => (
                <div className="rounded-xl border border-border bg-white p-4 text-sm font-semibold text-ink" key={item}>{item}</div>
              ))}
            </div>
          </div>
        </Card>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6" id="about">
        <h2 className="text-3xl font-bold text-ink">Start Managing Campus Placements Today</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted">Move from scattered spreadsheets to a focused placement operations platform.</p>
        <Link className="mt-6 inline-flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-white" to="/signup">Get Started</Link>
      </section>

      <footer className="border-t border-border bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>Copyright © 2026 CampusTrack</p>
          <p>Features · Analytics · About · Version 1.0.0</p>
        </div>
      </footer>
    </main>
  );
}
