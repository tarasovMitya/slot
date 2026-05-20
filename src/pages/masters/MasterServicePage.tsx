import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRight, CheckCircle, ChevronDown, ChevronRight } from "lucide-react";
import { usePageMeta } from "../../hooks/usePageMeta";
import { PublicHeader } from "../../components/PublicHeader";
import { NotFoundPage } from "../NotFoundPage";
import { getMasterService, MASTER_SERVICES } from "./mastersData";
import { trackEvent } from "../../hooks/useAnalytics";

export function MasterServicePage() {
  const { service: slug } = useParams<{ service: string }>();
  const service = getMasterService(slug ?? "");

  if (!service) return <NotFoundPage />;

  const { nameRu, nameInstrumental, nameAccusative, earningsFrom, earningsTo, avgOrder,
    metaTitle, metaDescription, description, requirements, benefits, steps,
    earningsTable, faq, relatedSlugs } = service;

  const canonical = `https://slot-home.ru/masters/${slug}`;

  usePageMeta({ title: metaTitle, description: metaDescription, canonical });

  useEffect(() => {
    const schema = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Главная", item: "https://slot-home.ru" },
            { "@type": "ListItem", position: 2, name: "Для мастеров", item: "https://slot-home.ru/masters" },
            { "@type": "ListItem", position: 3, name: `Работа ${nameInstrumental}`, item: canonical },
          ],
        },
        {
          "@type": "JobPosting",
          title: `${nameRu} (самозанятый)`,
          description: metaDescription,
          datePosted: "2026-01-01",
          employmentType: "CONTRACTOR",
          hiringOrganization: { "@type": "Organization", name: "SLOT", url: "https://slot-home.ru" },
          jobLocation: { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: "Москва", addressCountry: "RU" } },
          baseSalary: {
            "@type": "MonetaryAmount",
            currency: "RUB",
            value: { "@type": "QuantitativeValue", minValue: earningsFrom, maxValue: earningsTo, unitText: "MONTH" },
          },
        },
      ],
    };
    const el = document.getElementById("master-schema");
    if (el) { el.textContent = JSON.stringify(schema); return; }
    const s = document.createElement("script");
    s.id = "master-schema";
    s.type = "application/ld+json";
    s.textContent = JSON.stringify(schema);
    document.head.appendChild(s);
    return () => { document.getElementById("master-schema")?.remove(); };
  }, [canonical]);

  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const related = relatedSlugs.map((s) => getMasterService(s)).filter(Boolean) as typeof MASTER_SERVICES;

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      {/* Hero */}
      <section className="bg-gray-950 text-white pt-28 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <nav className="flex items-center gap-2 text-xs text-gray-400 mb-8 flex-wrap">
            <Link to="/" className="hover:text-white transition-colors">Главная</Link>
            <ChevronRight size={12} />
            <Link to="/masters" className="hover:text-white transition-colors">Для мастеров</Link>
            <ChevronRight size={12} />
            <span className="text-gray-300">Работа {nameInstrumental}</span>
          </nav>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">
            Работа {nameInstrumental} в Москве
          </h1>
          <p className="text-gray-300 text-lg mb-4 max-w-xl">{description}</p>
          <p className="text-gray-400 text-sm mb-8">
            от {earningsFrom.toLocaleString("ru-RU")} до {earningsTo.toLocaleString("ru-RU")} ₽/мес · средний заказ {avgOrder.toLocaleString("ru-RU")} ₽
          </p>
          <Link
            to="/performer/onboarding"
            onClick={() => trackEvent("cta_clicked", { source: "master_service_hero", service: slug })}
            className="inline-flex items-center gap-2 px-7 py-4 bg-white text-gray-900 font-bold rounded-2xl hover:bg-gray-100 transition-all active:scale-95"
          >
            Стать {nameAccusative}
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 py-12 flex flex-col gap-10">

        {/* Earnings table */}
        <section>
          <h2 className="text-xl font-black text-gray-900 mb-4">Сколько можно зарабатывать</h2>
          <div className="rounded-2xl border border-gray-100 overflow-hidden mb-3">
            {earningsTable.map((row, i) => (
              <div key={i} className={`flex items-center justify-between px-5 py-4 ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                <span className="text-sm text-gray-700">{row.label}</span>
                <span className="text-sm font-bold text-gray-900 shrink-0">{row.value}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 ml-1">
            При {service.ordersPerMonth} заказах в месяц — от {earningsFrom.toLocaleString("ru-RU")} ₽
          </p>
        </section>

        {/* Requirements */}
        <section>
          <h2 className="text-xl font-black text-gray-900 mb-4">Что нужно для работы</h2>
          <div className="flex flex-col gap-2">
            {requirements.map((r) => (
              <div key={r} className="flex items-start gap-3 p-4 rounded-2xl bg-gray-50">
                <CheckCircle size={16} className="text-green-500 shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">{r}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Steps */}
        <section>
          <h2 className="text-xl font-black text-gray-900 mb-4">Как начать работать</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {steps.map((step, i) => (
              <div key={i} className="p-5 rounded-2xl border border-gray-100">
                <div className="w-8 h-8 rounded-xl bg-black text-white text-sm font-black flex items-center justify-center mb-4">
                  {i + 1}
                </div>
                <p className="font-bold text-gray-900 mb-1">{step.title}</p>
                <p className="text-sm text-gray-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Benefits */}
        <section>
          <h2 className="text-xl font-black text-gray-900 mb-4">Преимущества работы на SLOT</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {benefits.map((b) => (
              <div key={b} className="flex items-start gap-3 p-4 rounded-2xl border border-gray-100">
                <CheckCircle size={16} className="text-green-500 shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">{b}</span>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="text-xl font-black text-gray-900 mb-4">Частые вопросы</h2>
          <div className="flex flex-col gap-2">
            {faq.map((item, i) => (
              <div key={i} className="rounded-2xl border border-gray-100 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left gap-4"
                >
                  <span className="text-sm font-semibold text-gray-900">{item.q}</span>
                  <ChevronDown size={16} className={`shrink-0 text-gray-400 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
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

        {/* Related */}
        {related.length > 0 && (
          <section>
            <h2 className="text-xl font-black text-gray-900 mb-4">Другие специализации</h2>
            <div className="grid sm:grid-cols-3 gap-3">
              {related.map((s) => (
                <Link
                  key={s.slug}
                  to={`/masters/${s.slug}`}
                  className="p-4 rounded-2xl border border-gray-100 hover:border-gray-300 transition-colors group"
                >
                  <p className="font-semibold text-gray-900 group-hover:text-gray-700 text-sm">
                    Работа {s.nameInstrumental}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    от {s.earningsFrom.toLocaleString("ru-RU")} ₽/мес
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-xs font-semibold text-gray-400 group-hover:text-gray-600 transition-colors">
                    Подробнее <ChevronRight size={11} />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* CTA */}
      <section className="bg-gray-950 text-white py-14 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-black mb-2">Стать {nameAccusative} на SLOT</h2>
          <p className="text-gray-300 text-sm mb-6">Регистрация 5 минут · верификация до 24 часов · первый заказ уже завтра</p>
          <Link
            to="/performer/onboarding"
            onClick={() => trackEvent("cta_clicked", { source: "master_service_cta", service: slug })}
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-900 font-bold rounded-2xl hover:bg-gray-100 transition-all active:scale-95"
          >
            Зарегистрироваться
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Breadcrumb */}
      <nav className="max-w-3xl mx-auto px-4 py-6 flex flex-wrap items-center gap-2 text-sm text-gray-400">
        <Link to="/" className="hover:text-gray-700">Главная</Link>
        <span>/</span>
        <Link to="/masters" className="hover:text-gray-700">Для мастеров</Link>
        <span>/</span>
        <span className="text-gray-600">Работа {nameInstrumental}</span>
      </nav>
    </div>
  );
}
