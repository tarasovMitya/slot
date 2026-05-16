import { useState } from "react";
import { Plus, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDashboardStore } from "../store/dashboardStore";
import { AddressCard } from "../components/cards/AddressCard";
import { EmptyState } from "../components/ui/EmptyState";
import { AddressSuggest } from "../../components/ui/AddressSuggest";

export function SavedAddressesPage() {
  const { addresses, setDefaultAddress, deleteAddress, addAddress } = useDashboardStore();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ label: "", street: "", city: "Москва" });
  const [streetValidated, setStreetValidated] = useState(false);

  const handleAdd = () => {
    if (!form.street || !streetValidated) return;
    addAddress({ ...form, isDefault: addresses.length === 0 });
    setForm({ label: "", street: "", city: "Москва" });
    setStreetValidated(false);
    setShowForm(false);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 pt-8 pb-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Мои адреса</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-4 py-2 bg-black text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-all"
        >
          <Plus size={15} />
          Добавить
        </button>
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-5"
          >
            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-5 flex flex-col gap-3">
              <p className="text-sm font-semibold text-gray-900">Новый адрес</p>
              <input
                placeholder='Название (например, "Дом")'
                value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-100 text-sm outline-none focus:border-gray-300 transition-colors"
              />
              <AddressSuggest
                value={form.street}
                onChange={(val, validated) => {
                  setForm((f) => ({ ...f, street: val }));
                  setStreetValidated(validated);
                }}
                placeholder="Улица, дом, квартира"
                inputClassName="w-full px-4 py-3 rounded-xl border border-gray-100 text-sm outline-none focus:border-gray-300 transition-colors pr-10"
              />
              <input
                placeholder="Город"
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-100 text-sm outline-none focus:border-gray-300 transition-colors"
              />
              <div className="flex gap-2 mt-1">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-100 text-sm font-medium text-gray-500 hover:border-gray-300 transition-all"
                >
                  Отмена
                </button>
                <button
                  onClick={handleAdd}
                  disabled={!form.street || !streetValidated}
                  className="flex-1 py-3 rounded-xl bg-black text-white text-sm font-semibold disabled:opacity-40 hover:bg-gray-800 transition-all"
                >
                  Сохранить
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {addresses.length === 0 ? (
        <EmptyState
          icon={<MapPin size={28} />}
          title="Нет сохранённых адресов"
          description="Добавьте адрес, чтобы быстро оформлять заказы"
        />
      ) : (
        <div className="flex flex-col gap-3">
          {addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              onSetDefault={() => setDefaultAddress(address.id)}
              onDelete={() => deleteAddress(address.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
