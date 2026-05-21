import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { trackEvent } from "../../hooks/useAnalytics";
import { Clock, ChevronRight, ArrowRight, MapPin } from "lucide-react";
import { usePageMeta } from "../../hooks/usePageMeta";
import { PublicHeader } from "../../components/PublicHeader";
import type { SectionBlock } from "./blogData";
import { getArticle, ARTICLES } from "./blogData";
import { NotFoundPage } from "../NotFoundPage";
import { DISTRICTS } from "../geo/districtData";

function renderBlock(block: SectionBlock, i: number) {
  switch (block.type) {
    case "h2":
      return <h2 key={i} className="text-xl font-black text-gray-900 mt-8 mb-3">{block.text}</h2>;
    case "h3":
      return <h3 key={i} className="text-base font-bold text-gray-900 mt-5 mb-2">{block.text}</h3>;
    case "p":
      return <p key={i} className="text-sm text-gray-700 leading-relaxed">{block.text}</p>;
    case "ul":
      return (
        <ul key={i} className="list-none flex flex-col gap-2">
          {block.items.map((item, j) => (
            <li key={j} className="flex items-start gap-2 text-sm text-gray-700">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol key={i} className="flex flex-col gap-2">
          {block.items.map((item, j) => (
            <li key={j} className="flex items-start gap-3 text-sm text-gray-700">
              <span className="shrink-0 w-5 h-5 rounded-full bg-gray-900 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">
                {j + 1}
              </span>
              {item}
            </li>
          ))}
        </ol>
      );
    case "tip":
      return (
        <div key={i} className="rounded-2xl bg-amber-50 border border-amber-100 p-4">
          <p className="text-sm text-amber-900 leading-relaxed">{block.text}</p>
        </div>
      );
    case "table":
      return (
        <div key={i} className="rounded-2xl border border-gray-100 overflow-hidden">
          {block.rows.map((row, j) => (
            <div key={j} className={`flex items-center justify-between px-5 py-3 ${j % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
              <span className="text-sm text-gray-700">{row.label}</span>
              <span className="text-sm font-semibold text-gray-900 shrink-0 ml-4">{row.value}</span>
            </div>
          ))}
        </div>
      );
  }
}

function injectArticleSchema(article: ReturnType<typeof getArticle>) {
  if (!article) return;
  const existing = document.getElementById("article-ld-json");
  if (existing) existing.remove();
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.id = "article-ld-json";

  const faqBlocks = article.sections.filter((s) => s.type === "h2" && (s as { type: string; text: string }).text.toLowerCase().includes("вопрос"));
  const hasFaq = faqBlocks.length > 0;

  const graph: object[] = [
    {
      "@type": "Article",
      headline: article.title,
      description: article.metaDescription,
      datePublished: article.publishedAt,
      dateModified: article.publishedAt,
      author: { "@type": "Organization", name: "SLOT", url: "https://slot-home.ru" },
      publisher: { "@type": "Organization", name: "SLOT", url: "https://slot-home.ru" },
      mainEntityOfPage: { "@type": "WebPage", "@id": `https://slot-home.ru/blog/${article.slug}` },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Главная", item: "https://slot-home.ru" },
        { "@type": "ListItem", position: 2, name: "Блог", item: "https://slot-home.ru/blog" },
        { "@type": "ListItem", position: 3, name: article.title, item: `https://slot-home.ru/blog/${article.slug}` },
      ],
    },
  ];

  if (hasFaq) {
    const qaPairs: { q: string; a: string }[] = [];
    let currentQ = "";
    for (const block of article.sections) {
      if (block.type === "h3") {
        currentQ = (block as { type: string; text: string }).text;
      } else if (block.type === "p" && currentQ) {
        qaPairs.push({ q: currentQ, a: (block as { type: string; text: string }).text });
        currentQ = "";
      }
    }
    if (qaPairs.length > 0) {
      graph.push({
        "@type": "FAQPage",
        mainEntity: qaPairs.map(({ q, a }) => ({
          "@type": "Question",
          name: q,
          acceptedAnswer: { "@type": "Answer", text: a },
        })),
      });
    }
  }

  script.textContent = JSON.stringify({ "@context": "https://schema.org", "@graph": graph });
  document.head.appendChild(script);
  return () => document.getElementById("article-ld-json")?.remove();
}

export function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const article = getArticle(slug ?? "");

  usePageMeta(
    article
      ? { title: article.metaTitle, description: article.metaDescription, canonical: `https://slot-home.ru/blog/${article.slug}` }
      : { title: "Статья не найдена", robots: "noindex" }
  );

  useEffect(() => {
    return injectArticleSchema(article);
  }, [article?.slug]);

  if (!article) return <NotFoundPage />;

  const related = ARTICLES.filter((a) => a.categorySlug === article.categorySlug && a.slug !== article.slug).slice(0, 2);

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />
      <article className="max-w-2xl mx-auto px-4 pt-24 pb-14">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-gray-400 mb-8 flex-wrap">
          <Link to="/" className="hover:text-gray-700 transition-colors">Главная</Link>
          <ChevronRight size={12} />
          <Link to="/blog" className="hover:text-gray-700 transition-colors">Блог</Link>
          <ChevronRight size={12} />
          <span className="text-gray-500">{article.category}</span>
        </nav>

        {/* Meta */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <Link
            to={`/moscow/${article.relatedServiceSlug}`}
            className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
          >
            {article.category}
          </Link>
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <Clock size={11} />
            {article.readTime} мин чтения
          </span>
          <span className="text-xs text-gray-400">
            {new Date(article.publishedAt).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-4 leading-tight">{article.title}</h1>
        <p className="text-base text-gray-500 mb-8 leading-relaxed border-b border-gray-100 pb-8">{article.excerpt}</p>

        {/* Content */}
        <div className="flex flex-col gap-4">
          {article.sections.map((block, i) => renderBlock(block, i))}
        </div>

        {/* CTA */}
        <div className="mt-10 rounded-3xl bg-gray-950 text-white p-7 text-center">
          <p className="font-black text-lg mb-1">Нужен {article.category.toLowerCase()}?</p>
          <p className="text-gray-300 text-sm mb-5">Рассчитайте стоимость и выберите удобное время</p>
          <Link
            to="/calculator"
            onClick={() => trackEvent("cta_clicked", { source: "blog_article" })}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-900 font-bold rounded-2xl hover:bg-gray-100 transition-all text-sm"
          >
            Рассчитать стоимость
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* Districts */}
        <div className="mt-8">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <MapPin size={11} />
            Вызвать мастера в вашем районе
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {DISTRICTS.slice(0, 12).map((d) => (
              <Link
                key={d.slug}
                to={`/moscow/${d.slug}/${article.relatedServiceSlug}`}
                className="text-xs text-gray-600 hover:text-gray-900 px-3 py-2 rounded-xl border border-gray-100 hover:border-gray-300 transition-colors truncate"
              >
                {article.category} {d.nameIn}
              </Link>
            ))}
          </div>
          <Link to={`/moscow/${article.relatedServiceSlug}`} className="mt-2 inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors">
            Все районы Москвы <ChevronRight size={11} />
          </Link>
        </div>

        {/* Related articles */}
        {related.length > 0 && (
          <div className="mt-10">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Похожие статьи</p>
            <div className="flex flex-col gap-3">
              {related.map((a) => (
                <Link
                  key={a.slug}
                  to={`/blog/${a.slug}`}
                  className="group flex items-start justify-between gap-3 p-4 rounded-2xl border border-gray-100 hover:border-gray-300 transition-colors"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900 group-hover:text-gray-700">{a.title}</p>
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1"><Clock size={10} /> {a.readTime} мин</p>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 shrink-0 mt-0.5 transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Link to service page */}
        <div className="mt-6">
          <Link
            to={`/moscow/${article.relatedServiceSlug}`}
            className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ChevronRight size={14} />
            {article.category} в Москве — страница услуги
          </Link>
        </div>
      </article>
    </div>
  );
}
