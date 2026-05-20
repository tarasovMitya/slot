import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronRight, Clock, MapPin, CheckCircle } from "lucide-react";
import { usePageMeta } from "../../hooks/usePageMeta";
import { PublicHeader } from "../../components/PublicHeader";
import { SERVICES } from "../services/servicesData";
import { NotFoundPage } from "../NotFoundPage";
import type { DistrictData } from "./districtData";
import { ARTICLES } from "../blog/blogData";

const BENEFITS = [
  "Выезд в день заказа",
  "Фиксированная цена до начала работ",
  "Верифицированные мастера",
  "Гарантия на все виды работ",
];

const SERVICE_ICONS: Record<string, string> = {
  electrician:        "⚡",
  plumber:            "🔧",
  cleaning:           "🧹",
  handyman:           "🔨",
  "furniture-assembly": "🪑",
  "tv-installation":  "📺",
  "door-installation": "🚪",
};

interface DistrictPageProps {
  district: DistrictData;
}

export function DistrictPage({ district }: DistrictPageProps) {
  if (!district) return <NotFoundPage />;

  const { name, nameIn, okrug, okrugFull, slug } = district;
  const canonical = `https://slot-home.ru/moscow/${slug}`;
  const metaTitle = `Бытовые услуги ${nameIn} — электрик, сантехник, уборка`;
  const metaDesc = `Закажите электрика, сантехника, уборку и другие бытовые услуги ${nameIn}. Проверенные мастера, выезд в день заказа, фиксированные цены.`;

  usePageMeta({ title: metaTitle, description: metaDesc, canonical });

  useEffect(() => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: `SLOT — бытовые услуги ${nameIn}`,
      description: metaDesc,
      url: canonical,
      areaServed: {
        "@type": "Place",
        name: `${name}, Москва`,
        address: { "@type": "PostalAddress", addressLocality: "Москва", addressRegion: name },
      },
    };
    const el = document.getElementById("district-schema");
    if (el) { el.textContent = JSON.stringify(schema); return; }
    const s = document.createElement("script");
    s.id = "district-schema";
    s.type = "application/ld+json";
    s.textContent = JSON.stringify(schema);
    document.head.appendChild(s);
    return () => { document.getElementById("district-schema")?.remove(); };
  }, [slug]);

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      {/* Hero */}
      <section className="bg-gray-950 text-white pt-24 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-4">
            <MapPin size={14} />
            <span>{okrugFull} · {okrug} · Москва</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            Бытовые услуги {nameIn}
          </h1>
          <p className="text-gray-300 text-lg mb-8 max-w-xl">
            Электрик, сантехник, уборка и другие мастера {nameIn}. Выезд в день заказа, фиксированные цены.
          </p>
          <Link
            to="/calculator"
            className="inline-flex items-center gap-2 px-7 py-4 bg-white text-gray-900 font-bold rounded-2xl hover:bg-gray-100 transition-all active:scale-95"
          >
            Рассчитать стоимость
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Services grid */}
      <section className="max-w-3xl mx-auto px-4 py-14">
        <h2 className="text-2xl font-black text-gray-900 mb-2">Услуги {nameIn}</h2>
        <p className="text-gray-500 mb-8">Выберите нужную услугу — мастер приедет к вам домой</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {SERVICES.map((service) => (
            <Link
              key={service.slug}
              to={`/moscow/${slug}/${service.slug}`}
              className="group flex items-start gap-4 p-5 rounded-2xl border border-gray-100 hover:border-gray-300 hover:shadow-sm transition-all"
            >
              <span className="text-3xl leading-none">{SERVICE_ICONS[service.slug] ?? "🔩"}</span>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-gray-900 group-hover:text-black">
                  {service.nameRu} {nameIn}
                </div>
                <div className="text-sm text-gray-500 mt-0.5 line-clamp-2">{service.description}</div>
                <div className="text-xs text-gray-400 mt-2">
                  от {Math.min(...service.prices.map((p) => p.from)).toLocaleString("ru-RU")} ₽
                </div>
              </div>
              <ArrowRight size={16} className="text-gray-300 group-hover:text-gray-500 shrink-0 mt-1 transition-colors" />
            </Link>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-gray-50 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-black text-gray-900 mb-6">Почему SLOT {nameIn}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {BENEFITS.map((b) => (
              <div key={b} className="flex items-center gap-3 bg-white rounded-2xl px-5 py-4 border border-gray-100">
                <CheckCircle size={18} className="text-green-500 shrink-0" />
                <span className="text-sm font-medium text-gray-800">{b}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Blog articles */}
      <section className="max-w-3xl mx-auto px-4 py-12">
        <h2 className="text-xl font-black text-gray-900 mb-6">Полезные статьи</h2>
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
      </section>

      {/* CTA */}
      <section className="bg-gray-950 text-white py-14 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-black mb-2">Заказать мастера {nameIn}</h2>
          <p className="text-gray-300 text-sm mb-6">Рассчитайте стоимость и выберите удобное время</p>
          <Link
            to="/calculator"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-900 font-bold rounded-2xl hover:bg-gray-100 transition-all active:scale-95"
          >
            Рассчитать стоимость
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Breadcrumb */}
      <nav className="max-w-3xl mx-auto px-4 py-6 flex items-center gap-2 text-sm text-gray-400">
        <Link to="/" className="hover:text-gray-700">Главная</Link>
        <span>/</span>
        <Link to="/moscow" className="hover:text-gray-700">Услуги в Москве</Link>
        <span>/</span>
        <span className="text-gray-600">{name}</span>
      </nav>
    </div>
  );
}
