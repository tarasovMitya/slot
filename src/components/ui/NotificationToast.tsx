import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bell, CheckCircle, User, AlertTriangle, MessageCircle, CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDashboardStore } from "../../dashboard/store/dashboardStore";
import { usePerformerStore } from "../../performer/store/performerStore";

type ToastNotif = {
  id: string;
  title: string;
  body: string;
  type: string;
  orderId?: string;
  role: "client" | "performer";
};

const ICON_MAP: Record<string, React.ComponentType<{ size: number; className?: string }>> = {
  performer: User,
  completed: CheckCircle,
  status: Bell,
  reminder: Bell,
  new_order: Bell,
  status_change: Bell,
  cancellation: AlertTriangle,
  payment: CreditCard,
  chat: MessageCircle,
};

const COLOR_MAP: Record<string, string> = {
  performer: "bg-indigo-50 text-indigo-600",
  completed: "bg-green-50 text-green-600",
  status: "bg-blue-50 text-blue-600",
  new_order: "bg-amber-50 text-amber-600",
  cancellation: "bg-red-50 text-red-600",
  payment: "bg-green-50 text-green-600",
  chat: "bg-purple-50 text-purple-600",
};

const DURATION = 5000;

export function NotificationToast() {
  const navigate = useNavigate();
  const [toasts, setToasts] = useState<ToastNotif[]>([]);
  // Track IDs already shown so we never re-show the same notification
  const seenIds = useRef(new Set<string>());

  const clientNotifs = useDashboardStore((s) => s.notifications);
  const performerNotifs = usePerformerStore((s) => s.notifications);

  // Seed seenIds when notifications first arrive (after hydration) so DB-loaded
  // notifications don't pop up as toasts. Runs on each change until seeded once.
  const seeded = useRef(false);
  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    clientNotifs.forEach((n) => seenIds.current.add(n.id));
    performerNotifs.forEach((n) => seenIds.current.add(n.id));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientNotifs, performerNotifs]);

  // Watch for new client notifications
  useEffect(() => {
    if (!seeded.current) return;
    const fresh = clientNotifs.find((n) => !seenIds.current.has(n.id) && !n.read);
    if (!fresh) return;
    seenIds.current.add(fresh.id);
    setToasts((t) => [
      { id: fresh.id, title: fresh.title, body: fresh.body, type: fresh.type, orderId: fresh.orderId, role: "client" },
      ...t.slice(0, 2),
    ]);
  }, [clientNotifs]);

  // Watch for new performer notifications
  useEffect(() => {
    if (!seeded.current) return;
    const fresh = performerNotifs.find((n) => !seenIds.current.has(n.id) && !n.read);
    if (!fresh) return;
    seenIds.current.add(fresh.id);
    setToasts((t) => [
      { id: fresh.id, title: fresh.title, body: fresh.body, type: fresh.type, orderId: fresh.orderId, role: "performer" },
      ...t.slice(0, 2),
    ]);
  }, [performerNotifs]);

  // Auto-dismiss
  useEffect(() => {
    if (!toasts.length) return;
    const timer = setTimeout(() => {
      setToasts((t) => t.slice(0, -1));
    }, DURATION);
    return () => clearTimeout(timer);
  }, [toasts]);

  const dismiss = (id: string) => setToasts((t) => t.filter((x) => x.id !== id));

  const handleClick = (toast: ToastNotif) => {
    dismiss(toast.id);
    if (toast.orderId) {
      const base = toast.role === "performer" ? "/performer/orders" : "/dashboard/orders";
      navigate(`${base}/${toast.orderId}`);
    } else {
      navigate(toast.role === "performer" ? "/performer/notifications" : "/dashboard/notifications");
    }
  };

  return (
    <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 w-80">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = ICON_MAP[toast.type] ?? Bell;
          const color = COLOR_MAP[toast.type] ?? "bg-gray-50 text-gray-600";
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 flex items-start gap-3 cursor-pointer hover:shadow-xl transition-shadow"
              onClick={() => handleClick(toast)}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                <Icon size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 leading-tight">{toast.title}</p>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{toast.body}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); dismiss(toast.id); }}
                className="text-gray-300 hover:text-gray-500 transition-colors shrink-0 mt-0.5"
              >
                <X size={14} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
