import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import {
  Zap, Droplet, Sparkles, Hammer, Package, Wrench,
  CheckCircle, Clock, Star, Shield, ChevronDown, ChevronRight,
  Menu, X, ArrowRight, MapPin, UserCheck, Lock, TrendingUp,
} from "lucide-react";
import { Calculator } from "../components/Calculator";
import { DISTRICTS } from "./geo/districtData";
import { AuthModal } from "../components/auth/AuthModal";
import { useAuthModalStore } from "../store/authModalStore";
import { useAuthStore } from "../store/authStore";
import { usePageMeta } from "../hooks/usePageMeta";

// ─── Animation presets ───────────────────────────────────────────────────────

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09 } },
};

const vp = { once: true, margin: "-80px" } as const;

// ─── Static data ─────────────────────────────────────────────────────────────

const CATEGORIES = [
  { icon: Zap,      title: "Электрика",      price: "от 1 500 ₽", accent: "bg-amber-50 text-amber-600",  slug: "electrician" },
  { icon: Droplet,  title: "Сантехника",     price: "от 1 200 ₽", accent: "bg-blue-50 text-blue-600",    slug: "plumber" },
  { icon: Sparkles, title: "Уборка",         price: "от 2 000 ₽", accent: "bg-green-50 text-green-600",  slug: "cleaning" },
  { icon: Hammer,   title: "Муж на час",     price: "от 1 500 ₽", accent: "bg-orange-50 text-orange-600",slug: "handyman" },
  { icon: Package,  title: "Сборка мебели",  price: "от 1 500 ₽", accent: "bg-purple-50 text-purple-600",slug: "furniture-assembly" },
  { icon: Wrench,   title: "Мелкий ремонт",  price: "от 500 ₽",   accent: "bg-red-50 text-red-600",      slug: "handyman" },
];

const VALUE_PROPS = [
  { icon: TrendingUp, title: "Прозрачный расчёт",            desc: "Стоимость рассчитывается автоматически до оформления заказа. Никаких скрытых платежей." },
  { icon: Clock,      title: "Без звонков и ожидания",       desc: "Всё оформление — онлайн. Не нужно ждать на линии или договариваться по телефону." },
  { icon: UserCheck,  title: "Исполнитель принимает сам",    desc: "Свободный мастер берёт ваш заказ и приступает в указанное время." },
  { icon: Lock,       title: "Весь процесс — в кабинете",   desc: "Статус заказа, контакты исполнителя, история — всё в одном месте." },
];


const TRUST = [
  { icon: UserCheck,    title: "Проверенные исполнители", desc: "Верификация документов и рейтинговая система" },
  { icon: Star,         title: "Рейтинг и отзывы",       desc: "Оценки после каждого заказа" },
  { icon: Shield,       title: "Безопасная оплата",      desc: "Средства хранятся до подтверждения выполнения" },
  { icon: CheckCircle,  title: "Поддержка сервиса",      desc: "Решим любые вопросы по заказу" },
];

const PERFORMER_BENEFITS = [
  { title: "Свободный график",    desc: "Берите заказы когда удобно" },
  { title: "Заказы рядом",        desc: "Фильтрация по вашему местоположению" },
  { title: "Выплаты на карту",    desc: "Вывод средств без задержек" },
  { title: "Личный кабинет",      desc: "Управление заказами и заработком онлайн" },
];

const CUSTOMER_STORIES = [
  {
    name: "Анна, Бутово",
    service: "Электрика",
    accent: "bg-amber-50 border-amber-100",
    badge: "text-amber-700 bg-amber-100",
    quote: "У мастера сломалась машина по дороге. Он взял 12 кг инструментов и поехал на метро через три пересадки — потому что слово дал.",
    slug: "/blog/story-elektrik-s-instrumentami",
  },
  {
    name: "Светлана, Митино",
    service: "Сборка мебели",
    accent: "bg-blue-50 border-blue-100",
    badge: "text-blue-700 bg-blue-100",
    quote: "Кухню собрали на следующий день после доставки. У нас трое детей и квартира вся в коробках — это было настоящим спасением.",
    slug: "/blog/story-sborka-kuhni-sem-ya",
  },
  {
    name: "Дарья, Выхино",
    service: "Уборка",
    accent: "bg-green-50 border-green-100",
    badge: "text-green-700 bg-green-100",
    quote: "Позвонила в панике за 5 часов до прихода гостей. Клинер пришёл через час и убрал всё после ремонта. Гости не верили, что маляры были здесь вчера.",
    slug: "/blog/story-uborka-pered-gostami",
  },
];

