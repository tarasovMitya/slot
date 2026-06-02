import { Bell, X } from "lucide-react";
import { useState } from "react";
import { usePushNotifications } from "../../hooks/usePushNotifications";

export function PushPermissionBanner() {
  const { isSupported, permission, isSubscribed, subscribe } = usePushNotifications();
  const [dismissed, setDismissed] = useState(() => !!localStorage.getItem("push_banner_dismissed"));
  const [subscribing, setSubscribing] = useState(false);

  if (!isSupported || isSubscribed || permission === "granted" || dismissed) return null;
  if (permission === "denied") return null; // Can't re-ask after denial

  const handleEnable = async () => {
    setSubscribing(true);
    await subscribe();
    setSubscribing(false);
  };

  const handleDismiss = () => {
    localStorage.setItem("push_banner_dismissed", "1");
    setDismissed(true);
  };

  return (
    <div className="flex items-center gap-3 bg-[#003B8F] text-white px-4 py-3 text-sm">
      <Bell size={16} className="shrink-0 text-white" />
      <span className="flex-1">Включите уведомления, чтобы не пропустить статус заказа</span>
      <button
        onClick={handleEnable}
        disabled={subscribing}
        className="shrink-0 px-3 py-1 rounded-lg bg-white text-gray-900 text-xs font-semibold hover:bg-gray-100 transition-colors disabled:opacity-60"
      >
        {subscribing ? "..." : "Включить"}
      </button>
      <button onClick={handleDismiss} className="shrink-0 text-gray-400 hover:text-white transition-colors">
        <X size={14} />
      </button>
    </div>
  );
}
