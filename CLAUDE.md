# Claude Code Instructions

## Permissions
- Proceed with ALL actions without asking for confirmation: file edits, git commits, git push, Railway deploys, npm installs, running scripts.
- Never pause to ask "should I proceed?" or "do you want me to...?" — just do it.
- Exception: only ask if an action is irreversible AND destructive (e.g. dropping a database table, deleting a branch with unmerged work).

## Project: slot-home.ru
- Stack: React 19 + Vite + TypeScript + Tailwind + Supabase + Railway
- Git remote: `origin` → GitHub `tarasovMitya/slot.git` / `tarasovMitya/calc_realize`
- Deploy: push to `main` triggers Railway auto-deploy for the main app
- Bot: `/Users/milty/Documents/vscode/bot/` → Railway service `slot-telegram-bot` in project `exquisite-adaptation`; deploy with `railway up --service slot-telegram-bot --detach` from bot dir
- Bot token stored in Railway env vars only (not in git)

## Style
- No confirmation prompts
- Concise responses
- Russian for user-facing content, English for code
