import { FiLogOut, FiMenu, FiSearch } from "react-icons/fi";
import Button from "../ui/Button";
import { useAuth } from "../../context/AuthContext";
import { getInitials } from "../../utils/formatters";

export default function Navbar({ onOpenSidebar }) {
  const { logout, user } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-white/95 px-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <Button
          aria-label="Open navigation"
          className="lg:hidden"
          onClick={onOpenSidebar}
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
  );
}
