import { NavLink } from "react-router-dom";
import { FiBarChart2, FiBriefcase, FiClipboard, FiHome, FiLayers, FiUsers } from "react-icons/fi";

const navItems = [
  { icon: FiHome, label: "Dashboard", to: "/dashboard" },
  { icon: FiUsers, label: "Students", to: "/students" },
  { icon: FiBriefcase, label: "Companies", to: "/companies" },
  { icon: FiLayers, label: "Applications", to: "/applications" },
  { icon: FiClipboard, label: "Interview Rounds", to: "/rounds" },
  { icon: FiBarChart2, label: "Reports", to: "/reports" },
];

export default function Sidebar({ onNavigate }) {
  return (
    <aside className="flex h-full w-[260px] flex-col border-r border-border bg-white">
      <div className="flex h-16 items-center gap-3 border-b border-border px-5">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-sm font-bold text-white">
          CT
        </div>
        <div>
          <p className="text-base font-bold text-ink">CampusTrack</p>
          <p className="text-xs text-muted">Placement Console</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  isActive ? "bg-primary-soft text-primary" : "text-muted hover:bg-slate-100 hover:text-ink"
                }`
              }
              key={item.to}
              onClick={onNavigate}
              to={item.to}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
      <div className="border-t border-border p-4 text-xs text-muted">
        <p className="font-semibold text-ink">Result Management</p>
        <p className="mt-1">Track drives, rounds, and offers in one workspace.</p>
      </div>
    </aside>
  );
}
