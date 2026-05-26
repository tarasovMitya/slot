# Handoff — slot-home.ru (calc/)

Обновляется в конце каждой сессии. Читать перед началом работы.

---

## Текущее состояние (2026-05-26)

### Что работает
- Деплой через `git push release main && git push origin main` (Railway цепляет `calc_realize.git`)
- Supabase Admin REST API для создания пользователей (Pro план активен)
- Telegram Widget auth flow: виджет → `/api/telegram-auth` → `token_hash` → `verifyOtp`
- TMA (Mini App) auto sign-in через `initData`
- Ошибки пишутся в `error_logs` в Supabase, видны в /admin/logs

### Что сломано / не проверено
- Telegram Widget auth: задеплоен фикс `email_exists` (422), но не тестировался вживую после деплоя
- Telegram Link mode (привязка tg к существующему аккаунту) — не тестировалась

---

## Файлы, изменённые в последних сессиях

### `server.js`
**Что сделали:** `createTelegramSession` переписана — убрали ручной find-then-create, используем `/auth/v1/admin/generate_link` напрямую (создаёт пользователя если нет, или генерит ссылку если есть).

**Почему:** Supabase Admin API не поддерживает `filter=email.eq.xxx` → GET всегда возвращал пустой список → CREATE падал с `422 email_exists` для уже существующих пользователей.

**Что пробовали и не сработало:**
- Прямой PostgreSQL (`pg` + `jsonwebtoken`) для обхода egress quota — откатили после оплаты Pro плана
- `filter=email.eq.xxx` в Admin API — не работает (wrong syntax)
- Отдельный GET users → CREATE → ошибка 422 при race condition / существующем юзере

### `src/performer/store/performerStore.ts`
**Что сделали:** `"cancelled"` → `"rejected"` при маппинге завершённых заказов (строка ~169).

**Почему:** `"cancelled"` — не валидный `PerformerOrderStatus`, попадал в `StatusBadge.config["cancelled"]` → `undefined` → краш деструктуризации.

### `src/performer/components/ui/StatusBadge.tsx`
**Что сделали:** Тип `config` изменён с `Record<PerformerOrderStatus, ...>` на `Record<string, ...>`.

**Почему:** Защита на случай прихода незнакомого статуса — `??` fallback теперь гарантированно срабатывает.

### `Dockerfile`
**Что сделали:** Перенесли `ARG RAILWAY_GIT_COMMIT_SHA` ПЕРЕД `COPY . .`.

**Почему:** Docker кешировал слой `COPY . .` даже после изменений кода — Railway деплоил старый образ. SHA перед COPY ломает кеш на каждый деплой.

---

## Архитектура (кратко)

```
calc/
├── server.js          # Express-подобный Node HTTP сервер (Railway)
│   ├── POST /api/telegram-auth   # Верификация Telegram + Supabase Admin API
│   └── /supabase-proxy/*         # Прокси к Supabase (обход DNS-блокировок)
├── src/
│   ├── hooks/useTelegramAuth.ts  # signInWithTelegram, linkTelegramToAccount
│   ├── components/auth/
│   │   ├── AuthModal.tsx          # Модалка входа, содержит TelegramLoginButton
│   │   └── TelegramLoginButton.tsx # Загружает telegram-widget.js
│   └── pages/tma/TMAApp.tsx       # TMA автовход через initData
├── Dockerfile         # multi-stage: builder (npm + vite) → runtime (dist + server.js)
└── HANDOFF.md         # этот файл
```

### Git remotes
- `origin` → `tarasovMitya/slot.git` (backup)
- `release` → `tarasovMitya/calc_realize.git` (Railway auto-deploy)
- **Всегда пушить в оба:** `git push release main && git push origin main`

### Env vars на Railway (service `calc_realize`)
- `VITE_SUPABASE_URL` — URL проекта Supabase
- `VITE_SUPABASE_ANON_KEY` — anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` — service_role key (секретный)
- `BOT_TOKEN` — токен Telegram бота `slot_home_bot`
- `VITE_DADATA_KEY` — DaData API key
- `PORT` — 8080 (по умолчанию)

---

## Диагностика ошибок

### Смотреть ошибки
```sql
-- В Supabase MCP:
SELECT error_message, stack_trace, component, page, created_at
FROM error_logs ORDER BY created_at DESC LIMIT 20;
```

### Проверить деплой
- Railway dashboard → project `exquisite-adaptation` → service `calc_realize`
- Новый деплой должен стартовать в течение 1-2 мин после пуша в `release`

### TypeScript
```bash
cd /Users/milty/Documents/vscode/calc && npx tsc -b --noEmit
```

---

## Следующие задачи

- [ ] Протестировать Telegram Widget auth вживую (после деплоя fix `email_exists`)
- [ ] Протестировать Link mode (привязка Telegram к email-аккаунту)
- [ ] Добавить `sourcemap: true` в `vite.config` для читаемых stack trace в `error_logs`
