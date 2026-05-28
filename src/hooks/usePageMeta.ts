import { useEffect } from "react";

interface PageMeta {
  title?: string;
  description?: string;
  robots?: string;
  canonical?: string;
  image?: string;
}

const DEFAULT_TITLE = "SLOT — сервис бытовых услуг с проверенными исполнителями";
const DEFAULT_DESCRIPTION =
  "Закажите электрика, сантехника, уборку и другие бытовые услуги онлайн. Проверенные мастера, фиксированные цены, удобный калькулятор стоимости.";

function setMeta(name: string, content: string, attr: "name" | "property" = "name") {
  let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.content = content;
}

function setCanonical(href: string) {
  let el = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.rel = "canonical";
    document.head.appendChild(el);
  }
  el.href = href;
}

export function usePageMeta({ title, description, robots, canonical, image }: PageMeta = {}) {
  useEffect(() => {
    const resolvedTitle = title ? `${title} — SLOT` : DEFAULT_TITLE;
    const resolvedImage = image
      ? (image.startsWith("http") ? image : `https://slot-home.ru${image}`)
      : "https://slot-home.ru/favicon.svg";
    document.title = resolvedTitle;
    setMeta("description", description ?? DEFAULT_DESCRIPTION);
    setMeta("robots", robots ?? "index, follow");
    setMeta("og:title", resolvedTitle, "property");
    setMeta("og:description", description ?? DEFAULT_DESCRIPTION, "property");
    setMeta("og:image", resolvedImage, "property");
    setMeta("og:image:width", "1792", "property");
    setMeta("og:image:height", "1008", "property");
    setMeta("og:type", "article", "property");
    setMeta("twitter:card", image ? "summary_large_image" : "summary");
    setMeta("twitter:title", resolvedTitle);
    setMeta("twitter:description", description ?? DEFAULT_DESCRIPTION);
    setMeta("twitter:image", resolvedImage);
    if (canonical) setCanonical(canonical);

    return () => {
      document.title = DEFAULT_TITLE;
      setMeta("robots", "index, follow");
    };
  }, [title, description, robots, canonical]);
}
