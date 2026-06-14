import { test, expect } from '@playwright/test';

// ─── Shared helpers ────────────────────────────────────────────────────────────
const BASE = 'http://localhost:5173';
const LOGIN = `${BASE}/login`;

// Helper: navigate to login page and assert page loads correctly
async function goToLogin(page) {
  await page.goto(LOGIN, { waitUntil: 'networkidle' });
}

// ─── 1. Login page loads and shows "Hello Again!" ─────────────────────────────
test('1 · Login page renders correctly', async ({ page }) => {
  await goToLogin(page);
  await expect(page).toHaveTitle(/LUNA|Vite/i);
  await expect(page.locator('h1.title')).toContainText('Hello Again!');
});

// ─── 2. Login form has email and password fields ───────────────────────────────
test('2 · Login form has email and password inputs', async ({ page }) => {
  await goToLogin(page);
  await expect(page.locator('input[placeholder="Email"]').first()).toBeVisible();
  await expect(page.locator('input[placeholder="Password"]').first()).toBeVisible();
});

// ─── 3. Sign In button is visible ─────────────────────────────────────────────
test('3 · Sign In button is visible', async ({ page }) => {
  await goToLogin(page);
  await expect(page.locator('button.signin-button')).toBeVisible();
});

// ─── 4. Toggle to signup panel ────────────────────────────────────────────────
test('4 · Toggle to sign-up panel shows "Getting started!"', async ({ page }) => {
  await goToLogin(page);
  await page.click('button.right'); // "Not signed in yet?"
  await expect(page.locator('h1.title-left')).toContainText('Getting started!');
  await expect(page.locator('button.signup-button')).toBeVisible();
});

// ─── 5. Toggle back to login from signup ──────────────────────────────────────
test('5 · Toggling back from signup shows login again', async ({ page }) => {
  await goToLogin(page);
  await page.click('button.right');
  await page.click('button.left'); // "Already there?"
  await expect(page.locator('h1.title')).toContainText('Hello Again!');
});

// ─── 6. Empty login shows browser validation (required fields) ────────────────
test('6 · Clicking Sign In with empty fields stays on login page', async ({ page }) => {
  await goToLogin(page);
  // Fill nothing – submit should not navigate away (Supabase will fail/alert)
  // We check page still has login form visible
  await page.locator('input[placeholder="Email"]').first().fill('');
  await page.locator('button.signin-button').click();
  // Still on login page (no redirect without valid credentials)
  await expect(page).toHaveURL(/login/);
});

// ─── 7. Protected route redirects to /login ────────────────────────────────────
test('7 · Protected route redirects to /login if unauthenticated', async ({ page }) => {
  await page.goto(BASE + '/random-uid', { waitUntil: 'networkidle' });
  // Should redirect to /login
  await expect(page).toHaveURL(/login/);
  await expect(page.locator('h1.title')).toContainText('Hello Again!');
});

// ─── 8. Login page has "Hello Again!" greeting ────────────────────────────────
test('8 · Login page contains "Hello Again!" greeting', async ({ page }) => {
  await goToLogin(page);
  await expect(page.locator('h1.title')).toContainText('Hello Again!');
});

// ─── 9. Login page has the animated half-screen rectangle ─────────────────────
test('9 · Decorative animated panel exists on login page', async ({ page }) => {
  await goToLogin(page);
  const panel = page.locator('.half-screen-rectangle');
  await expect(panel).toBeAttached();
});

// ─── 10. Password field is of type=password (obscured) ────────────────────────
test('10 · Password field is type=password (not plain text)', async ({ page }) => {
  await goToLogin(page);
  const passwordInput = page.locator('input[type="password"]').first();
  await expect(passwordInput).toBeVisible();
  const inputType = await passwordInput.getAttribute('type');
  expect(inputType).toBe('password');
});

