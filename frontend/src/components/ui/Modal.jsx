import { AnimatePresence, motion } from "framer-motion";
import { FiX } from "react-icons/fi";
import Button from "./Button";

export default function Modal({ children, open, onClose, title }) {
  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.button
            aria-label="Close modal"
            className="absolute inset-0 bg-slate-950/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="relative max-h-[92vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-white shadow-lift"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.18 }}
          >
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-lg font-semibold text-ink">{title}</h2>
              <Button aria-label="Close" onClick={onClose} size="sm" variant="ghost">
                <FiX className="h-4 w-4" />
              </Button>
            </div>
            <div className="max-h-[calc(92vh-73px)] overflow-y-auto p-6 thin-scrollbar">{children}</div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
