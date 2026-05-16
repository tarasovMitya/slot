import { useState, useRef, useEffect, useCallback } from "react";
import { MapPin, X, Loader2 } from "lucide-react";

declare global {
  interface Window {
    ymaps: any;
    _ymapsReady?: Promise<void>;
  }
}

function loadYmaps(apiKey: string): Promise<void> {
  if (window._ymapsReady) return window._ymapsReady;
  window._ymapsReady = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src*="api-maps.yandex.ru"]');
    if (existing) {
      const poll = () => (window.ymaps ? resolve() : setTimeout(poll, 100));
      poll();
      return;
    }
    const script = document.createElement("script");
    script.src = `https://api-maps.yandex.ru/2.1/?lang=ru_RU${apiKey ? `&apikey=${apiKey}` : ""}`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });
  return window._ymapsReady;
}

interface AddressSuggestProps {
  value: string;
  onChange: (value: string, validated: boolean) => void;
  placeholder?: string;
  inputClassName?: string;
  error?: boolean;
}

export function AddressSuggest({
  value,
  onChange,
  placeholder = "Улица, дом, квартира",
  inputClassName,
  error,
}: AddressSuggestProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [ymapsReady, setYmapsReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const apiKey = (import.meta as any).env?.VITE_YMAPS_KEY ?? "";

  useEffect(() => {
    loadYmaps(apiKey)
      .then(() => window.ymaps.ready(() => setYmapsReady(true)))
      .catch(() => {});
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchSuggestions = useCallback(
    (query: string) => {
      clearTimeout(debounceRef.current);
      if (!ymapsReady || query.trim().length < 3) {
        setSuggestions([]);
        setOpen(false);
        return;
      }
      setLoading(true);
      debounceRef.current = setTimeout(() => {
        window.ymaps
          .suggest(query, { results: 6, lang: "ru_RU" })
          .then((items: any[]) => {
            const names = items
              .map((i) => i.displayName ?? i.value ?? "")
              .filter(Boolean);
            setSuggestions(names);
            setOpen(names.length > 0);
          })
          .catch(() => {})
          .finally(() => setLoading(false));
      }, 320);
    },
    [ymapsReady]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    onChange(v, false);
    fetchSuggestions(v);
  };

  const handleSelect = (suggestion: string) => {
    onChange(suggestion, true);
    setSuggestions([]);
    setOpen(false);
  };

  const handleClear = () => {
    onChange("", false);
    setSuggestions([]);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          value={value}
          onChange={handleChange}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          className={
            inputClassName ??
            `w-full px-5 py-4 rounded-2xl border-2 text-lg outline-none transition-colors pr-12 ${
              error ? "border-red-400" : "border-gray-100 focus:border-black"
            }`
          }
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {loading && <Loader2 size={16} className="text-gray-300 animate-spin" />}
          {value && !loading && (
            <button type="button" onClick={handleClear} className="text-gray-300 hover:text-gray-500 transition-colors">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {open && suggestions.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden">
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              onMouseDown={() => handleSelect(s)}
              className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
            >
              <MapPin size={14} className="text-gray-400 mt-0.5 shrink-0" />
              <span className="text-sm text-gray-800 leading-snug">{s}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