const FAQ = [
  { q: "Как рассчитывается стоимость?",        a: "Стоимость рассчитывается автоматически в калькуляторе на основе выбранных услуг и параметров. Итоговая цена фиксируется до оплаты." },
  { q: "Когда списывается оплата?",            a: "Оплата списывается при оформлении заказа. Средства резервируются и поступают исполнителю только после выполнения работ." },
  { q: "Как назначается исполнитель?",         a: "Заказ публикуется в системе и доступен свободным мастерам в вашем районе. Первый откликнувшийся исполнитель берёт заказ." },
  { q: "Что если исполнитель не найден?",      a: "Если в течение 30 минут никто не принял заказ, мы уведомим вас и предложим перенести время или вернуть оплату." },
  { q: "Можно ли отменить заказ?",             a: "Да, заказ можно отменить до назначения исполнителя. После назначения отмена возможна с небольшой комиссией сервиса." },
  { q: "Кто выполняет работы?",               a: "Работы выполняют верифицированные исполнители — физические лица или самозанятые, прошедшие проверку документов." },
];

// ─── Header ──────────────────────────────────────────────────────────────────

function Header() {
  const [open, setOpen] = useState(false);
  const { open: openModal } = useAuthModalStore();
  const { isAuthenticated } = useAuthStore();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
            <span className="text-white text-[11px] font-black tracking-tight">SL</span>
          </div>
          <span className="font-black text-lg text-gray-900 tracking-tight">SLOT</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {[["#categories", "Услуги"], ["#how", "Как работает"], ["#faq", "FAQ"]].map(([href, label]) => (
            <a key={href} href={href} className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">{label}</a>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-2">
          {isAuthenticated ? (
            <button
              onClick={() => openModal("cabinet")}
              className="text-sm font-semibold bg-black text-white px-4 py-2 rounded-xl hover:bg-gray-800 transition-all active:scale-95"
            >
              Мой кабинет
            </button>
          ) : (
            <>
              <button
                onClick={() => openModal("login")}
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-4 py-2 rounded-xl border border-gray-200 hover:border-gray-400"
              >
                Войти
              </button>
              <button
                onClick={() => openModal("register")}
                className="text-sm font-semibold bg-black text-white px-4 py-2 rounded-xl hover:bg-gray-800 transition-all active:scale-95"
              >
                Зарегистрироваться
              </button>
            </>
          )}
        </div>

        {/* Mobile burger */}
        <button className="md:hidden p-2 rounded-xl hover:bg-gray-100" onClick={() => setOpen((v) => !v)}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="md:hidden border-t border-gray-100 bg-white px-4 py-4 flex flex-col gap-1"
          >
            {[["#categories", "Услуги"], ["#how", "Как работает"], ["#faq", "FAQ"]].map(([href, label]) => (
              <a key={href} href={href} onClick={() => setOpen(false)} className="text-sm font-medium text-gray-700 py-2.5 border-b border-gray-50">{label}</a>
            ))}
            <div className="pt-3 flex flex-col gap-2">
              {isAuthenticated ? (
                <button
                  onClick={() => { setOpen(false); openModal("cabinet"); }}
                  className="w-full py-3 rounded-xl bg-black text-white text-sm font-semibold"
                >
                  Мой кабинет
                </button>
              ) : (
                <>
                  <button
                    onClick={() => { setOpen(false); openModal("login"); }}
                    className="w-full py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700"
                  >
                    Войти
                  </button>
                  <button
                    onClick={() => { setOpen(false); openModal("register"); }}
                    className="w-full py-3 rounded-xl bg-black text-white text-sm font-semibold"
                  >
                    Зарегистрироваться
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

// ─── Hero ────────────────────────────────────────────────────────────────────

function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="pt-28 pb-20 px-4 sm:px-6 max-w-6xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        {/* Left: text */}
        <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col gap-6">
          <motion.div variants={fadeUp}>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 text-xs font-semibold text-gray-600 mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Москва · 150+ исполнителей онлайн
            </span>
            <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight leading-[1.1]">
              Поможем с бытовыми задачами без звонков и долгих поисков
            </h1>
          </motion.div>

          <motion.p variants={fadeUp} className="text-lg text-gray-500 leading-relaxed">
            Выберите услугу, узнайте стоимость сразу и получите проверенного исполнителя.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate("/calculator")}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-black text-white font-semibold rounded-2xl hover:bg-gray-800 transition-all active:scale-95 text-base"
            >
              Рассчитать стоимость <ArrowRight size={18} />
            </button>
            <button
              onClick={() => navigate("/performer/onboarding")}
              className="flex items-center justify-center gap-2 px-6 py-4 border-2 border-gray-200 text-gray-700 font-semibold rounded-2xl hover:border-gray-400 hover:text-gray-900 transition-all text-base"
            >
              Стать исполнителем
            </button>
          </motion.div>

          <motion.div variants={fadeUp} className="flex items-center gap-8 pt-2">
            {[["2 500+", "заказов выполнено"], ["4.8", "средний рейтинг"], ["12 мин", "среднее время поиска"]].map(([n, l]) => (
              <div key={n}>
                <p className="text-2xl font-black text-gray-900">{n}</p>
                <p className="text-xs text-gray-400 mt-0.5">{l}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Right: floating mockup */}
        <div className="relative hidden lg:flex items-center justify-center min-h-[420px]">
          {/* Main card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-5 w-[300px]"
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Электрика</span>
                <span className="text-xs text-gray-400">только что</span>
              </div>
              <p className="font-bold text-gray-900 mb-1">Установка розетки × 3</p>
              <p className="text-sm text-gray-400 flex items-center gap-1 mb-4">
                <MapPin size={12} /> ул. Тверская, 18 · 15 мая, 10:00
              </p>
              <div className="bg-gray-50 rounded-2xl px-4 py-3 flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">Стоимость</span>
                <span className="text-lg font-black text-gray-900">3 500 ₽</span>
              </div>
              <div className="h-10 bg-black rounded-xl flex items-center justify-center">
                <span className="text-white text-sm font-semibold">Оплатить</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Searching status */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="absolute -bottom-4 -right-4 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 w-52"
          >
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 rounded-full border-2 border-gray-100 border-t-black shrink-0"
              />
              <div>
                <p className="text-xs font-semibold text-gray-900">Ищем исполнителя</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Обычно 1–5 минут</p>
              </div>
            </div>
          </motion.div>

          {/* Rating badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 }}
            className="absolute -top-4 -left-4 bg-white rounded-2xl shadow-xl border border-gray-100 px-4 py-3 flex items-center gap-2"
          >
            <Star size={14} className="text-amber-400 fill-amber-400" />
            <span className="text-sm font-black text-gray-900">4.9</span>
            <span className="text-xs text-gray-400">248 заказов</span>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── Categories ──────────────────────────────────────────────────────────────

function CategoriesSection() {
  const navigate = useNavigate();

  return (
    <section id="categories" className="py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={vp}>
          <motion.div variants={fadeUp} className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">Популярные услуги</h2>
            <p className="text-gray-500 mt-3">Рассчитайте стоимость за пару кликов</p>
          </motion.div>

          <motion.div variants={stagger} className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {CATEGORIES.map((cat) => (
              <motion.div
                key={cat.title}
                variants={fadeUp}
                whileHover={{ y: -4, transition: { duration: 0.18 } }}
              >
                <Link
                  to={`/moscow/${cat.slug}`}
                  className="block bg-white rounded-2xl p-5 text-left border border-gray-100 hover:border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${cat.accent}`}>
                    <cat.icon size={20} />
                  </div>
                  <p className="font-bold text-gray-900 text-sm">{cat.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{cat.price}</p>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          <motion.div variants={fadeUp} className="text-center mt-8">
            <button
              onClick={() => navigate("/calculator")}
              className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
            >
              Все услуги в калькуляторе <ArrowRight size={16} />
            </button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Value props ──────────────────────────────────────────────────────────────

function ValueSection() {
  return (
    <section className="py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={vp}>
          <motion.div variants={fadeUp} className="mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
              Вы заранее знаете стоимость работ
            </h2>
            <p className="text-gray-500 mt-3 max-w-lg">
              Никаких согласований по телефону — цена фиксируется до оплаты.
            </p>
          </motion.div>

          <motion.div variants={stagger} className="grid sm:grid-cols-2 gap-4">
            {VALUE_PROPS.map((v) => (
              <motion.div
                key={v.title}
                variants={fadeUp}
                className="p-6 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center mb-4">
                  <v.icon size={20} className="text-gray-700" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1.5">{v.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── How it works ─────────────────────────────────────────────────────────────

const HOW_STEPS = [
  {
    title: "Рассчитайте стоимость",
    desc: "Выберите услугу и укажите параметры — стоимость видна сразу. Никаких звонков и переговоров о цене.",
    bg: "bg-rose-50",
    visual: (
      <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-col gap-2.5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Калькулятор</p>
        {[
          { label: "Тип услуги", value: "Электрик" },
          { label: "Работа", value: "Замена розетки" },
          { label: "Количество", value: "2 шт." },
        ].map((row) => (
          <div key={row.label} className="flex items-center justify-between">
            <span className="text-xs text-gray-400">{row.label}</span>
            <span className="text-xs font-medium text-gray-800 bg-gray-50 px-2.5 py-1 rounded-lg">{row.value}</span>
          </div>
        ))}
        <div className="border-t border-gray-100 pt-2 flex items-center justify-between">
          <span className="text-xs text-gray-400">Итого</span>
          <span className="text-sm font-bold text-gray-900">1 600 ₽</span>
        </div>
      </div>
    ),
  },
  {
    title: "Мы назначаем мастера",
    desc: "Исполнитель назначается автоматически — только проверенные специалисты из вашего района. Выбирать вручную не нужно.",
    bg: "bg-amber-50",
    visual: (
      <div className="flex flex-col gap-2">
        <div className="bg-white rounded-xl px-3 py-2.5 flex items-center gap-2.5 shadow-sm">
          <div className="w-8 h-8 rounded-full bg-orange-400 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-gray-900">Василий <span className="text-amber-500">☆</span> 4,8</p>
            <p className="text-xs text-gray-400">57 выполненных заказов</p>
          </div>
          <div className="shrink-0">
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Назначен</span>
          </div>
        </div>
        <div className="bg-white rounded-xl px-3 py-2.5 shadow-sm flex items-center gap-2">
          <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <p className="text-xs text-gray-600">Документы и опыт проверены</p>
        </div>
        <div className="bg-white rounded-xl px-3 py-2.5 shadow-sm flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          <p className="text-xs text-gray-600">Работает в вашем районе</p>
        </div>
      </div>
    ),
  },
  {
    title: "Мастер приедет к вам",
    desc: "Специалист приезжает домой в удобное время. В приложении есть чат для уточнения деталей. Стоимость фиксирована — изменить можно только через поддержку.",
    bg: "bg-violet-50",
    visual: (
      <div className="flex flex-col gap-2.5">
        <div className="bg-white rounded-xl px-4 py-2.5 shadow-sm flex items-center gap-2.5">
          <svg className="w-4 h-4 text-violet-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
          <p className="text-sm font-medium text-gray-800">Выезд на дом к клиенту</p>
        </div>
        <div className="bg-white rounded-xl px-4 py-2.5 shadow-sm flex items-center gap-2.5">
          <svg className="w-4 h-4 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
          <p className="text-sm font-medium text-gray-800">Чат для уточнения деталей</p>
        </div>
        <div className="bg-white rounded-xl px-4 py-2.5 shadow-sm flex items-center gap-2.5">
          <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <p className="text-sm font-medium text-gray-800">Оплата после выполнения</p>
        </div>
      </div>
    ),
  },
];

function HowItWorksSection() {
  return (
    <section id="how" className="py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={vp}>
          <motion.div variants={fadeUp} className="mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">Как это работает</h2>
          </motion.div>

          <motion.div variants={stagger} className="grid sm:grid-cols-3 gap-6">
            {HOW_STEPS.map((step) => (
              <motion.div key={step.title} variants={fadeUp} className="flex flex-col gap-5">
                <div className={`${step.bg} rounded-3xl p-5 flex flex-col justify-center min-h-[220px]`}>
                  {step.visual}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">{step.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Calculator launcher ──────────────────────────────────────────────────────

function CalculatorSection() {
  return (
    <section className="py-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={vp}>
          <motion.div variants={fadeUp} className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">Рассчитайте стоимость</h2>
            <p className="text-gray-500 mt-3">Выберите услугу и оформите заказ прямо здесь</p>
          </motion.div>
          <motion.div variants={fadeUp}>
            <Calculator embedded />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Trust ────────────────────────────────────────────────────────────────────

function TrustSection() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={vp}>
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
            <div>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">Нам доверяют</h2>
              <p className="text-gray-500 mt-2">Сервис с реальными гарантиями</p>
            </div>
            <div className="flex gap-8 shrink-0">
              {[["2 500+", "заказов"], ["150+", "исполнителей"], ["4.8 ★", "рейтинг"]].map(([n, l]) => (
                <div key={n} className="text-right">
                  <p className="text-2xl font-black text-gray-900">{n}</p>
                  <p className="text-xs text-gray-400">{l}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={stagger} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TRUST.map((f) => (
              <motion.div key={f.title} variants={fadeUp} className="bg-white rounded-2xl p-5 border border-gray-100">
                <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
                  <f.icon size={18} className="text-gray-700" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">{f.title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Customer Stories ─────────────────────────────────────────────────────────

function CustomerStoriesSection() {
  return (
    <section className="py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={vp}>
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">Истории клиентов</h2>
              <p className="text-gray-500 mt-2">Реальные ситуации — реальные люди</p>
            </div>
            <Link to="/blog?category=Истории клиентов" className="text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors shrink-0 flex items-center gap-1">
              Все истории <ChevronRight size={16} />
            </Link>
          </motion.div>

          <motion.div variants={stagger} className="grid sm:grid-cols-3 gap-5">
            {CUSTOMER_STORIES.map((s) => (
              <motion.div key={s.slug} variants={fadeUp}>
                <Link
                  to={s.slug}
                  className={`block rounded-2xl border p-6 h-full hover:shadow-md transition-shadow ${s.accent}`}
                >
                  <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-4 ${s.badge}`}>
                    {s.service}
                  </span>
                  <p className="text-gray-800 text-sm leading-relaxed mb-5">«{s.quote}»</p>
                  <p className="text-xs text-gray-400 font-medium">{s.name}</p>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Performer ────────────────────────────────────────────────────────────────

function PerformerSection() {
  const navigate = useNavigate();

  return (
    <section className="py-20 bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={vp} className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div variants={fadeUp}>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Для исполнителей</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight mt-3 mb-4">
              Выполняйте заказы рядом с вами
            </h2>
            <p className="text-gray-400 leading-relaxed mb-8">
              Свободные заказы в вашем районе. Берёте когда удобно — получаете оплату сразу после выполнения.
            </p>
            <button
              onClick={() => navigate("/performer/onboarding")}
              className="flex items-center gap-2 px-6 py-4 bg-white text-gray-900 font-semibold rounded-2xl hover:bg-gray-100 transition-all active:scale-95"
            >
              Стать исполнителем <ArrowRight size={18} />
            </button>
          </motion.div>

          <motion.div variants={stagger} className="grid grid-cols-2 gap-4">
            {PERFORMER_BENEFITS.map((b) => (
              <motion.div key={b.title} variants={fadeUp} className="bg-gray-800 rounded-2xl p-5">
                <h3 className="font-bold text-white text-sm mb-1">{b.title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{b.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="py-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={vp}>
          <motion.div variants={fadeUp} className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">Частые вопросы</h2>
          </motion.div>

          <motion.div variants={stagger} className="flex flex-col gap-2">
            {FAQ.map((item, i) => (
              <motion.div key={i} variants={fadeUp} className="border border-gray-100 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-gray-900 text-sm pr-4">{item.q}</span>
                  <motion.div animate={{ rotate: open === i ? 180 : 0 }} transition={{ duration: 0.2 }} className="shrink-0">
                    <ChevronDown size={18} className="text-gray-400" />
                  </motion.div>
                </button>
                <AnimatePresence initial={false}>
                  {open === i && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      transition={{ duration: 0.22, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-4 pt-3 text-sm text-gray-500 leading-relaxed border-t border-gray-50">{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Final CTA ────────────────────────────────────────────────────────────────

function FinalCTASection() {
  const navigate = useNavigate();

  return (
    <section className="py-24 bg-black">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={vp}>
          <motion.h2 variants={fadeUp} className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-4">
            Рассчитайте стоимость за пару минут
          </motion.h2>
          <motion.p variants={fadeUp} className="text-gray-400 text-lg mb-10">
            Выберите услугу и узнайте цену — без звонков и ожидания
          </motion.p>
          <motion.div variants={fadeUp}>
            <button
              onClick={() => navigate("/calculator")}
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-900 font-bold text-lg rounded-2xl hover:bg-gray-100 transition-all active:scale-95"
            >
              Создать заказ <ArrowRight size={20} />
            </button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Districts Section ────────────────────────────────────────────────────────

function DistrictsSection() {
  return (
    <section className="py-14 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-gray-900">Мастера по районам Москвы</h2>
            <p className="text-gray-500 text-sm mt-1">Выезд в день заказа в любой район</p>
          </div>
          <Link to="/moscow" className="hidden sm:flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors">
            Все районы <ChevronRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
          {DISTRICTS.map((d) => (
            <Link
              key={d.slug}
              to={`/moscow/${d.slug}`}
              className="flex items-center gap-2 px-4 py-3 bg-white rounded-2xl border border-gray-100 hover:border-gray-300 hover:shadow-sm transition-all group text-sm"
            >
              <MapPin size={13} className="text-gray-300 group-hover:text-gray-500 shrink-0 transition-colors" />
              <span className="font-medium text-gray-700 group-hover:text-gray-900 truncate">{d.name}</span>
            </Link>
          ))}
        </div>
        <div className="mt-4 sm:hidden text-center">
          <Link to="/moscow" className="text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors">
            Все районы →
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  const { open: openModal } = useAuthModalStore();

  return (
    <footer className="py-12 border-t border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
          <div className="col-span-2 sm:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white text-[10px] font-black">SL</span>
              </div>
              <span className="font-black text-gray-900">SLOT</span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed">
              Сервис бытовых услуг с прозрачными ценами и проверенными исполнителями.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Услуги в Москве</p>
            <div className="flex flex-col gap-2.5">
              <Link to="/moscow/electrician" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Электрик</Link>
              <Link to="/moscow/plumber" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Сантехник</Link>
              <Link to="/moscow/cleaning" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Уборка</Link>
              <Link to="/moscow/handyman" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Муж на час</Link>
              <Link to="/moscow/furniture-assembly" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Сборка мебели</Link>
              <Link to="/blog" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Блог</Link>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Районы Москвы</p>
            <div className="flex flex-col gap-2.5">
              {DISTRICTS.slice(0, 6).map((d) => (
                <Link key={d.slug} to={`/moscow/${d.slug}`} className="text-sm text-gray-600 hover:text-gray-900 transition-colors">{d.name}</Link>
              ))}
              <Link to="/moscow" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">Все районы →</Link>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Для мастеров</p>
            <div className="flex flex-col gap-2.5">
              <Link to="/masters" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Работа мастером</Link>
              <Link to="/masters/electrician" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Работа электриком</Link>
              <Link to="/masters/plumber" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Работа сантехником</Link>
              <Link to="/masters/handyman" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Работа мастером на час</Link>
              <Link to="/masters/cleaning" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Работа клинером</Link>
              <button onClick={() => openModal("login")} className="text-sm text-gray-600 hover:text-gray-900 transition-colors text-left">Вход в кабинет</button>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Компания</p>
            <div className="flex flex-col gap-2.5">
              <Link to="/terms" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Соглашение</Link>
              <Link to="/privacy" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Конфиденциальность</Link>
              <Link to="/contacts" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Контакты</Link>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-gray-400">© 2025 SLOT. Все права защищены.</p>
          <p className="text-xs text-gray-400">Москва, Россия</p>
        </div>
      </div>
    </footer>
  );
}

// ─── Mobile bottom CTA ────────────────────────────────────────────────────────

function MobileBottomCTA() {
  const navigate = useNavigate();
  const { open: openModal } = useAuthModalStore();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 backdrop-blur border-t border-gray-100 px-4 py-3 flex gap-2">
      <button onClick={() => openModal("login")} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 active:scale-95 transition-all">
        Войти
      </button>
      <button onClick={() => navigate("/calculator")} className="flex-1 py-3 rounded-xl bg-black text-white text-sm font-semibold active:scale-95 transition-all">
        Создать заказ
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function LandingPage() {
  usePageMeta({
    title: "Мастера на дом в Москве — уборка, сантехника, электрика",
    description: "Закажите мастера на дом в Москве за 3 минуты. Верифицированные исполнители, фиксированные цены, оплата онлайн. Уборка от 2 000 ₽, сантехник от 1 200 ₽.",
    canonical: "https://slot-home.ru/",
  });

  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";
    document.documentElement.style.scrollPaddingTop = "64px";
    return () => {
      document.documentElement.style.scrollBehavior = "";
      document.documentElement.style.scrollPaddingTop = "";
    };
  }, []);

  useEffect(() => {
    const id = "landing-ld-json";
    document.getElementById(id)?.remove();
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = id;
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "LocalBusiness",
          name: "SLOT",
          description: "Платформа мастеров на дом в Москве. Уборка, сантехника, электрика, сборка мебели.",
          url: "https://slot-home.ru",
          telephone: "",
          areaServed: { "@type": "City", name: "Москва" },
          priceRange: "₽₽",
          aggregateRating: { "@type": "AggregateRating", ratingValue: "4.8", reviewCount: "2500", bestRating: "5" },
          openingHoursSpecification: { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"], opens: "08:00", closes: "22:00" },
        },
        {
          "@type": "FAQPage",
          mainEntity: FAQ.map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: { "@type": "Answer", text: item.a },
          })),
        },
      ],
    });
    document.head.appendChild(script);
    return () => { document.getElementById(id)?.remove(); };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="pb-16 md:pb-0">
        <HeroSection />
        <CategoriesSection />
        <ValueSection />
        <HowItWorksSection />
        <CalculatorSection />
        <TrustSection />
        <CustomerStoriesSection />
        <PerformerSection />
        <FAQSection />
        <FinalCTASection />
        <DistrictsSection />
      </main>
      <AuthModal />
      <Footer />
      <MobileBottomCTA />
    </div>
  );
}
