import { useState, useEffect } from "react";
import { MapPin, Edit3, Check, Navigation } from "lucide-react";
import { usePerformerStore } from "../../store/performerStore";
import { AddressSuggest } from "../../../components/ui/AddressSuggest";

const RADIUS_OPTIONS = [5, 10, 15, 20, 30];

export function AddressSection() {
  const { profile, updateProfile } = usePerformerStore();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    address: profile.address,
    city: profile.city,
    workRadius: profile.workRadius,
  });

  useEffect(() => {
    if (!editing) {
      setForm({ address: profile.address, city: profile.city, workRadius: profile.workRadius });
    }
  }, [profile.address, profile.city, profile.workRadius]);

  const handleSave = () => {
    updateProfile(form);
    setEditing(false);
  };

  return (
    <div className="border border-gray-100 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MapPin size={15} className="text-gray-400" />
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Адрес и зона работы</p>
        </div>
        <button
          onClick={() => (editing ? handleSave() : setEditing(true))}
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors"
        >
          {editing ? <Check size={14} /> : <Edit3 size={14} />}
          {editing ? "Сохранить" : "Изменить"}
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {/* Address */}
        <div>
          <p className="text-xs text-gray-400 mb-1">Улица и дом</p>
          {editing ? (
            <AddressSuggest
              value={form.address}
              onChange={(val) => setForm((p) => ({ ...p, address: val }))}
              inputClassName="w-full text-sm font-medium text-gray-900 bg-gray-50 rounded-xl px-3 py-2 outline-none border border-gray-200 focus:border-gray-400 transition-colors pr-8"
            />
          ) : (
            <p className="text-sm font-medium text-gray-900">{profile.address}</p>
          )}
        </div>

        {/* City */}
        <div>
          <p className="text-xs text-gray-400 mb-1">Город</p>
          {editing ? (
            <input
              value={form.city}
              onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
              className="w-full text-sm font-medium text-gray-900 bg-gray-50 rounded-xl px-3 py-2 outline-none border border-gray-200 focus:border-gray-400 transition-colors"
            />
          ) : (
            <p className="text-sm font-medium text-gray-900">{profile.city}</p>
          )}
        </div>

        {/* Work radius */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Navigation size={12} className="text-gray-400" />
            <p className="text-xs text-gray-400">Радиус работы</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {RADIUS_OPTIONS.map((r) => (
              <button
                key={r}
                onClick={() => editing && setForm((p) => ({ ...p, workRadius: r }))}
                disabled={!editing}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  (editing ? form.workRadius : profile.workRadius) === r
                    ? "bg-black text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:hover:bg-gray-100"
                }`}
              >
                {r} км
              </button>
            ))}
          </div>
        </div>

        {/* Coordinates (readonly) */}
        <div className="flex items-center gap-4 text-xs text-gray-400 bg-gray-50 rounded-xl px-3 py-2">
          <span>lat {profile.lat.toFixed(4)}</span>
          <span>lng {profile.lng.toFixed(4)}</span>
        </div>
      </div>
    </div>
  );
}
