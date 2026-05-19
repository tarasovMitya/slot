import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "../store/authStore";
import { dbSavePushSubscription, dbRemovePushSubscription, VAPID_PUBLIC_KEY } from "../lib/pushDb";

type PushPermission = "default" | "granted" | "denied";

const SW_PATH = "/sw.js";
const ASKED_KEY = "push_permission_asked";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function usePushNotifications() {
  const { user } = useAuthStore();
  const [permission, setPermission] = useState<PushPermission>(
    typeof Notification !== "undefined" ? (Notification.permission as PushPermission) : "denied"
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [reg, setReg] = useState<ServiceWorkerRegistration | null>(null);

  const isSupported =
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window &&
    !!VAPID_PUBLIC_KEY;

  // Register service worker once
  useEffect(() => {
    if (!isSupported) return;
    navigator.serviceWorker.register(SW_PATH).then((r) => {
      setReg(r);
      r.pushManager.getSubscription().then((sub) => setIsSubscribed(!!sub));
    }).catch(() => {});
  }, [isSupported]);

  // Handle notification click from service worker → navigate
  useEffect(() => {
    if (!isSupported) return;
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "NOTIFICATION_CLICK" && e.data.url) {
        window.location.href = e.data.url;
      }
    };
    navigator.serviceWorker.addEventListener("message", handler);
    return () => navigator.serviceWorker.removeEventListener("message", handler);
  }, [isSupported]);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !reg || !user?.id) return false;
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm as PushPermission);
      localStorage.setItem(ASKED_KEY, "1");
      if (perm !== "granted") return false;

      const existing = await reg.pushManager.getSubscription();
      if (existing) {
        await dbSavePushSubscription(user.id, existing);
        setIsSubscribed(true);
        return true;
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      await dbSavePushSubscription(user.id, sub);
      setIsSubscribed(true);
      return true;
    } catch {
      return false;
    }
  }, [isSupported, reg, user?.id]);

  const unsubscribe = useCallback(async (): Promise<void> => {
    if (!reg || !user?.id) return;
    const sub = await reg.pushManager.getSubscription().catch(() => null);
    if (!sub) return;
    await sub.unsubscribe();
    await dbRemovePushSubscription(user.id, sub.endpoint);
    setIsSubscribed(false);
  }, [reg, user?.id]);

  // Ask for permission on first login (once)
  const askOnce = useCallback(async () => {
    if (!isSupported || !user?.id) return;
    if (localStorage.getItem(ASKED_KEY)) return;
    if (Notification.permission !== "default") {
      localStorage.setItem(ASKED_KEY, "1");
      return;
    }
    // Small delay so the UI is settled
    await new Promise((r) => setTimeout(r, 3000));
    await subscribe();
  }, [isSupported, user?.id, subscribe]);

  return { isSupported, permission, isSubscribed, subscribe, unsubscribe, askOnce };
}