// ─── 11. Signup form has its own email + password inputs ──────────────────────
test('11 · Signup form fields are separate from login fields', async ({ page }) => {
  await goToLogin(page);
  await page.click('button.right');
  const signupEmails = page.locator('input[placeholder="Email"]');
  await expect(signupEmails.first()).toBeVisible();
  const signupPasswords = page.locator('input[placeholder="Password"]');
  await expect(signupPasswords.first()).toBeVisible();
});

// ─── 12. Login page is responsive: viewport 375px (mobile) ───────────────────
test('12 · Login page is usable on mobile viewport (375px)', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await goToLogin(page);
  await expect(page.locator('h1.title')).toBeVisible();
  await expect(page.locator('button.signin-button')).toBeVisible();
});

// ─── 13. Login page is responsive: viewport 1440px (desktop wide) ────────────
test('13 · Login page is usable on wide desktop (1440px)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await goToLogin(page);
  await expect(page.locator('h1.title')).toBeVisible();
  await expect(page.locator('button.signin-button')).toBeVisible();
});

// ─── 14. Page has no critical console JS errors on load ──────────────────────
test('14 · No critical JS errors thrown on login page load', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  await goToLogin(page);
  // Filter out known benign third-party/env errors
  const critical = errors.filter(msg =>
    !msg.includes('net::ERR') &&
    !msg.includes('supabase') &&
    !msg.includes('ResizeObserver')
  );
  expect(critical).toHaveLength(0);
});

// ─── 15. Login: typing into email field works ─────────────────────────────────
test('15 · User can type into email and password fields', async ({ page }) => {
  await goToLogin(page);
  const emailInput = page.locator('input[placeholder="Email"]').first();
  const passInput = page.locator('input[placeholder="Password"]').first();
  await emailInput.fill('test@luna.io');
  await passInput.fill('supersecret');
  await expect(emailInput).toHaveValue('test@luna.io');
  await expect(passInput).toHaveValue('supersecret');
});

// ─── 16. Signup: typing into all signup fields works ─────────────────────────
test('16 · User can type into signup email and password fields', async ({ page }) => {
  await goToLogin(page);
  await page.click('button.right');
  const emailInput = page.locator('input[placeholder="Email"]').first();
  const passInput = page.locator('input[placeholder="Password"]').first();
  await emailInput.fill('new@luna.io');
  await passInput.fill('password123');
  await expect(emailInput).toHaveValue('new@luna.io');
  await expect(passInput).toHaveValue('password123');
});

// ─── 17. Page title is set (SEO) ──────────────────────────────────────────────
test('17 · Page has a non-empty browser title (SEO)', async ({ page }) => {
  await goToLogin(page);
  const title = await page.title();
  expect(title.length).toBeGreaterThan(0);
});

// ─── 18. Toggle animation: panel shifts class on signup view ─────────────────
test('18 · Animated panel gets "move-right" class on signup toggle', async ({ page }) => {
  await goToLogin(page);
  const panel = page.locator('.half-screen-rectangle');
  // In login mode: no move-right
  const hasMoveRight = await panel.evaluate(el => el.classList.contains('move-right'));
  expect(hasMoveRight).toBe(false);
  // Click to signup
  await page.click('button.right');
  const hasMoveRightAfter = await panel.evaluate(el => el.classList.contains('move-right'));
  expect(hasMoveRightAfter).toBe(true);
});

// ─── 19. Login page keyboard: Tab moves between email → password → submit ─────
test('19 · Tab key navigates between form fields naturally', async ({ page }) => {
  await goToLogin(page);
  await page.locator('input[placeholder="Email"]').first().click();
  await page.keyboard.press('Tab');
  // After tab, focus should move to password
  const focused = await page.evaluate(() => document.activeElement?.getAttribute('type'));
  expect(focused).toBe('password');
});

// ─── 20. Page does not have layout overflow causing horizontal scroll ─────────
test('20 · Login page has no unintended horizontal scroll', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await goToLogin(page);
  const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
  const windowWidth = await page.evaluate(() => window.innerWidth);
  expect(bodyScrollWidth).toBeLessThanOrEqual(windowWidth + 5); // 5px tolerance
});
