import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { usePageMeta } from "../../hooks/usePageMeta";
import { PublicHeader } from "../../components/PublicHeader";
import { getService, SERVICES } from "../services/servicesData";
import { NotFoundPage } from "../NotFoundPage";

const SERVICE_ICONS: Record<string, string> = {
  electrician: "⚡",
  plumber: "🔧",
  cleaning: "🧹",
  "furniture-assembly": "🛋",
  handyman: "🔨",
  "dry-cleaning": "🧴",
};

const PRICE_FAQ: Record<string, Array<{ q: string; a: string }>> = {
  electrician: [
    { q: "Почему цена на сайте — «от»?", a: "Окончательная стоимость зависит от объёма работ и нюансов ситуации. Калькулятор даёт точную цифру ещё до приезда мастера — она фиксируется и не меняется." },
    { q: "Входят ли материалы в стоимость?", a: "Нет. Цена в калькуляторе — только стоимость работ. Расходники (розетки, кабель, автоматы) оплачиваются отдельно по чеку." },
    { q: "Как оплатить?", a: "Онлайн картой при оформлении заказа. Деньги поступают мастеру только после вашего подтверждения выполненной работы." },
  ],
  plumber: [
    { q: "Почему цена на сайте — «от»?", a: "Итоговая стоимость зависит от сложности засора, типа труб и объёма работ. Точная сумма фиксируется в калькуляторе до заказа." },
    { q: "Входят ли материалы?", a: "Нет. Цены на работу — без стоимости фитингов, кранов и других расходников." },
    { q: "Как оплатить?", a: "Онлайн картой при оформлении. Средства резервируются и переходят мастеру после подтверждения." },
  ],
  cleaning: [
    { q: "Почему цена на сайте — «от»?", a: "Стоимость зависит от площади, типа уборки (поддерживающая, генеральная, после ремонта) и дополнительных опций." },
    { q: "Химия и инвентарь включены?", a: "Да. Уборщики приезжают со своей профессиональной химией и оборудованием. Вам ничего дополнительно покупать не нужно." },
    { q: "Как оплатить?", a: "Картой онлайн при бронировании. Оплата уходит исполнителю после завершения уборки." },
  ],
  "furniture-assembly": [
    { q: "Почему цена на сайте — «от»?", a: "Стоимость зависит от количества и сложности позиций. Шкаф MALM проще шкафа PAX — цены разные. Калькулятор рассчитает точно." },
    { q: "Инструмент у мастера есть?", a: "Да. Всё необходимое для сборки мастер привозит с собой." },
    { q: "Сборка IKEA включает подъём мебели?", a: "Подъём — по договорённости с мастером. Обычно это отдельная доплата, указываемая в заказе." },
  ],
  handyman: [
    { q: "Что входит в час работы?", a: "Любые бытовые задачи: повесить полку, установить карниз, поменять замок, собрать мебель, починить дверь. Инструмент у мастера есть." },
    { q: "Можно заказать несколько задач?", a: "Да. Чем больше задач — тем выгоднее. 3 часа работы мастера дешевле, чем 3 отдельных вызова." },
    { q: "Как оплатить?", a: "Картой онлайн при оформлении. Деньги поступают мастеру только после завершения." },
  ],
  "dry-cleaning": [
    { q: "Почему цена на сайте — «от»?", a: "Стоимость зависит от размера изделия, типа ткани и степени загрязнения. Калькулятор учитывает все параметры." },
    { q: "Мастер приедет домой?", a: "Да, химчистка мягкой мебели (диваны, кресла, матрасы) производится на месте. Специальное оборудование не нужно никуда везти." },
    { q: "Сколько сохнет после химчистки?", a: "Обычно 2–4 часа. Мастер использует профессиональный экстрактор, который удаляет большую часть влаги." },
  ],
};

