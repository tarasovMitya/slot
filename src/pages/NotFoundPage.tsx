import { Link } from "react-router-dom";
import { usePageMeta } from "../hooks/usePageMeta";

export function NotFoundPage() {
  usePageMeta({ title: "Страница не найдена", robots: "noindex, nofollow" });

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <p className="text-8xl font-black text-gray-100 select-none">404</p>
      <h1 className="text-2xl font-bold text-gray-900 mt-4">Страница не найдена</h1>
      <p className="text-gray-500 mt-2 max-w-sm">
        Возможно, ссылка устарела или страница была удалена.
      </p>
      <Link
        to="/"
        className="mt-8 inline-flex items-center gap-2 px-6 py-3 bg-[#006AFF] text-white font-semibold rounded-2xl hover:bg-[#004CB8] transition-all"
      >
        На главную
      </Link>
    </main>
  );
}
