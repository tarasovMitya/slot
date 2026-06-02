import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, MessageCircle, ChevronDown } from "lucide-react";
import { usePageMeta } from "../../hooks/usePageMeta";
import { PublicHeader } from "../../components/PublicHeader";

const FAQ = [
  {
    q: "Как отследить статус заказа?",
    a: "В личном кабинете раздел «Мои заказы» — там отображается текущий статус и данные исполнителя.",
  },
  {
    q: "Как изменить стоимость заказа?",
    a: "Стоимость фиксируется при оформлении. Изменить её можно только через обращение в поддержку — напишите нам в чате приложения.",
  },
  {
    q: "Как вернуть деньги за некачественную услугу?",
    a: "Обратитесь в поддержку через чат в течение 7 дней после выполнения заказа. Мы рассмотрим ситуацию и вернём средства при наличии оснований.",
  },
  {
    q: "Хочу стать исполнителем. Куда обращаться?",
    a: "Пройдите регистрацию через раздел «Для мастеров» — верификация занимает до 24 часов.",
  },
  {
    q: "Как удалить аккаунт?",
    a: "Напишите в поддержку через чат приложения или на privacy@slot-home.ru с темой «Удаление аккаунта». Данные будут удалены в течение 30 дней.",
  },
];

export function ContactsPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  usePageMeta({
    title: "Поддержка — SLOT",
    description: "Обратитесь в службу поддержки SLOT. Ответим на вопросы по заказам, оплате и работе сервиса.",
    canonical: "https://slot-home.ru/contacts",
  });

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />
      <div className="max-w-2xl mx-auto px-4 pt-24 pb-16">
        <nav className="flex items-center gap-2 text-xs text-gray-400 mb-10">
          <Link to="/" className="hover:text-gray-700 transition-colors">Главная</Link>
          <ChevronRight size={12} />
          <span className="text-gray-500">Поддержка</span>
        </nav>

        <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Поддержка</h1>
        <p className="text-base text-gray-500 mb-10 leading-relaxed">
          Ответим на вопросы по заказам, оплате и работе сервиса.
        </p>

        {/* Support CTA */}
        <div className="bg-gray-950 text-white rounded-3xl p-8 mb-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
            <MessageCircle size={28} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-lg font-bold mb-1">Чат поддержки</p>
            <p className="text-sm text-gray-300 leading-relaxed">
              Самый быстрый способ. Войдите в приложение и напишите нам в разделе «Поддержка» — отвечаем ежедневно с 9:00 до 22:00.
            </p>
          </div>
          <Link
            to="/app"
            className="shrink-0 bg-white text-gray-900 text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-gray-100 transition-colors whitespace-nowrap"
          >
            Открыть чат
          </Link>
        </div>

        {/* Email fallback */}
        <div className="border border-gray-100 rounded-2xl p-6 mb-12 flex items-center gap-4">
          <div className="flex-1">
            <p className="text-xs text-gray-400 mb-0.5">Электронная почта</p>
            <a href="mailto:support@slot-home.ru" className="text-sm font-bold text-gray-900 hover:text-gray-600 transition-colors">
              support@slot-home.ru
            </a>
            <p className="text-xs text-gray-400 mt-1">Ответим в течение 2 часов в рабочее время</p>
          </div>
        </div>

        {/* FAQ */}
        <h2 className="text-xl font-black text-gray-900 mb-5">Частые вопросы</h2>
        <div className="flex flex-col divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden mb-12">
          {FAQ.map((item, i) => (
            <button
              key={item.q}
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              className="w-full text-left p-5 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-gray-900">{item.q}</p>
                <ChevronDown
                  size={16}
                  className={`shrink-0 text-gray-400 transition-transform ${openFaq === i ? "rotate-180" : ""}`}
                />
              </div>
              {openFaq === i && (
                <p className="text-sm text-gray-500 leading-relaxed mt-2.5">{item.a}</p>
              )}
            </button>
          ))}
        </div>

        <div className="pt-8 border-t border-gray-100 flex flex-wrap gap-4 text-sm text-gray-400">
          <Link to="/terms" className="hover:text-gray-700 transition-colors">Соглашение</Link>
          <Link to="/privacy" className="hover:text-gray-700 transition-colors">Конфиденциальность</Link>
        </div>
      </div>
    </div>
  );
}
