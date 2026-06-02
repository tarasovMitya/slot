import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { trackEvent } from "../../hooks/useAnalytics";
import { CheckCircle, ChevronDown, ChevronRight, Star, ArrowRight } from "lucide-react";
import { usePageMeta } from "../../hooks/usePageMeta";
import { PublicHeader } from "../../components/PublicHeader";
import type { CityInfo } from "./servicesData";
import { getService, SERVICES } from "./servicesData";
import { DISTRICTS } from "../geo/districtData";
import { NotFoundPage } from "../NotFoundPage";
import { formatPrice } from "../../utils/priceCalculator";

interface ServicePageProps {
  city?: CityInfo;
}

const HOW_IT_WORKS = [
  { step: "1", title: "Рассчитайте стоимость", desc: "Укажите нужные услуги в калькуляторе — цена фиксируется сразу." },
  { step: "2", title: "Выберите время", desc: "Укажите удобную дату и время. Работаем без выходных." },
  { step: "3", title: "Примите работу", desc: "Оплата списывается только после того, как вы подтвердите выполнение." },
];

const BENEFITS = [
  { title: "Проверенные мастера", desc: "Каждый исполнитель проходит верификацию документов и проверку квалификации." },
  { title: "Фиксированная цена", desc: "Стоимость рассчитывается до оплаты и не меняется без вашего согласия." },
  { title: "Гарантия качества", desc: "Если результат не устраивает — разберём ситуацию и вернём деньги." },
  { title: "Работаем 7 дней", desc: "Принимаем заказы ежедневно, включая выходные и праздники." },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={14} className={n <= rating ? "fill-amber-400 text-amber-400" : "text-gray-200 fill-gray-200"} />
      ))}
    </div>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 py-4 text-left"
      >
        <span className="text-sm font-semibold text-gray-900">{q}</span>
        <ChevronDown size={16} className={`text-gray-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <p className="text-sm text-gray-600 pb-4 leading-relaxed">{a}</p>}
    </div>
  );
}

export function ServicePage({ city }: ServicePageProps) {
  const { slug } = useParams<{ slug: string }>();
  const service = getService(slug ?? "");

  if (!service) return <NotFoundPage />;

  const geo = city ? ` ${city.nameIn}` : "";
  const pageTitle = `${service.title}${geo}`;
  const metaTitle = city
    ? `${service.title} ${city.nameIn} — вызвать мастера онлайн`
    : `${service.title} на дому — вызвать мастера`;
  const metaDesc = city
    ? `Вызвать ${service.nameAccusative} ${city.nameIn} онлайн. Проверенные мастера, фиксированные цены, приезд в день заказа.`
    : service.metaDescription;
  const canonical = city
    ? `https://slot-home.ru/${city.slug}/${service.slug}`
    : `https://slot-home.ru/services/${service.slug}`;

  const avgRating = service.reviews.reduce((s, r) => s + r.rating, 0) / service.reviews.length;

  usePageMeta({ title: metaTitle, description: metaDesc, canonical });

  useEffect(() => {
    const id = "service-ld-json";
    document.getElementById(id)?.remove();
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = id;
    const breadcrumbs = [
      { "@type": "ListItem", position: 1, name: "Главная", item: "https://slot-home.ru/" },
      ...(city ? [{ "@type": "ListItem", position: 2, name: city.name, item: `https://slot-home.ru/${city.slug}` }] : []),
      { "@type": "ListItem", position: city ? 3 : 2, name: service.nameRu, item: canonical },
    ];
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "BreadcrumbList",
          itemListElement: breadcrumbs,
        },
        {
          "@type": "Service",
          name: pageTitle,
          description: metaDesc,
          url: canonical,
          provider: { "@type": "Organization", name: "SLOT", url: "https://slot-home.ru" },
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: avgRating.toFixed(1),
            reviewCount: service.reviews.length,
            bestRating: 5,
            worstRating: 1,
          },
          review: service.reviews.map((r) => ({
            "@type": "Review",
            author: { "@type": "Person", name: r.name },
            reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5 },
            reviewBody: r.text,
            datePublished: r.date,
          })),
        },
      ],
    });
    document.head.appendChild(script);
    return () => document.getElementById(id)?.remove();
  }, [canonical]);

  const relatedServices = SERVICES.filter((s) => service.relatedSlugs.includes(s.slug));
  const serviceBase = city ? `/${city.slug}` : "/services";
  const breadcrumbCity = city ? [{ label: city.name, href: `/${city.slug}` }] : [];

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />
      {/* Hero */}
      <section className="bg-gray-950 text-white pt-30 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-gray-400 mb-8 flex-wrap">
            <Link to="/" className="hover:text-white transition-colors">Главная</Link>
            <ChevronRight size={12} />
            {breadcrumbCity.map((b) => (
              <>
                <Link key={b.href} to={b.href} className="hover:text-white transition-colors">{b.label}</Link>
                <ChevronRight size={12} />
              </>
            ))}
            <span className="text-gray-300">{service.nameRu}</span>
          </nav>

          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">
            {pageTitle}
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mb-8">
            {city
              ? `Подбор проверенного специалиста${geo}. Приезд в день заказа, фиксированная цена, гарантия качества.`
              : service.description}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/calculator"
              onClick={() => trackEvent("cta_clicked", { source: "service_hero" })}
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-white text-gray-900 font-bold rounded-2xl hover:bg-gray-100 transition-all active:scale-95"
            >
              Рассчитать стоимость
              <ArrowRight size={16} />
            </Link>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-8 mt-12 pt-8 border-t border-gray-800">
            <div>
              <p className="text-2xl font-black">2 500+</p>
              <p className="text-sm text-gray-400">выполненных заказов</p>
            </div>
            <div>
              <p className="text-2xl font-black">4.8</p>
              <p className="text-sm text-gray-400">средняя оценка мастеров</p>
            </div>
            <div>
              <p className="text-2xl font-black">30 мин</p>
              <p className="text-sm text-gray-400">время принятия заказа</p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-12 flex flex-col gap-14">

        {/* Services included */}
        <section>
          <h2 className="text-2xl font-black text-gray-900 mb-6">Что входит в услугу</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {service.included.map((item) => (
              <div key={item} className="flex items-center gap-3 p-4 rounded-2xl border border-gray-100 bg-gray-50">
                <CheckCircle size={16} className="text-green-500 shrink-0" />
                <span className="text-sm text-gray-800">{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Prices */}
        <section>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Цены на услуги</h2>
          <p className="text-sm text-gray-400 mb-6">Точная стоимость рассчитывается в калькуляторе с учётом параметров вашего заказа</p>
          <div className="rounded-2xl border border-gray-100 overflow-hidden">
            {service.prices.map((p, i) => (
              <div key={i} className={`flex items-center justify-between px-5 py-4 ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                <span className="text-sm text-gray-700">{p.label}</span>
                <span className="text-sm font-bold text-gray-900 shrink-0">от {formatPrice(p.from)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Link
              to="/calculator"
              onClick={() => trackEvent("cta_clicked", { source: "service_prices" })}
              className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900 hover:underline"
            >
              Рассчитать точную стоимость
              <ArrowRight size={14} />
            </Link>
          </div>
        </section>

        {/* How it works */}
        <section>
          <h2 className="text-2xl font-black text-gray-900 mb-6">Как это работает</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {HOW_IT_WORKS.map((step) => (
              <div key={step.step} className="p-5 rounded-2xl border border-gray-100">
                <div className="w-8 h-8 rounded-xl bg-[#006AFF] text-white text-sm font-black flex items-center justify-center mb-4">
                  {step.step}
                </div>
                <p className="font-bold text-gray-900 mb-1">{step.title}</p>
                <p className="text-sm text-gray-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Benefits */}
        <section>
          <h2 className="text-2xl font-black text-gray-900 mb-6">Почему выбирают SLOT</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {BENEFITS.map((b) => (
              <div key={b.title} className="p-5 rounded-2xl bg-gray-50">
                <p className="font-bold text-gray-900 mb-1">{b.title}</p>
                <p className="text-sm text-gray-500">{b.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Reviews */}
        <section>
          <h2 className="text-2xl font-black text-gray-900 mb-6">Отзывы клиентов</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {service.reviews.map((r, i) => (
              <div key={i} className="p-5 rounded-2xl border border-gray-100 flex flex-col gap-3">
                <StarRating rating={r.rating} />
                <p className="text-sm text-gray-700 leading-relaxed flex-1">«{r.text}»</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-900">{r.name}</span>
                  <span className="text-xs text-gray-400">{new Date(r.date).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Частые вопросы</h2>
          <p className="text-sm text-gray-400 mb-6">Всё что нужно знать перед заказом</p>
          <div className="rounded-2xl border border-gray-100 px-5">
            {service.faq.map((item, i) => (
              <FAQItem key={i} q={item.q} a={item.a} />
            ))}
          </div>
        </section>

        {/* Related services */}
        <section>
          <h2 className="text-2xl font-black text-gray-900 mb-6">Похожие услуги</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {relatedServices.map((s) => (
              <Link
                key={s.slug}
                to={`${serviceBase}/${s.slug}`}
                className="p-4 rounded-2xl border border-gray-100 hover:border-gray-300 transition-colors group"
              >
                <p className="font-semibold text-gray-900 group-hover:text-gray-700">{s.nameRu}</p>
                <p className="text-xs text-gray-400 mt-1 line-clamp-2">{s.description}</p>
                <div className="flex items-center gap-1 mt-3 text-xs font-semibold text-gray-400 group-hover:text-gray-600 transition-colors">
                  Подробнее <ChevronRight size={12} />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Districts — only on /moscow/:slug */}
        {city && (
          <section>
            <h2 className="text-2xl font-black text-gray-900 mb-2">
              {service.nameRu} по районам Москвы
            </h2>
            <p className="text-gray-500 text-sm mb-5">Мастера работают во всех районах — выезд в день заказа</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DISTRICTS.map((d) => (
                <Link
                  key={d.slug}
                  to={`/moscow/${d.slug}/${service.slug}`}
                  className="flex items-center justify-between px-4 py-3 rounded-2xl border border-gray-100 hover:border-gray-300 transition-colors group text-sm"
                >
                  <span className="font-medium text-gray-700 group-hover:text-gray-900">{service.nameRu} {d.nameIn}</span>
                  <ChevronRight size={13} className="text-gray-300 group-hover:text-gray-500 shrink-0 transition-colors" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="rounded-3xl bg-gray-950 text-white p-8 text-center">
          <h2 className="text-2xl font-black mb-2">{`Заказать ${service.nameAccusative}${geo}`}</h2>
          <p className="text-gray-300 text-sm mb-6">Рассчитайте стоимость и выберите удобное время прямо сейчас</p>
          <Link
            to="/calculator"
            onClick={() => trackEvent("cta_clicked", { source: "service_cta" })}
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-900 font-bold rounded-2xl hover:bg-gray-100 transition-all active:scale-95"
          >
            Рассчитать стоимость
            <ArrowRight size={16} />
          </Link>
        </section>
      </div>
    </div>
  );
}
