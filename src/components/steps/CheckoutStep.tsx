import { useState, useEffect } from "react";
import { useCalculatorStore } from "../../store/calculatorStore";
import { formatPrice, pluralService } from "../../utils/priceCalculator";
import { AddressSuggest } from "../ui/AddressSuggest";

function applyPhoneMask(value: string): string {
  const digits = value.replace(/\D/g, "");
  const local = digits.startsWith("7") || digits.startsWith("8") ? digits.slice(1) : digits;
  const d = local.slice(0, 10);
  if (d.length === 0) return "+7";
  if (d.length <= 3) return `+7 (${d}`;
  if (d.length <= 6) return `+7 (${d.slice(0, 3)}) ${d.slice(3)}`;
  if (d.length <= 8) return `+7 (${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  return `+7 (${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, 8)}-${d.slice(8, 10)}`;
}

function isAutoName(name: string) { return !name || name.startsWith("tg_"); }
function isAutoEmail(email: string) { return !email || email.endsWith("@slot-home.ru"); }

export function CheckoutStep() {
  const { cart, schedule, contacts, setContacts } = useCalculatorStore();

  const grandTotal = cart.reduce((sum, item) => sum + item.priceTotal, 0);

  // Determine which fields need to be filled by the user
  const needsName    = isAutoName(contacts.name);
  const needsEmail   = isAutoEmail(contacts.email);
  const needsAddress = !contacts.address;
  const showForm     = needsName || needsEmail || needsAddress;

  // Local form state — initialized once from contacts
  const [name,    setName]    = useState(() => isAutoName(contacts.name)   ? "" : contacts.name);
  const [phone,   setPhone]   = useState(() => contacts.phone || "+7");
  const [email,   setEmail]   = useState(() => isAutoEmail(contacts.email) ? "" : contacts.email);
  const [address, setAddress] = useState(() => contacts.address || "");

  // Push form values into the store on every change
  useEffect(() => {
    if (!showForm) return;
    setContacts({
      name:    name    || contacts.name,
      phone,
      email:   email   || contacts.email,
      address,
      comment: contacts.comment,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, phone, email, address]);

  const formatDate = (iso: string) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("ru-RU", {
      day: "numeric", month: "long", weekday: "long",
    });
  };

  const inputCls = (hasError: boolean) =>
    `w-full px-4 py-3 rounded-2xl border-2 text-sm outline-none transition-colors ${
      hasError ? "border-red-300 bg-red-50" : "border-gray-100 focus:border-gray-900"
    }`;

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
          Проверьте заказ
        </h2>
        <p className="text-gray-500 mt-2 text-lg">Всё верно?</p>
      </div>

      <div className="flex flex-col gap-3">
        {/* Services */}
        <Section title={`Состав заказа · ${cart.length} ${pluralService(cart.length)}`}>
          {cart.map((item, idx) => (
            <div key={item.id} className={idx > 0 ? "pt-4 border-t border-gray-50" : ""}>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 shrink-0">
                  {idx + 1}
                </span>
                <span className="text-sm font-semibold text-gray-900">{item.serviceName}</span>
              </div>
              <div className="flex flex-col gap-1.5 pl-7">
                {item.priceBreakdown.map((b, i) => (
                  <Row key={i} label={b.label} value={formatPrice(b.amount)} />
                ))}
                {item.priceBreakdown.length > 1 && (
                  <div className="flex items-center justify-between pt-1.5 border-t border-gray-50">
                    <span className="text-xs text-gray-400">Подитог</span>
                    <span className="text-xs font-semibold text-gray-700">{formatPrice(item.priceTotal)}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 mt-2">
            <span className="text-base font-bold text-gray-900">Итого</span>
            <span className="text-xl font-bold text-gray-900">{formatPrice(grandTotal)}</span>
          </div>
        </Section>

        {/* Schedule */}
        <Section title="Дата и время">
          <Row label="Дата" value={formatDate(schedule.date)} />
          <Row label="Время" value={schedule.time || "—"} />
        </Section>

        {/* Contacts — editable form or read-only */}
        {showForm ? (
          <div className="rounded-2xl border-2 border-blue-100 bg-blue-50/40 p-5">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
              Заполните данные
            </p>
            <p className="text-xs text-blue-500 mb-4">
              Нужны для назначения исполнителя и связи с вами
            </p>
            <div className="flex flex-col gap-3">

              {needsName && (
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Имя</label>
                  <input
                    type="text"
                    placeholder="Как к вам обращаться"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus
                    className={inputCls(!name)}
                  />
                </div>
              )}

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Телефон</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(applyPhoneMask(e.target.value))}
                  className={inputCls(phone.length < 5)}
                />
              </div>

              {needsEmail && (
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Email</label>
                  <input
                    type="email"
                    placeholder="для уведомлений о заказе"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputCls(!email)}
                  />
                </div>
              )}

              {needsAddress && (
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Адрес</label>
                  <AddressSuggest
                    value={address}
                    onChange={(val) => setAddress(val)}
                    placeholder="Улица, дом, квартира"
                    error={!address}
                  />
                </div>
              )}
            </div>
          </div>
        ) : (
          <Section title="Контакты">
            <Row label="Имя" value={contacts.name} />
            <Row label="Email" value={contacts.email} warn={!contacts.email} />
            <Row label="Адрес" value={contacts.address} warn={!contacts.address} />
            {contacts.phone && <Row label="Телефон" value={contacts.phone} />}
            {contacts.comment && <Row label="Комментарий" value={contacts.comment} />}
          </Section>
        )}

        {/* Validation warning */}
        {(!contacts.email || !contacts.address) && !showForm && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Заполните email и адрес — без них нельзя назначить исполнителя
          </div>
        )}

        {/* Price disclaimer */}
        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          Стоимость фиксируется при оформлении заказа и не может быть изменена.
          {" "}Если исполнитель назвал другую сумму после уточнения деталей —{" "}
          <a href="/dashboard/support" className="underline font-medium hover:text-blue-900 transition-colors">
            напишите в поддержку
          </a>
          {" "}для урегулирования.
        </div>

        {/* TEST MODE notice */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <span className="font-semibold">Тестовый режим.</span> Оплата производится напрямую исполнителю после выполнения работ.
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-100 p-5">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">{title}</p>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function Row({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm text-gray-500 shrink-0">{label}</span>
      <span className={`text-sm font-medium text-right ${warn ? "text-amber-600 italic" : "text-gray-900"}`}>
        {value || "Не указано"}
      </span>
    </div>
  );
}
