import { NavLink, Outlet, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiBarChart2,
  FiBriefcase,
  FiClipboard,
  FiHome,
  FiLayers,
  FiLogOut,
  FiMenu,
  FiSearch,
  FiUsers,
  FiX,
} from "react-icons/fi";
import { useState } from "react";
import Button from "../ui/Button";
import { useAuth } from "../../context/AuthContext";
import { getInitials } from "../../utils/formatters";

const navItems = [
  { icon: FiHome, label: "Dashboard", to: "/dashboard" },
  { icon: FiUsers, label: "Students", to: "/students" },
  { icon: FiBriefcase, label: "Companies", to: "/companies" },
  { icon: FiLayers, label: "Applications", to: "/applications" },
  { icon: FiClipboard, label: "Interview Rounds", to: "/rounds" },
  { icon: FiBarChart2, label: "Reports", to: "/reports" },
];

function Sidebar({ onNavigate }) {
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

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout, user } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-canvas">
      <div className="fixed inset-y-0 left-0 z-40 hidden lg:block">
        <Sidebar />
      </div>

      {sidebarOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close navigation"
            className="absolute inset-0 bg-slate-950/30"
            onClick={() => setSidebarOpen(false)}
          />
          <motion.div
            className="relative h-full"
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
          >
            <Sidebar onNavigate={() => setSidebarOpen(false)} />
          </motion.div>
        </div>
      ) : null}

      <div className="lg:pl-[260px]">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-white/95 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <Button
              aria-label="Open navigation"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
              size="sm"
              variant="ghost"
            >
              <FiMenu className="h-5 w-5" />
            </Button>
            <div className="hidden h-10 w-80 items-center gap-2 rounded-xl border border-border bg-slate-50 px-3 md:flex">
              <FiSearch className="h-4 w-4 text-muted" />
              <span className="text-sm text-muted">Search workspace</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-ink">{user?.name || "Placement Officer"}</p>
              <p className="text-xs capitalize text-muted">{user?.role || "admin"}</p>
            </div>
            <div className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-xs font-bold text-primary">
              {getInitials(user?.name)}
            </div>
            <Button aria-label="Logout" onClick={logout} size="sm" variant="ghost">
              <FiLogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <motion.main
          animate={{ opacity: 1, y: 0 }}
          className="p-4 sm:p-6"
          initial={{ opacity: 0, y: 8 }}
          key={location.pathname}
          transition={{ duration: 0.18 }}
        >
          <Outlet />
        </motion.main>
      </div>
    </div>
  );
}
