import { Link } from "react-router-dom";
import { Clock, ChevronRight, MapPin } from "lucide-react";
import { usePageMeta } from "../../hooks/usePageMeta";
import { PublicHeader } from "../../components/PublicHeader";
import { ARTICLES } from "./blogData";
import { SERVICES } from "../services/servicesData";
import { DISTRICTS } from "../geo/districtData";

const CATEGORY_COLORS: Record<string, string> = {
  "Электрика": "bg-yellow-50 text-yellow-700",
  "Сантехника": "bg-blue-50 text-blue-700",
  "Уборка": "bg-green-50 text-green-700",
  "Муж на час": "bg-orange-50 text-orange-700",
  "Сборка мебели": "bg-purple-50 text-purple-700",
  "Установка ТВ": "bg-gray-100 text-gray-700",
  "Установка дверей": "bg-red-50 text-red-700",
};

export function BlogPage() {
  usePageMeta({
    title: "Блог — советы по бытовым услугам",
    description: "Экспертные статьи о ремонте, уборке, сантехнике и электрике. Советы профессионалов, цены и инструкции для жителей Москвы.",
    canonical: "https://slot-home.ru/blog",
  });

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />
      <section className="bg-gray-950 text-white pt-28 pb-14 px-4">
        <div className="max-w-4xl mx-auto">
          <nav className="flex items-center gap-2 text-xs text-gray-400 mb-6">
            <Link to="/" className="hover:text-white transition-colors">Главная</Link>
            <ChevronRight size={12} />
            <span className="text-gray-300">Блог</span>
          </nav>
          <h1 className="text-4xl font-black tracking-tight mb-3">Блог SLOT</h1>
          <p className="text-gray-300 max-w-xl">
            Экспертные статьи о бытовых услугах: советы мастеров, цены, инструкции и руководства покупателя.
          </p>
        </div>
      </section>

      {/* Articles grid */}
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="grid sm:grid-cols-2 gap-5">
          {ARTICLES.map((a) => (
            <Link
              key={a.slug}
              to={`/blog/${a.slug}`}
              className="group flex flex-col rounded-2xl border border-gray-100 hover:border-gray-300 transition-all overflow-hidden"
            >
              <div className="p-5 flex flex-col gap-3 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${CATEGORY_COLORS[a.category] ?? "bg-gray-100 text-gray-600"}`}>
                    {a.category}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock size={11} />
                    {a.readTime} мин
                  </span>
                </div>
                <h2 className="text-base font-bold text-gray-900 group-hover:text-gray-700 transition-colors leading-snug">
                  {a.title}
                </h2>
                <p className="text-sm text-gray-500 leading-relaxed flex-1">{a.excerpt}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-400">
                    {new Date(a.publishedAt).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-semibold text-gray-400 group-hover:text-gray-600 transition-colors">
                    Читать <ChevronRight size={12} />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Services links */}
        <div className="mt-12 pt-10 border-t border-gray-100">
          <h2 className="text-lg font-black text-gray-900 mb-4">Услуги в Москве</h2>
          <div className="flex flex-wrap gap-2">
            {SERVICES.map((s) => (
              <Link
                key={s.slug}
                to={`/moscow/${s.slug}`}
                className="px-4 py-2 rounded-xl border border-gray-100 hover:border-gray-300 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                {s.nameRu}
              </Link>
            ))}
          </div>
        </div>

        {/* Districts links */}
        <div className="mt-8 pb-4">
          <h2 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
            <MapPin size={16} className="text-gray-400" />
            По районам Москвы
          </h2>
          <div className="flex flex-wrap gap-2">
            {DISTRICTS.slice(0, 15).map((d) => (
              <Link
                key={d.slug}
                to={`/moscow/${d.slug}`}
                className="px-3 py-1.5 rounded-xl border border-gray-100 hover:border-gray-300 text-xs text-gray-500 hover:text-gray-800 transition-colors"
              >
                {d.name}
              </Link>
            ))}
            <Link to="/moscow" className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors flex items-center gap-1">
              Все районы <ChevronRight size={11} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
