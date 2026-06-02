import { Link } from "react-router-dom";
import { ArrowRight, ChevronRight, CheckCircle, Zap, Clock, Shield } from "lucide-react";
import { usePageMeta } from "../../hooks/usePageMeta";
import { PublicHeader } from "../../components/PublicHeader";
import { MASTER_SERVICES } from "./mastersData";
import { trackEvent } from "../../hooks/useAnalytics";

const PLATFORM_STATS = [
  { value: "2 500+", label: "заказов в месяц" },
  { value: "4.8", label: "средний рейтинг мастеров" },
  { value: "1 день", label: "срок верификации" },
];

const HOW_IT_WORKS = [
  { icon: <Zap size={20} />, title: "Заказы без поиска", desc: "Клиенты приходят сами — вы просто принимаете те заказы, которые удобны." },
  { icon: <Clock size={20} />, title: "Гибкий график", desc: "Работайте когда хотите. Хоть 2 дня в неделю, хоть ежедневно — вы сами решаете." },
  { icon: <Shield size={20} />, title: "Поддержка и страховка", desc: "Команда SLOT всегда на связи. Спорные ситуации разрешаем в вашу пользу." },
];

const SERVICE_ICONS: Record<string, string> = {
  electrician: "⚡",
  plumber: "🔧",
  cleaning: "🧹",
  handyman: "🔨",
  "furniture-assembly": "🪑",
  "tv-installation": "📺",
  "door-installation": "🚪",
};

export function MastersHubPage() {
  usePageMeta({
    title: "Работа мастером в Москве — заказы на дом без поиска клиентов",
    description: "Стать исполнителем на SLOT: электрик, сантехник, клинер, мастер на час. Гибкий график, заказы онлайн, выплата в тот же день.",
    canonical: "https://slot-home.ru/masters",
  });

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      {/* Hero */}
      <section className="bg-gray-950 text-white pt-28 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <nav className="flex items-center gap-2 text-xs text-gray-400 mb-8">
            <Link to="/" className="hover:text-white transition-colors">Главная</Link>
            <ChevronRight size={12} />
            <span className="text-gray-300">Для мастеров</span>
          </nav>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">
            Работа мастером в Москве
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mb-8">
            Подключитесь к платформе и получайте заказы на дом — без рекламы, агентств и поиска клиентов. Электрик, сантехник, клинер и другие специальности.
          </p>
          <Link
            to="/performer/onboarding"
            onClick={() => trackEvent("cta_clicked", { source: "masters_hub_hero" })}
            className="inline-flex items-center gap-2 px-7 py-4 bg-white text-gray-900 font-bold rounded-2xl hover:bg-gray-100 transition-all active:scale-95"
          >
            Стать исполнителем
            <ArrowRight size={16} />
          </Link>

          <div className="flex flex-wrap gap-8 mt-12 pt-8 border-t border-gray-800">
            {PLATFORM_STATS.map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-black">{s.value}</p>
                <p className="text-sm text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-4 py-14">
        <h2 className="text-2xl font-black text-gray-900 mb-8">Как это работает</h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {HOW_IT_WORKS.map((item) => (
            <div key={item.title} className="p-5 rounded-2xl border border-gray-100">
              <div className="w-10 h-10 rounded-xl bg-[#003B8F] text-white flex items-center justify-center mb-4">
                {item.icon}
              </div>
              <p className="font-bold text-gray-900 mb-1">{item.title}</p>
              <p className="text-sm text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section className="bg-gray-50 py-14 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-black text-gray-900 mb-2">Выберите специализацию</h2>
          <p className="text-gray-500 mb-8">Подключитесь как электрик, сантехник, клинер или мастер на час</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {MASTER_SERVICES.map((s) => (
              <Link
                key={s.slug}
                to={`/masters/${s.slug}`}
                className="group flex items-start gap-4 p-5 rounded-2xl bg-white border border-gray-100 hover:border-gray-300 hover:shadow-sm transition-all"
              >
                <span className="text-3xl leading-none">{SERVICE_ICONS[s.slug] ?? "🔩"}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 group-hover:text-[#006AFF]">
                    Работа {s.nameInstrumental}
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    от {s.earningsFrom.toLocaleString("ru-RU")} ₽/мес · ср. заказ {s.avgOrder.toLocaleString("ru-RU")} ₽
                  </p>
                </div>
                <ArrowRight size={16} className="text-gray-300 group-hover:text-gray-500 shrink-0 mt-1 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="max-w-4xl mx-auto px-4 py-14">
        <h2 className="text-2xl font-black text-gray-900 mb-6">Почему SLOT</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            "Заказы поступают автоматически — не нужно искать клиентов",
            "Гибкий график — работайте когда и сколько хотите",
            "Выплата в тот же день после подтверждения заказа",
            "Поддержка 24/7 и страховка на каждый заказ",
            "Прозрачная комиссия — никаких скрытых списаний",
            "Рейтинговая система — хорошая работа = больше заказов",
          ].map((b) => (
            <div key={b} className="flex items-start gap-3 p-4 rounded-2xl bg-gray-50">
              <CheckCircle size={16} className="text-green-500 shrink-0 mt-0.5" />
              <span className="text-sm text-gray-700">{b}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-950 text-white py-14 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-black mb-2">Начните получать заказы уже завтра</h2>
          <p className="text-gray-300 text-sm mb-6">Регистрация — 5 минут. Верификация — до 24 часов.</p>
          <Link
            to="/performer/onboarding"
            onClick={() => trackEvent("cta_clicked", { source: "masters_hub_cta" })}
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-900 font-bold rounded-2xl hover:bg-gray-100 transition-all active:scale-95"
          >
            Стать исполнителем
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}
