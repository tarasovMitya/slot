import { Link } from "react-router-dom";
import { CheckCircle, ChevronRight, Zap, Star, Shield, CreditCard, MessageCircle, Clock } from "lucide-react";

const STEPS = [
  {
    num: 1,
    title: "Регистрация и верификация",
    icon: Shield,
    content: [
      "Откройте slot-home.ru/performer/onboarding и заполните анкету из 8 шагов",
      "Укажите имя, телефон, специализации, опыт работы, адрес и зону выезда",
      "Настройте рабочий график: дни и часы, когда вы принимаете заказы",
      "Загрузите документы: паспорт, фото с документом, примеры работ (портфолио)",
      "После отправки анкеты команда проверит данные — обычно до 24 часов. После одобрения вы получите статус «Верифицирован» и доступ к заказам",
    ],
  },
  {
    num: 2,
    title: "Настройте профиль",
    icon: Star,
    content: [
      "Добавьте фото — мастера с фото получают на 40% больше заказов",
      "Укажите все специализации — это расширяет количество подходящих заказов",
      "Настройте рабочее расписание в разделе «График»",
      "Включите push-уведомления — чтобы не пропускать новые заказы",
      "Настройте геолокацию: вы будете видеть заказы в вашем районе первыми",
    ],
  },
  {
    num: 3,
    title: "Как принимать заказы",
    icon: Zap,
    content: [
      "Включите статус «Онлайн» в разделе «Новые заказы» — только тогда заказы видны",
      "Просмотрите детали заказа: адрес, услуга, время, сумма",
      "Нажмите «Принять заказ» — появится экран подтверждения с условиями",
      "Подтвердите согласие с условиями и ответственностью",
      "Первый принявший мастер получает заказ — будьте быстры",
    ],
  },
  {
    num: 4,
    title: "Выполнение заказа",
    icon: Clock,
    content: [
      "Свяжитесь с клиентом через чат в приложении — не запрашивайте личный номер",
      "Прибудьте точно в назначенное время. Опоздание > 15 минут — нарушение",
      "Сфотографируйте объект ДО начала работ и добавьте в раздел «Фото ДО»",
      "Выполните работу в полном объёме. Если нужны доп. работы — запросите через приложение",
      "Сфотографируйте результат и нажмите «Завершить заказ» с фото-подтверждением",
    ],
  },
  {
    num: 5,
    title: "Оплата и выплаты",
    icon: CreditCard,
    content: [
      "Деньги клиента заморожены до завершения заказа — вы защищены от неоплаты",
      "После подтверждения клиентом (или автоматически через 24 ч) деньги начисляются на баланс",
      "Комиссия платформы: 15% от суммы заказа",
      "Запрос на вывод — в разделе «Заработок». Обработка до 2 рабочих дней",
      "Никогда не принимайте наличные — это нарушение и потеря защиты платформы",
    ],
  },
  {
    num: 6,
    title: "Чат и поддержка",
    icon: MessageCircle,
    content: [
      "Все вопросы с клиентом — только через чат внутри заказа в приложении",
      "При проблемах с заказом — свяжитесь с поддержкой через раздел «Чат с поддержкой»",
      "Если клиент ведёт себя неадекватно — зафиксируйте в чате и сообщите поддержке",
      "Поддержка работает 9:00–22:00 по московскому времени",
      "Ответ на срочный вопрос — в течение 15 минут",
    ],
  },
];

const FAQ = [
  {
    q: "Когда я начну получать заказы?",
    a: "После верификации и включения статуса «Онлайн». Первые заказы обычно появляются в течение первых нескольких часов в активное время (10:00–20:00).",
  },
  {
    q: "Что делать, если я не успеваю приехать?",
    a: "Предупредите клиента через чат как можно раньше. Если опоздание более 30 минут — свяжитесь с поддержкой. Систематические опоздания ведут к снижению рейтинга.",
  },
  {
    q: "Могу ли я отменить принятый заказ?",
    a: "Да, но это влияет на рейтинг. Более 2 отмен в месяц — предупреждение. Уважительные причины (болезнь, экстренная ситуация) рассматриваются поддержкой.",
  },
  {
    q: "Как повысить рейтинг?",
    a: "Приезжайте вовремя, делайте качественную работу, общайтесь вежливо. Каждый отзыв с оценкой 5★ поднимает ваш приоритет в алгоритме подбора.",
  },
  {
    q: "Что входит в комиссию 15%?",
    a: "Привлечение клиентов, страховая защита сделки, поддержка 7 дней в неделю, обработка платежей и юридическое сопровождение.",
  },
];

export function OnboardingGuidePage() {
  return (
    <div className="max-w-2xl mx-auto px-4 pt-8 pb-16">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
          <Link to="/performer" className="hover:text-gray-700 transition-colors">Кабинет</Link>
          <ChevronRight size={14} />
          <span>Руководство для мастера</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Руководство для мастера</h1>
        <p className="text-sm text-gray-500 mt-2">
          Всё что нужно знать для успешной работы на SLOT. Прочитайте перед первым заказом.
        </p>
      </div>

      {/* Steps */}
      <div className="flex flex-col gap-6 mb-10">
        {STEPS.map((step) => {
          const Icon = step.icon;
          return (
            <div key={step.num} className="rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gray-900 flex items-center justify-center shrink-0">
                  <Icon size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Шаг {step.num}</p>
                  <h2 className="text-base font-bold text-gray-900">{step.title}</h2>
                </div>
              </div>
              <ul className="flex flex-col gap-2.5">
                {step.content.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600 leading-relaxed">
                    <CheckCircle size={15} className="text-gray-300 shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* FAQ */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Частые вопросы</h2>
        <div className="flex flex-col gap-3">
          {FAQ.map((item, i) => (
            <div key={i} className="rounded-xl border border-gray-100 p-4">
              <p className="text-sm font-semibold text-gray-900 mb-1.5">{item.q}</p>
              <p className="text-sm text-gray-500 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Support CTA */}
      <div className="rounded-2xl bg-[#003B8F] text-white p-5 flex flex-col gap-3">
        <h3 className="font-bold text-base">Остались вопросы?</h3>
        <p className="text-sm text-gray-300">Команда поддержки поможет разобраться с любым вопросом. Работаем 9:00–22:00 МСК.</p>
        <Link
          to="/performer/notifications"
          className="inline-flex items-center gap-2 bg-white text-gray-900 text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-gray-100 transition-colors w-fit"
        >
          <MessageCircle size={14} />
          Написать в поддержку
        </Link>
      </div>
    </div>
  );
}
