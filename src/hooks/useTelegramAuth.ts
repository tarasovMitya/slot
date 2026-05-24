import { supabase } from "../lib/supabase";

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

declare global {
  interface Window {
    onTelegramAuth?: (user: TelegramUser) => void;
  }
}

function getFunctionUrl() {
  return `${window.location.origin}/supabase-proxy/functions/v1/telegram-auth`;
}

export async function signInWithTelegram(tgUser: TelegramUser): Promise<void> {
  const res = await fetch(getFunctionUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(tgUser),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Ошибка авторизации через Telegram");
  }

  const data = await res.json();
  const tokenHash = data.token_hash;
  if (!tokenHash) throw new Error("Не удалось получить токен авторизации");

  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "magiclink" });
  if (error) throw new Error(error.message);
}

export async function linkTelegramToAccount(tgUser: TelegramUser): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Необходимо войти в аккаунт");

  const res = await fetch(getFunctionUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ mode: "link", ...tgUser }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Ошибка привязки Telegram");
  }

  await supabase.auth.refreshSession();
}

export function loadTelegramWidget(
  botName: string,
  onAuth: (user: TelegramUser) => void
) {
  window.onTelegramAuth = onAuth;

  const existing = document.getElementById("telegram-widget-script");
  if (existing) existing.remove();

  const script = document.createElement("script");
  script.id = "telegram-widget-script";
  script.src = "https://telegram.org/js/telegram-widget.js?22";
  script.setAttribute("data-telegram-login", botName);
  script.setAttribute("data-size", "large");
  script.setAttribute("data-radius", "12");
  script.setAttribute("data-onauth", "onTelegramAuth(user)");
  script.setAttribute("data-request-access", "write");
  script.async = true;
  return script;
}
