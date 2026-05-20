const METRIKA_ID = 109309120;

const w = window as unknown as {
  __env__?: { VITE_GA4_ID?: string };
  gtag?: (...args: unknown[]) => void;
  ym?: (id: number, action: string, ...args: unknown[]) => void;
  dataLayer?: unknown[];
};

function getGA4Id(): string {
  return w.__env__?.VITE_GA4_ID || (import.meta.env.VITE_GA4_ID as string) || "";
}

export function initAnalytics() {
  const ga4Id = getGA4Id();
  if (ga4Id && !document.getElementById("ga4-script")) {
    w.dataLayer = w.dataLayer || [];
    w.gtag = function (...args: unknown[]) { w.dataLayer!.push(args); };
    const s = document.createElement("script");
    s.id = "ga4-script";
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${ga4Id}`;
    s.onload = () => { w.gtag!("js", new Date()); w.gtag!("config", ga4Id); };
    document.head.appendChild(s);
  }
}

export function trackEvent(name: string, params?: Record<string, unknown>) {
  const ga4Id = getGA4Id();
  if (ga4Id && w.gtag) w.gtag("event", name, params ?? {});
  if (w.ym) w.ym(METRIKA_ID, "reachGoal", name, params);
}
