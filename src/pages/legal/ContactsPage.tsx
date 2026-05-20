import { Link } from "react-router-dom";
import { ChevronRight, Mail, MessageCircle, Clock, MapPin } from "lucide-react";
import { usePageMeta } from "../../hooks/usePageMeta";
import { PublicHeader } from "../../components/PublicHeader";

const CONTACTS = [
  {
    icon: <Mail size={20} />,
    title: "Электронная почта",
    value: "support@slot-home.ru",
    hint: "Ответим в течение 2 часов в рабочее время",
    href: "mailto:support@slot-home.ru",
  },
  {
    icon: <MessageCircle size={20} />,
    title: "Чат поддержки",
    value: "В приложении",
    hint: "Для зарегистрированных пользователей — раздел «Поддержка»",
    href: null,
  },
  {
    icon: <Clock size={20} />,
    title: "Часы работы поддержки",
    value: "Пн–Вс, 9:00–22:00",
    hint: "Заказы принимаем круглосуточно",
    href: null,
  },
  {
    icon: <MapPin size={20} />,
    title: "Юридический адрес",
    value: "г. Москва",
    hint: "ООО «СЛОТ»",
    href: null,
  },
];

const FAQ = [
  {
    q: "Как отследить статус заказа?",
    a: "В личном кабинете раздел «Мои заказы» — там отображается текущий статус и данные исполнителя.",
  },
  {
    q: "Хочу стать исполнителем. Куда обращаться?",
    a: "Пройдите регистрацию через раздел «Для мастеров» — верификация занимает до 24 часов.",
  },
  {
    q: "Как вернуть деньги за некачественную услугу?",
    a: "Обратитесь в поддержку через чат в приложении или на почту support@slot-home.ru в течение 7 дней после выполнения заказа.",
  },
  {
    q: "Как удалить аккаунт?",
    a: "Напишите на privacy@slot-home.ru с темой «Удаление аккаунта». Данные будут удалены в течение 30 дней.",
  },
];

export function ContactsPage() {
  usePageMeta({
    title: "Контакты — SLOT",
    description: "Свяжитесь с командой SLOT. Поддержка клиентов и исполнителей, вопросы о заказах и сотрудничестве.",
    canonical: "https://slot-home.ru/contacts",
  });

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />
      <div className="max-w-2xl mx-auto px-4 pt-24 pb-16">
        <nav className="flex items-center gap-2 text-xs text-gray-400 mb-10">
          <Link to="/" className="hover:text-gray-700 transition-colors">Главная</Link>
          <ChevronRight size={12} />
          <span className="text-gray-500">Контакты</span>
        </nav>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Контакты</h1>
        <p className="text-base text-gray-500 mb-10 leading-relaxed">
          Мы на связи ежедневно. Выберите удобный способ — ответим быстро.
        </p>

        {/* Contact cards */}
        <div className="grid sm:grid-cols-2 gap-3 mb-12">
          {CONTACTS.map((c) => (
            <div key={c.title} className="p-5 rounded-2xl border border-gray-100 bg-gray-50">
              <div className="w-9 h-9 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-600 mb-4">
                {c.icon}
              </div>
              <p className="text-xs text-gray-400 mb-0.5">{c.title}</p>
              {c.href ? (
                <a href={c.href} className="text-sm font-bold text-gray-900 hover:text-gray-600 transition-colors">
                  {c.value}
                </a>
              ) : (
                <p className="text-sm font-bold text-gray-900">{c.value}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">{c.hint}</p>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <h2 className="text-xl font-black text-gray-900 mb-5">Частые вопросы</h2>
        <div className="flex flex-col gap-4 mb-12">
          {FAQ.map((item) => (
            <div key={item.q} className="p-5 rounded-2xl border border-gray-100">
              <p className="text-sm font-semibold text-gray-900 mb-1.5">{item.q}</p>
              <p className="text-sm text-gray-500 leading-relaxed">{item.a}</p>
            </div>
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
