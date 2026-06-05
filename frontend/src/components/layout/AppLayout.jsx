import { Outlet, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
        <Navbar onOpenSidebar={() => setSidebarOpen(true)} />

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
