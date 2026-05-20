import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRight, CheckCircle, ChevronDown, ChevronRight, Clock, MapPin, Star } from "lucide-react";
import { usePageMeta } from "../../hooks/usePageMeta";
import { PublicHeader } from "../../components/PublicHeader";
import { NotFoundPage } from "../NotFoundPage";
import { getService } from "../services/servicesData";
import { getDistrict } from "./districtData";
import { formatPrice } from "../../utils/priceCalculator";
import { trackEvent } from "../../hooks/useAnalytics";
import { ARTICLES } from "../blog/blogData";

export function DistrictServicePage() {
  const { district: districtSlug, service: serviceSlug } = useParams<{
    district: string;
    service: string;
  }>();

  const district = getDistrict(districtSlug ?? "");
  const service = getService(serviceSlug ?? "");

  if (!district || !service) return <NotFoundPage />;

  const { name: districtName, nameIn, okrug, slug: dSlug } = district;
  const { nameRu, nameAccusative, namePrepositional, description, included, prices, faq, reviews, relatedSlugs } = service;

  const canonical = `https://slot-home.ru/moscow/${dSlug}/${serviceSlug}`;
  const metaTitle = `${nameRu} ${nameIn} — цены, выезд в день заказа`;
  const metaDesc = `${nameRu} ${nameIn}. ${description} Фиксированные цены, проверенные мастера, выезд в день заказа.`;

  usePageMeta({ title: metaTitle, description: metaDesc, canonical });

  useEffect(() => {
    const avgRating = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
    const schema = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Service",
          name: `${nameRu} ${nameIn}`,
          description: metaDesc,
          provider: { "@type": "LocalBusiness", name: "SLOT", url: "https://slot-home.ru" },
          areaServed: {
            "@type": "Place",
            name: `${districtName}, Москва, Россия`,
            address: { "@type": "PostalAddress", addressLocality: "Москва", addressRegion: districtName },
          },
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: avgRating.toFixed(1),
            reviewCount: reviews.length,
            bestRating: "5",
          },
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Главная", item: "https://slot-home.ru" },
            { "@type": "ListItem", position: 2, name: "Москва", item: "https://slot-home.ru/moscow" },
            { "@type": "ListItem", position: 3, name: districtName, item: `https://slot-home.ru/moscow/${dSlug}` },
            { "@type": "ListItem", position: 4, name: nameRu, item: canonical },
          ],
        },
      ],
    };
    const existing = document.getElementById("ds-schema");
    if (existing) { existing.textContent = JSON.stringify(schema); return; }
    const s = document.createElement("script");
    s.id = "ds-schema";
    s.type = "application/ld+json";
    s.textContent = JSON.stringify(schema);
    document.head.appendChild(s);
    return () => { document.getElementById("ds-schema")?.remove(); };
  }, [canonical]);

  const minPrice = Math.min(...prices.map((p) => p.from));
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      {/* Hero */}
      <section className="bg-gray-950 text-white pt-24 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 text-gray-400 text-xs mb-4">
            <MapPin size={12} />
            <span>{districtName} · {okrug} · Москва</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            {nameRu} {nameIn}
          </h1>
          <p className="text-gray-300 text-lg mb-3 max-w-xl">{description}</p>
          <p className="text-gray-400 text-sm mb-8">от {formatPrice(minPrice)} · выезд в день заказа</p>
          <Link
            to="/calculator"
            onClick={() => trackEvent("cta_clicked", { source: "district_service_hero", district: dSlug, service: serviceSlug })}
            className="inline-flex items-center gap-2 px-7 py-4 bg-white text-gray-900 font-bold rounded-2xl hover:bg-gray-100 transition-all active:scale-95"
          >
            Рассчитать стоимость
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 py-12 flex flex-col gap-10">

        {/* Included */}
        <section>
          <h2 className="text-xl font-black text-gray-900 mb-4">Что входит в услугу</h2>
          <div className="grid sm:grid-cols-2 gap-2">
            {included.map((item) => (
              <div key={item} className="flex items-center gap-3 py-3 px-4 rounded-2xl bg-gray-50">
                <CheckCircle size={16} className="text-green-500 shrink-0" />
                <span className="text-sm text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Prices */}
        <section>
          <h2 className="text-xl font-black text-gray-900 mb-4">
            Цены на {nameAccusative} {nameIn}
          </h2>
          <div className="rounded-2xl border border-gray-100 overflow-hidden">
            {prices.map((p, i) => (
              <div
                key={p.label}
                className={`flex items-center justify-between px-5 py-4 ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
              >
                <span className="text-sm text-gray-700">{p.label}</span>
                <span className="font-bold text-gray-900 text-sm">от {formatPrice(p.from)}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2 ml-1">Точная стоимость рассчитывается в калькуляторе</p>
        </section>

        {/* Reviews */}
        {reviews.length > 0 && (
          <section>
            <h2 className="text-xl font-black text-gray-900 mb-4">
              Отзывы о {namePrepositional} {nameIn}
            </h2>
            <div className="flex flex-col gap-3">
              {reviews.slice(0, 3).map((r) => (
                <div key={r.name} className="rounded-2xl border border-gray-100 p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={13}
                          className={i < r.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-200"}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-semibold text-gray-800">{r.name}</span>
                    <span className="text-xs text-gray-400 ml-auto">{r.date}</span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{r.text}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* FAQ */}
        {faq.length > 0 && (
          <section>
            <h2 className="text-xl font-black text-gray-900 mb-4">
              Вопросы о {namePrepositional} {nameIn}
            </h2>
            <div className="flex flex-col gap-2">
              {faq.map((item, i) => (
                <div key={i} className="rounded-2xl border border-gray-100 overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left gap-4"
                  >
                    <span className="text-sm font-semibold text-gray-900">{item.q}</span>
                    <ChevronDown
                      size={16}
                      className={`shrink-0 text-gray-400 transition-transform ${openFaq === i ? "rotate-180" : ""}`}
                    />
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-50">
                      {item.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Related blog articles */}
        {(() => {
          const tips = ARTICLES.filter((a) => a.relatedServiceSlug === serviceSlug).slice(0, 2);
          if (!tips.length) return null;
          return (
            <section>
              <h2 className="text-xl font-black text-gray-900 mb-4">Полезные статьи</h2>
              <div className="flex flex-col gap-3">
                {tips.map((a) => (
                  <Link
                    key={a.slug}
                    to={`/blog/${a.slug}`}
                    className="group flex items-start justify-between gap-3 p-4 rounded-2xl border border-gray-100 hover:border-gray-300 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-gray-700">{a.title}</p>
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1"><Clock size={10} /> {a.readTime} мин чтения</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 shrink-0 mt-0.5 transition-colors" />
                  </Link>
                ))}
              </div>
            </section>
          );
        })()}

        {/* Related services in this district */}
        {relatedSlugs.length > 0 && (
          <section>
            <h2 className="text-xl font-black text-gray-900 mb-4">Другие услуги {nameIn}</h2>
            <div className="flex flex-wrap gap-3">
              {relatedSlugs.map((slug) => {
                const rel = getService(slug);
                if (!rel) return null;
                return (
                  <Link
                    key={slug}
                    to={`/moscow/${dSlug}/${slug}`}
                    className="px-4 py-2.5 rounded-2xl border border-gray-200 text-sm font-medium text-gray-700 hover:border-gray-400 hover:text-gray-900 transition-colors"
                  >
                    {rel.nameRu} {nameIn}
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {/* CTA */}
      <section className="bg-gray-950 text-white py-14 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-black mb-2">Вызвать {nameAccusative} {nameIn}</h2>
          <p className="text-gray-300 text-sm mb-6">Выезд в день заказа · фиксированная цена · гарантия</p>
          <Link
            to="/calculator"
            onClick={() => trackEvent("cta_clicked", { source: "district_service_cta", district: dSlug, service: serviceSlug })}
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-900 font-bold rounded-2xl hover:bg-gray-100 transition-all active:scale-95"
          >
            Рассчитать стоимость
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Breadcrumb */}
      <nav className="max-w-3xl mx-auto px-4 py-6 flex flex-wrap items-center gap-2 text-sm text-gray-400">
        <Link to="/" className="hover:text-gray-700">Главная</Link>
        <span>/</span>
        <Link to="/moscow" className="hover:text-gray-700">Москва</Link>
        <span>/</span>
        <Link to={`/moscow/${dSlug}`} className="hover:text-gray-700">{districtName}</Link>
        <span>/</span>
        <span className="text-gray-600">{nameRu}</span>
      </nav>
    </div>
  );
}
