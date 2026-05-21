import { Link } from "react-router-dom";
import { ArrowRight, ChevronRight, Clock, MapPin } from "lucide-react";
import { usePageMeta } from "../../hooks/usePageMeta";
import { PublicHeader } from "../../components/PublicHeader";
import { SERVICES } from "../services/servicesData";
import { DISTRICTS } from "./districtData";
import { ARTICLES } from "../blog/blogData";

export function MoscowPage() {
  usePageMeta({
    title: "Мастера на дом в Москве — уборка, сантехника, электрика",
    description: "Вызвать мастера на дом в Москве. Уборка от 2 000 ₽, сантехник от 1 200 ₽, электрик от 1 500 ₽. Проверенные мастера, выезд в день заказа, оплата онлайн.",
    canonical: "https://slot-home.ru/moscow",
  });

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />
      <section className="bg-gray-950 text-white pt-30 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <nav className="flex items-center gap-2 text-xs text-gray-400 mb-8">
            <Link to="/" className="hover:text-white transition-colors">Главная</Link>
            <ChevronRight size={12} />
            <span className="text-gray-300">Москва</span>
          </nav>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">
            Бытовые услуги в Москве
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mb-8">
            Проверенные мастера в любом районе Москвы. Выезд в день заказа, фиксированные цены, гарантия качества.
          </p>
          <Link
            to="/calculator"
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-white text-gray-900 font-bold rounded-2xl hover:bg-gray-100 transition-all active:scale-95"
          >
            Рассчитать стоимость
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-black text-gray-900 mb-6">Все услуги в Москве</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {SERVICES.map((s) => (
            <Link
              key={s.slug}
              to={`/moscow/${s.slug}`}
              className="p-5 rounded-2xl border border-gray-100 hover:border-gray-300 transition-colors group"
            >
              <p className="font-bold text-gray-900 group-hover:text-gray-700">{s.nameRu} в Москве</p>
              <p className="text-sm text-gray-400 mt-1 line-clamp-2">{s.description}</p>
              <div className="flex items-center gap-1 mt-3 text-xs font-semibold text-gray-400 group-hover:text-gray-600 transition-colors">
                Подробнее <ChevronRight size={12} />
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-black text-gray-900 mb-6">Полезные статьи</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {ARTICLES.slice(0, 4).map((a) => (
            <Link
              key={a.slug}
              to={`/blog/${a.slug}`}
              className="group flex items-start justify-between gap-3 p-4 rounded-2xl border border-gray-100 hover:border-gray-300 transition-colors"
            >
              <div>
                <p className="text-sm font-semibold text-gray-900 group-hover:text-gray-700 line-clamp-2">{a.title}</p>
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1"><Clock size={10} /> {a.readTime} мин</p>
              </div>
              <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 shrink-0 mt-0.5 transition-colors" />
            </Link>
          ))}
        </div>
        <Link to="/blog" className="mt-4 inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 transition-colors">
          Все статьи <ChevronRight size={13} />
        </Link>
      </div>

      <div className="bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-black text-gray-900 mb-2">По районам Москвы</h2>
          <p className="text-gray-500 text-sm mb-6">Мастера работают во всех районах — выезд в день заказа</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {DISTRICTS.map((d) => (
              <Link
                key={d.slug}
                to={`/moscow/${d.slug}`}
                className="flex items-center gap-2 px-4 py-3 bg-white rounded-2xl border border-gray-100 hover:border-gray-300 transition-colors group text-sm"
              >
                <MapPin size={13} className="text-gray-300 group-hover:text-gray-500 shrink-0 transition-colors" />
                <span className="font-medium text-gray-700 group-hover:text-gray-900 truncate">{d.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
