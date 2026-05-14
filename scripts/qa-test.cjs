const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const BASE_URL = "https://slot-home.ru";
const SCREENSHOTS_DIR = path.join(__dirname, "qa-screenshots");

if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

let stepNum = 0;
async function shot(page, name) {
  stepNum++;
  const file = path.join(SCREENSHOTS_DIR, `${String(stepNum).padStart(2, "0")}-${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`📸 ${file}`);
  return file;
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } }); // iPhone size
  const page = await context.newPage();

  const bugs = [];
  const log = (msg) => console.log(`  → ${msg}`);
  const bug = (msg) => { bugs.push(msg); console.log(`  🐛 БАГ: ${msg}`); };

  // ── 1. Главная страница ─────────────────────────────────────────────────────
  console.log("\n=== 1. Главная страница ===");
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await shot(page, "homepage");
  log(`Заголовок: ${await page.title()}`);

  const h1 = await page.locator("h1").first().textContent().catch(() => null);
  log(`H1: ${h1}`);

  // ── 2. Переход к регистрации клиента ───────────────────────────────────────
  console.log("\n=== 2. Регистрация клиента ===");

  // Ищем кнопку регистрации / входа
  const authBtn = page.locator("a[href*='register'], a[href*='signup'], button").filter({ hasText: /регистр|войти|sign/i }).first();
  const authBtnExists = await authBtn.count() > 0;

  if (!authBtnExists) {
    bug("Не найдена кнопка регистрации/входа на главной странице");
  } else {
    await authBtn.click();
    await page.waitForLoadState("networkidle");
    await shot(page, "auth-page");
    log(`URL: ${page.url()}`);
  }

  // Пробуем напрямую
  await page.goto(`${BASE_URL}/register`, { waitUntil: "networkidle" }).catch(() => {});
  await page.goto(`${BASE_URL}/auth`, { waitUntil: "networkidle" }).catch(() => {});
  await shot(page, "auth-direct");
  log(`URL после перехода: ${page.url()}`);

  // Ищем поля формы
  const emailInput = page.locator("input[type='email'], input[name*='email'], input[placeholder*='email' i]").first();
  const passwordInput = page.locator("input[type='password']").first();
  const emailExists = await emailInput.count() > 0;
  const passExists = await passwordInput.count() > 0;

  if (!emailExists) bug("Поле email не найдено на странице авторизации");
  if (!passExists) bug("Поле пароля не найдено на странице авторизации");

  if (emailExists && passExists) {
    // Тест: пустая отправка
    const submitBtn = page.locator("button[type='submit'], button").filter({ hasText: /войти|вход|зарег|sign|log/i }).first();
    if (await submitBtn.count() > 0) {
      await submitBtn.click();
      await page.waitForTimeout(500);
      await shot(page, "empty-submit");
      const errors = await page.locator("[class*='error'], [class*='invalid'], [role='alert']").count();
      if (errors === 0) bug("Пустая форма отправляется без ошибок валидации");
      else log(`Валидация работает: ${errors} ошибок показано`);
    }

    // Тест: невалидный email
    await emailInput.fill("notanemail");
    await passwordInput.fill("123");
    const submitBtn2 = page.locator("button[type='submit'], button").filter({ hasText: /войти|вход|зарег|sign|log/i }).first();
    if (await submitBtn2.count() > 0) {
      await submitBtn2.click();
      await page.waitForTimeout(500);
      await shot(page, "invalid-email");
    }
  }

  // ── 3. Регистрация/вход с тестовыми данными ─────────────────────────────────
  console.log("\n=== 3. Вход с тестовыми данными ===");
  const testEmail = `test+qa${Date.now()}@example.com`;
  const testPass = "TestPass123!";

  if (emailExists && passExists) {
    await emailInput.fill(testEmail);
    await passwordInput.fill(testPass);
    await shot(page, "filled-form");

    const submitBtn3 = page.locator("button[type='submit'], button").filter({ hasText: /войти|вход|зарег|sign|log/i }).first();
    if (await submitBtn3.count() > 0) {
      await submitBtn3.click();
      await page.waitForLoadState("networkidle").catch(() => {});
      await page.waitForTimeout(1000);
      await shot(page, "after-submit");
      log(`URL после входа: ${page.url()}`);

      const errorMsg = await page.locator("[class*='error'], [role='alert'], [class*='toast']").first().textContent().catch(() => null);
      if (errorMsg) log(`Сообщение: ${errorMsg}`);
    }
  }

  // ── 4. Навигация по разделам ────────────────────────────────────────────────
  console.log("\n=== 4. Калькулятор/главная ===");
  await page.goto(`${BASE_URL}/calculator`, { waitUntil: "networkidle" }).catch(() => {});
  await shot(page, "calculator");
  log(`URL: ${page.url()}`);

  const calcTitle = await page.locator("h1, h2").first().textContent().catch(() => "—");
  log(`Заголовок: ${calcTitle}`);

  // ── 5. Performer регистрация ────────────────────────────────────────────────
  console.log("\n=== 5. Исполнитель — вход ===");
  await page.goto(`${BASE_URL}/performer`, { waitUntil: "networkidle" }).catch(() => {});
  await shot(page, "performer-page");
  log(`URL: ${page.url()}`);

  // ── 6. 404 проверка ─────────────────────────────────────────────────────────
  console.log("\n=== 6. Несуществующая страница ===");
  await page.goto(`${BASE_URL}/nonexistent-page-xyz`, { waitUntil: "networkidle" }).catch(() => {});
  await shot(page, "404-page");
  const is404 = await page.locator("text=/404|не найден|not found/i").count() > 0;
  if (!is404) bug("Страница 404 не показывает понятное сообщение об ошибке");
  else log("404 страница работает корректно");

  // ── Итог ────────────────────────────────────────────────────────────────────
  console.log("\n=== ИТОГ ===");
  console.log(`Всего скриншотов: ${stepNum}`);
  console.log(`Найдено багов: ${bugs.length}`);
  bugs.forEach((b, i) => console.log(`  ${i + 1}. ${b}`));

  await browser.close();

  return { bugs, screenshotsDir: SCREENSHOTS_DIR };
}

run().catch(console.error);
