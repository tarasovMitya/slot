import { useEffect, useState } from "react";
interface User { first_name?: string; id?: number; }
import { supabase } from "../../lib/supabase";

interface Order {
  id: string;
  service_name: string;
  category_name: string;
  price_total: number;
  scheduled_date: string;
  scheduled_time: string;
  address: string;
  status: string;
  created_at: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  new:                 { label: "Новая",            color: "bg-blue-100 text-blue-700"   },
  searching:           { label: "Ищем мастера",     color: "bg-yellow-100 text-yellow-700" },
  assigned:            { label: "Мастер найден",    color: "bg-green-100 text-green-700" },
  in_progress:         { label: "В работе",         color: "bg-indigo-100 text-indigo-700" },
  done:                { label: "Выполнен",         color: "bg-gray-100 text-gray-600"   },
  cancelled:           { label: "Отменён",          color: "bg-red-100 text-red-700"     },
};

interface Props {
  user: User | undefined;
}

export function TMAOrders(_: Props) {
  const [phone, setPhone] = useState("");
  const [inputPhone, setInputPhone] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  // Try to load orders for authenticated Supabase user on mount
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await fetchByUserId(user.id);
      }
    })();
  }, []);

  async function fetchByUserId(userId: string) {
    setLoading(true);
    setError(null);
    try {
      const { data, error: dbErr } = await supabase
        .from("orders")
        .select("id, service_name, category_name, price_total, scheduled_date, scheduled_time, address, status, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);
      if (dbErr) throw dbErr;
      setOrders(data ?? []);
      setSearched(true);
    } catch {
      setError("Не удалось загрузить заявки.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchByPhone(ph: string) {
    setLoading(true);
    setError(null);
    setSearched(false);
    try {
      // phone stored in field_values->phone
      const { data, error: dbErr } = await supabase
        .from("orders")
        .select("id, service_name, category_name, price_total, scheduled_date, scheduled_time, address, status, created_at")
        .contains("field_values", { phone: ph })
        .order("created_at", { ascending: false })
        .limit(20);
      if (dbErr) throw dbErr;
      setOrders(data ?? []);
      setSearched(true);
      setPhone(ph);
    } catch {
      setError("Ошибка поиска. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="px-4 pt-16 flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400">Загружаем заявки...</p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-4">
      <h1 className="text-2xl font-black text-gray-900 mb-1">Мои заявки</h1>
      <p className="text-sm text-gray-400 mb-5">История и статусы заказов</p>

      {!searched && (
        <div className="bg-gray-50 rounded-2xl p-4 mb-4">
          <p className="text-sm text-gray-600 mb-3">Введите номер телефона, указанный при заказе</p>
          <input
            type="tel"
            value={inputPhone}
            onChange={(e) => setInputPhone(e.target.value)}
            placeholder="+7 (999) 000-00-00"
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-gray-900 mb-3"
          />
          <button
            onClick={() => inputPhone.trim() && fetchByPhone(inputPhone.trim())}
            disabled={!inputPhone.trim()}
            className="w-full bg-gray-950 text-white rounded-xl py-3 text-sm font-bold disabled:opacity-40"
          >
            Найти заявки
          </button>
        </div>
      )}

      {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

      {searched && orders.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-gray-500 text-sm">Заявок не найдено</p>
          {phone && (
            <button
              onClick={() => { setSearched(false); setOrders([]); }}
              className="mt-4 text-sm text-gray-400 underline"
            >
              Попробовать другой номер
            </button>
          )}
        </div>
      )}

      {orders.length > 0 && (
        <>
          <div className="space-y-3">
            {orders.map((o) => {
              const st = STATUS_LABELS[o.status] ?? { label: o.status, color: "bg-gray-100 text-gray-600" };
              const dateStr = o.scheduled_date
                ? new Date(o.scheduled_date).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })
                : "";
              return (
                <div key={o.id} className="bg-gray-50 rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{o.service_name}</p>
                      <p className="text-xs text-gray-400">{o.category_name}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${st.color}`}>
                      {st.label}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 space-y-0.5">
                    {dateStr && <p>📅 {dateStr}{o.scheduled_time ? `, ${o.scheduled_time}` : ""}</p>}
                    {o.address && <p>📍 {o.address}</p>}
                    <p className="font-semibold text-gray-900 pt-1">{o.price_total.toLocaleString("ru")} ₽</p>
                  </div>
                </div>
              );
            })}
          </div>
          {phone && (
            <button
              onClick={() => { setSearched(false); setOrders([]); setPhone(""); }}
              className="mt-4 w-full text-sm text-gray-400 underline"
            >
              Другой номер
            </button>
          )}
        </>
      )}
    </div>
  );
}
