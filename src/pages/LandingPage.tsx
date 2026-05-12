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
  { icon: Zap,      title: "Электрика",      price: "от 1 500 ₽", accent: "bg-amber-50 text-amber-600" },
  { icon: Droplet,  title: "Сантехника",     price: "от 1 200 ₽", accent: "bg-blue-50 text-blue-600" },
  { icon: Sparkles, title: "Уборка",         price: "от 2 000 ₽", accent: "bg-green-50 text-green-600" },
  { icon: Hammer,   title: "Муж на час",     price: "от 1 500 ₽", accent: "bg-orange-50 text-orange-600" },
  { icon: Package,  title: "Сборка мебели",  price: "от 1 500 ₽", accent: "bg-purple-50 text-purple-600" },
  { icon: Wrench,   title: "Мелкий ремонт",  price: "от 500 ₽",   accent: "bg-red-50 text-red-600" },
];

const VALUE_PROPS = [
  { icon: TrendingUp, title: "Прозрачный расчёт",            desc: "Стоимость рассчитывается автоматически до оформления заказа. Никаких скрытых платежей." },
  { icon: Clock,      title: "Без звонков и ожидания",       desc: "Всё оформление — онлайн. Не нужно ждать на линии или договариваться по телефону." },
  { icon: UserCheck,  title: "Исполнитель принимает сам",    desc: "Свободный мастер берёт ваш заказ и приступает в указанное время." },
  { icon: Lock,       title: "Весь процесс — в кабинете",   desc: "Статус заказа, контакты исполнителя, история — всё в одном месте." },
];

const STEPS = [
  { n: "01", title: "Выберите услугу",        desc: "Электрика, сантехника, уборка и другие категории" },
  { n: "02", title: "Укажите параметры",      desc: "Тип работ, объём, условия — калькулятор учтёт всё" },
  { n: "03", title: "Получите стоимость",     desc: "Точная сумма до оплаты, без сюрпризов" },
  { n: "04", title: "Войдите по email",       desc: "Одноразовый код — без паролей и регистрации" },
  { n: "05", title: "Оплатите заказ",         desc: "Безопасная оплата картой онлайн" },
  { n: "06", title: "Исполнитель примет",     desc: "Свободный мастер возьмёт заказ" },
  { n: "07", title: "Следите за статусом",    desc: "Уведомления и контакты мастера в кабинете" },
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
  const navigate = useNavigate();

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
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={() => navigate("/performer/auth")}
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-4 py-2 rounded-xl border border-gray-200 hover:border-gray-400"
          >
            Стать исполнителем
          </button>
          <button
            onClick={() => navigate("/calculator")}
            className="text-sm font-semibold bg-black text-white px-4 py-2 rounded-xl hover:bg-gray-800 transition-all active:scale-95"
          >
            Создать заказ
          </button>
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
              <button onClick={() => { setOpen(false); navigate("/performer/auth"); }} className="w-full py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700">Стать исполнителем</button>
              <button onClick={() => { setOpen(false); navigate("/calculator"); }} className="w-full py-3 rounded-xl bg-black text-white text-sm font-semibold">Создать заказ</button>
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
              onClick={() => navigate("/performer/auth")}
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
              <motion.button
                key={cat.title}
                variants={fadeUp}
                whileHover={{ y: -4, transition: { duration: 0.18 } }}
                onClick={() => navigate("/calculator")}
                className="bg-white rounded-2xl p-5 text-left border border-gray-100 hover:border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${cat.accent}`}>
                  <cat.icon size={20} />
                </div>
                <p className="font-bold text-gray-900 text-sm">{cat.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{cat.price}</p>
              </motion.button>
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

function HowItWorksSection() {
  return (
    <section id="how" className="py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={vp}>
          <motion.div variants={fadeUp} className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">Как это работает</h2>
            <p className="text-gray-500 mt-3">От выбора услуги до назначения мастера</p>
          </motion.div>

          {/* Desktop grid */}
          <div className="hidden sm:block space-y-4">
            <motion.div variants={stagger} className="grid grid-cols-4 gap-4">
              {STEPS.slice(0, 4).map((s, i) => (
                <motion.div key={i} variants={fadeUp} className="bg-white rounded-2xl p-5 border border-gray-100 relative">
                  {i < 3 && <ChevronRight size={14} className="text-gray-200 absolute -right-3 top-7 z-10" />}
                  <span className="text-4xl font-black text-gray-100 leading-none">{s.n}</span>
                  <h3 className="font-bold text-gray-900 text-sm mt-2 mb-1">{s.title}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">{s.desc}</p>
                </motion.div>
              ))}
            </motion.div>
            <motion.div variants={stagger} className="grid grid-cols-3 gap-4 ml-[25%]">
              {STEPS.slice(4).map((s, i) => (
                <motion.div key={i} variants={fadeUp} className="bg-white rounded-2xl p-5 border border-gray-100 relative">
                  {i < 2 && <ChevronRight size={14} className="text-gray-200 absolute -right-3 top-7 z-10" />}
                  <span className="text-4xl font-black text-gray-100 leading-none">{s.n}</span>
                  <h3 className="font-bold text-gray-900 text-sm mt-2 mb-1">{s.title}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">{s.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Mobile vertical */}
          <div className="sm:hidden flex flex-col">
            {STEPS.map((s, i) => (
              <motion.div key={i} variants={fadeUp} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center shrink-0 text-white text-xs font-bold">
                    {i + 1}
                  </div>
                  {i < STEPS.length - 1 && <div className="w-px flex-1 bg-gray-200 my-1 min-h-[24px]" />}
                </div>
                <div className="pb-6 pt-0.5">
                  <h3 className="font-bold text-gray-900 text-sm mb-0.5">{s.title}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
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
              onClick={() => navigate("/performer/auth")}
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

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  const navigate = useNavigate();

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
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Сервис</p>
            <div className="flex flex-col gap-2.5">
              <a href="#categories" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Услуги</a>
              <a href="#how" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Как работает</a>
              <a href="#faq" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">FAQ</a>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Исполнителям</p>
            <div className="flex flex-col gap-2.5">
              <button onClick={() => navigate("/performer/auth")} className="text-sm text-gray-600 hover:text-gray-900 transition-colors text-left">Стать исполнителем</button>
              <button onClick={() => navigate("/performer/auth")} className="text-sm text-gray-600 hover:text-gray-900 transition-colors text-left">Вход в кабинет</button>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Компания</p>
            <div className="flex flex-col gap-2.5">
              <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Соглашение</a>
              <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Конфиденциальность</a>
              <a href="mailto:support@slot.ru" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Контакты</a>
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

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 backdrop-blur border-t border-gray-100 px-4 py-3 flex gap-2">
      <button onClick={() => navigate("/performer/auth")} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 active:scale-95 transition-all">
        Исполнитель
      </button>
      <button onClick={() => navigate("/calculator")} className="flex-1 py-3 rounded-xl bg-black text-white text-sm font-semibold active:scale-95 transition-all">
        Создать заказ
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function LandingPage() {
  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";
    document.documentElement.style.scrollPaddingTop = "64px";
    return () => {
      document.documentElement.style.scrollBehavior = "";
      document.documentElement.style.scrollPaddingTop = "";
    };
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
        <PerformerSection />
        <FAQSection />
        <FinalCTASection />
      </main>
      <Footer />
      <MobileBottomCTA />
    </div>
  );
}
