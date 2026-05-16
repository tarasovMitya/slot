import { useEffect, useState } from "react";
import { useAdminStore } from "../store/adminStore";
import type { AdminClient } from "../types";
import { Phone, Mail, MapPin } from "lucide-react";

export function AdminClientsPage() {
  const { clients, isLoadingClients, loadClients, orders } = useAdminStore();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<AdminClient | null>(null);

  useEffect(() => { loadClients(); }, []);

  const filtered = clients.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.includes(q)
    );
  });

  const clientOrders = selected
    ? orders.filter((o) => o.clientEmail === selected.email || o.clientPhone === selected.phone)
    : [];

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Клиенты</h1>
          <p className="text-sm text-gray-500 mt-0.5">{filtered.length} клиентов</p>
        </div>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Поиск по имени, email, телефону..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
        />
      </div>

      <div className="flex gap-4">
        {/* Table */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden">
          {isLoadingClients ? (
            <div className="p-8 text-center text-sm text-gray-400">Загрузка...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Имя</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Телефон</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Адрес</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Дата регистрации</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => setSelected(c.id === selected?.id ? null : c)}
                      className={`border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${selected?.id === c.id ? "bg-blue-50" : ""}`}
                    >
                      <td className="px-5 py-3 font-medium text-gray-900">{c.name}</td>
                      <td className="px-5 py-3 text-gray-600">{c.email}</td>
                      <td className="px-5 py-3 text-gray-600">{c.phone || "—"}</td>
                      <td className="px-5 py-3 text-gray-500 text-xs max-w-[200px] truncate">{c.address || "—"}</td>
                      <td className="px-5 py-3 text-gray-400 text-xs">
                        {c.createdAt ? new Date(c.createdAt).toLocaleDateString("ru-RU") : "—"}
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-400 text-sm">Нет клиентов</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-72 shrink-0 bg-white rounded-xl border border-gray-200 p-4 self-start space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-900">Профиль клиента</p>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
            </div>

            <div className="space-y-2">
              <p className="text-base font-bold text-gray-900">{selected.name}</p>
              {selected.email && (
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                  <Mail size={13} />
                  <span>{selected.email}</span>
                </div>
              )}
              {selected.phone && (
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                  <Phone size={13} />
                  <span>{selected.phone}</span>
                </div>
              )}
              {selected.address && selected.address !== "—" && (
                <div className="flex items-start gap-1.5 text-sm text-gray-600">
                  <MapPin size={13} className="mt-0.5 shrink-0" />
                  <span>{selected.address}</span>
                </div>
              )}
              {selected.createdAt && (
                <p className="text-xs text-gray-400">
                  Зарегистрирован {new Date(selected.createdAt).toLocaleDateString("ru-RU")}
                </p>
              )}
            </div>

            {/* Order history for this client */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Заказы {clientOrders.length > 0 && <span className="text-gray-400">({clientOrders.length})</span>}
              </p>
              {clientOrders.length === 0 ? (
                <p className="text-xs text-gray-400">Нет заказов в текущей выборке</p>
              ) : (
                <div className="space-y-2">
                  {clientOrders.slice(0, 5).map((o) => (
                    <div key={o.id} className="bg-gray-50 rounded-lg p-2.5 text-xs">
                      <p className="font-medium text-gray-800 truncate">{o.serviceName}</p>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-gray-400">{new Date(o.createdAt).toLocaleDateString("ru-RU")}</span>
                        <span className={`px-1.5 py-0.5 rounded-full font-semibold ${
                          o.status === "completed" ? "bg-green-100 text-green-700" :
                          o.status === "cancelled" ? "bg-red-100 text-red-700" :
                          "bg-blue-100 text-blue-700"
                        }`}>
                          {o.status === "completed" ? "Завершён" : o.status === "cancelled" ? "Отменён" : "Активный"}
                        </span>
                      </div>
                    </div>
                  ))}
                  {clientOrders.length > 5 && (
                    <p className="text-xs text-gray-400 text-center">ещё {clientOrders.length - 5} заказов</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
