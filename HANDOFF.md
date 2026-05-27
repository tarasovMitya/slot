# Handoff — slot-home.ru (calc/)

Обновляется в конце каждой сессии. Читать перед началом работы.

---

## Текущее состояние (2026-05-27)

### Что работает
- Деплой: `git push release main && git push origin main` (Railway цепляет `calc_realize.git`)
- Supabase Admin REST API для создания пользователей (Pro план активен)
- Telegram Widget auth flow: виджет → `/api/telegram-auth` → `token_hash` → `verifyOtp`
- TMA (Mini App) auto sign-in через `initData`
- Ошибки пишутся в `error_logs` в Supabase, видны в /admin/logs
- **MVP TEST MODE активен:** заказы создаются без оплаты (`ENABLE_PAYMENTS=false`), сразу уходят исполнителям

### Что не тестировалось в проде
- Telegram Widget auth: фикс `email_exists` (422) задеплоен, живого теста не было
- Telegram Link mode (привязка tg к email-аккаунту)
- MVP flow end-to-end: калькулятор → заказ → исполнитель принимает → клиент видит исполнителя

---

## Изменения этой сессии (2026-05-27)

### MVP TEST MODE — убрана обязательная оплата

**Новые файлы:**

| Файл | Что делает |
|------|-----------|
| `src/lib/featureFlags.ts` | `ENABLE_PAYMENTS = false`. Поменяй на `true` чтобы вернуть оплату. |
| `src/components/ui/TestModeBanner.tsx` | Amber баннер "Тестовый режим" |

**Изменённые файлы:**

| Файл | Что изменилось |
|------|---------------|
| `src/components/Calculator.tsx` | При `ENABLE_PAYMENTS=false` вызывает `createOrderDirectly()` вместо `setPendingOrder()`. Вставка в `orders` (audit log) стала non-blocking. |
| `src/dashboard/store/dashboardStore.ts` | Добавлен `createOrderDirectly()` — создаёт SharedOrder и Order без шага оплаты. Новый timeline: "Заказ создан" → "Поиск исполнителя" → "Исполнитель найден" → "Заказ выполнен". Все обновления timeline переведены с index-based (`i >= 2`) на label-based (не трогает "Заказ выполнен") — безопасно для старых и новых заказов. `confirmOrderCompletion` теперь помечает последний timeline-event выполненным. |
| `src/components/steps/CheckoutStep.tsx` | Добавлены: price disclaimer (синий) + TEST MODE notice (amber) перед кнопкой "Оформить заказ". |
| `src/dashboard/pages/DashboardPage.tsx` | `<PaymentModal />` рендерится только при `ENABLE_PAYMENTS=true`. Добавлен `<TestModeBanner />` вверху страницы. |
| `src/dashboard/pages/OrderDetailsPage.tsx` | Предупреждение "Оплачивайте через платформу" → TEST MODE info при `ENABLE_PAYMENTS=false`. Добавлен price disclaimer в секции стоимости. Кнопка "Оплатить заказ" скрыта при `ENABLE_PAYMENTS=false`. |

**Что НЕ трогали:** performer flow, admin panel, analytics, chats, verification, auth, onboarding, PaymentModal (код сохранён, просто не рендерится).

---

### Фикс краша на `/performer/orders/*`

**Файл:** `src/performer/store/performerStore.ts`
**Что:** `"cancelled"` → `"rejected"` при маппинге завершённых заказов (строка ~169).
**Почему:** `config["cancelled"]` в StatusBadge → `undefined` → `const { label } = undefined` → краш.

**Файл:** `src/performer/components/ui/StatusBadge.tsx`
**Что:** Тип `config` с `Record<PerformerOrderStatus, ...>` на `Record<string, ...>`.
**Почему:** Страховка — `??` fallback теперь работает для любого незнакомого статуса.

---

### Анимация TelegramLoginButton

**Файл:** `src/components/auth/TelegramLoginButton.tsx`
**Что:** Spinner (`animate-spin` border) заменён на три прыгающих точки (`animate-bounce`) — в обоих состояниях загрузки.

---

## Предыдущие изменения (2026-05-26)

### `server.js` — фикс `email_exists` (422)
`createTelegramSession` использует `/auth/v1/admin/generate_link` напрямую — создаёт пользователя если нет, или генерит ссылку если есть. Больше не нужен find-then-create.

**Что не сработало:**
- `filter=email.eq.xxx` в Admin API — не поддерживается
- `pg` + `jsonwebtoken` для обхода egress quota — откатили после оплаты Pro плана

### `Dockerfile` — фикс Docker cache
`ARG RAILWAY_GIT_COMMIT_SHA` перенесён ПЕРЕД `COPY . .` — Railway теперь ломает кеш на каждый деплой.

---

## Архитектура

```
calc/
├── server.js                        # Node HTTP сервер (Railway, port 8080)
│   ├── POST /api/telegram-auth      # Telegram HMAC verify + Supabase Admin API
│   └── /supabase-proxy/*            # Прокси к Supabase (обход DNS-блокировок)
├── src/
│   ├── lib/
│   │   ├── featureFlags.ts          # ENABLE_PAYMENTS flag
│   │   └── db.ts                    # Supabase DB helpers
│   ├── components/
│   │   ├── Calculator.tsx           # Калькулятор, главный flow клиента
│   │   ├── steps/CheckoutStep.tsx   # Последний шаг — показывает disclaimer
│   │   ├── auth/AuthModal.tsx       # Модалка входа
│   │   ├── auth/TelegramLoginButton.tsx
│   │   └── ui/TestModeBanner.tsx    # TEST MODE amber banner
│   ├── dashboard/
│   │   ├── store/dashboardStore.ts  # Стейт клиента: заказы, createOrderDirectly()
│   │   ├── pages/DashboardPage.tsx
│   │   └── pages/OrderDetailsPage.tsx
│   ├── performer/
│   │   ├── store/performerStore.ts
│   │   └── components/ui/StatusBadge.tsx
│   └── pages/tma/TMAApp.tsx        # Telegram Mini App
├── Dockerfile                       # multi-stage: builder → runtime
└── HANDOFF.md                       # этот файл
```

### Git remotes
- `origin` → `tarasovMitya/slot.git` (backup)
- `release` → `tarasovMitya/calc_realize.git` (Railway auto-deploy)
- **Всегда пушить в оба:** `git push release main && git push origin main`

### Env vars на Railway (service `calc_realize`)
| Var | Назначение |
|-----|-----------|
| `VITE_SUPABASE_URL` | URL проекта Supabase |
| `VITE_SUPABASE_ANON_KEY` | anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key (секретный) |
| `BOT_TOKEN` | Токен бота `slot_home_bot` |
| `VITE_DADATA_KEY` | DaData API |
| `PORT` | 8080 (default) |

---

## Диагностика

### Смотреть ошибки (Supabase MCP)
```sql
SELECT error_message, stack_trace, component, page, created_at
FROM error_logs ORDER BY created_at DESC LIMIT 20;
```

### TypeScript
```bash
cd /Users/milty/Documents/vscode/calc && npx tsc -b --noEmit
```

### Проверить деплой
Railway dashboard → project `exquisite-adaptation` → service `calc_realize`

---

## Следующие задачи

- [ ] Протестировать Telegram Widget auth вживую (фикс `email_exists` задеплоен)
- [ ] Протестировать MVP flow end-to-end в проде
- [ ] Протестировать Link mode (привязка Telegram к email-аккаунту)
- [ ] Добавить `sourcemap: true` в `vite.config` для читаемых stack trace