export function PricePage() {
  const { slug } = useParams<{ slug: string }>();
  const service = getService(slug ?? "");

  if (!service) return <NotFoundPage />;

  const icon = SERVICE_ICONS[service.slug] ?? "🔧";
  const faqItems = PRICE_FAQ[service.slug] ?? [];

  const title = `Стоимость ${service.nameAccusative} в Москве ${new Date().getFullYear()}`;
  const metaDesc = `Цены на ${service.nameAccusative} в Москве. Прайс-лист с фиксированными ценами. От ${service.prices[0]?.from?.toLocaleString("ru")} ₽. Рассчитайте стоимость в калькуляторе.`;

  usePageMeta({
    title: `${title} — SLOT`,
    description: metaDesc,
    canonical: `https://slot-home.ru/price/${service.slug}`,
  });

  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = `schema-price-${service.slug}`;
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Service",
          name: `${service.nameRu} в Москве`,
          provider: { "@type": "Organization", name: "SLOT", url: "https://slot-home.ru" },
          areaServed: { "@type": "City", name: "Москва" },
          offers: service.prices.map((p) => ({
            "@type": "Offer",
            name: p.label,
            price: p.from,
            priceCurrency: "RUB",
            priceSpecification: { "@type": "PriceSpecification", minPrice: p.from, priceCurrency: "RUB" },
          })),
        },
        ...(faqItems.length > 0 ? [{
          "@type": "FAQPage",
          mainEntity: faqItems.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }] : []),
      ],
    });
    document.head.appendChild(script);
    return () => { document.getElementById(`schema-price-${service.slug}`)?.remove(); };
  }, [service.slug]);

  const year = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      <main className="max-w-3xl mx-auto px-4 py-10">
        {/* Breadcrumb */}
        <nav className="text-xs text-gray-400 mb-6 flex items-center gap-1 flex-wrap">
          <Link to="/" className="hover:text-gray-600">Главная</Link>
          <span>/</span>
          <Link to="/moscow" className="hover:text-gray-600">Москва</Link>
          <span>/</span>
          <Link to={`/services/${service.slug}`} className="hover:text-gray-600">{service.nameRu}</Link>
          <span>/</span>
          <span className="text-gray-600">Цены</span>
        </nav>

        {/* Hero */}
        <div className="mb-10">
          <div className="text-4xl mb-3">{icon}</div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">{title}</h1>
          <p className="text-gray-500 text-lg">
            Фиксированный прайс-лист. Цена рассчитывается до заказа — изменений при выезде нет.
          </p>
        </div>

        {/* Price table */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Прайс-лист на {year} год</h2>
          <div className="border border-gray-100 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Услуга</th>
                  <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">Цена от</th>
                </tr>
              </thead>
              <tbody>
                {service.prices.map((p, i) => (
                  <tr key={i} className="border-t border-gray-100">
                    <td className="px-4 py-3.5 text-sm text-gray-900">{p.label}</td>
                    <td className="px-4 py-3.5 text-sm font-bold text-gray-900 text-right whitespace-nowrap">
                      от {p.from.toLocaleString("ru")} ₽
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 mt-2 ml-1">
            * Цены актуальны на {year} год. Окончательная стоимость фиксируется в калькуляторе до выезда мастера.
          </p>
        </section>

        {/* CTA */}
        <div className="bg-gray-950 text-white rounded-3xl p-6 mb-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <p className="font-bold text-lg mb-1">Рассчитать точную стоимость</p>
            <p className="text-gray-400 text-sm">Выберите услугу в калькуляторе — цена фиксируется сразу</p>
          </div>
          <Link
            to="/calculator"
            className="shrink-0 bg-white text-gray-900 font-bold px-6 py-3 rounded-2xl hover:bg-gray-100 transition-colors text-sm"
          >
            Рассчитать →
          </Link>
        </div>

        {/* What's included */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Что входит в услугу</h2>
          <ul className="space-y-2">
            {service.included.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-green-500 mt-0.5 shrink-0">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* FAQ */}
        {faqItems.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Вопросы об оплате</h2>
            <div className="border border-gray-100 rounded-2xl divide-y divide-gray-100">
              {faqItems.map((f, i) => (
                <div key={i} className="px-4 py-4">
                  <p className="font-semibold text-gray-900 text-sm mb-1">{f.q}</p>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.a}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Related services */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Другие услуги</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {SERVICES.filter((s) => s.slug !== service.slug).slice(0, 6).map((s) => (
              <Link
                key={s.slug}
                to={`/price/${s.slug}`}
                className="bg-gray-50 rounded-2xl p-3 hover:bg-gray-100 transition-colors"
              >
                <div className="text-xl mb-1">{SERVICE_ICONS[s.slug] ?? "🔧"}</div>
                <p className="text-sm font-semibold text-gray-900">{s.nameRu}</p>
                <p className="text-xs text-gray-400 mt-0.5">от {s.prices[0]?.from?.toLocaleString("ru")} ₽</p>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
