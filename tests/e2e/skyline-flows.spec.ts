import { test, expect, type Page } from '@playwright/test';
import path from 'path';

const SCREENSHOT_DIR = path.resolve(process.cwd(), 'docs/screenshots');

const ACCOUNTS = {
  OWNER: {
    email: process.env.E2E_OWNER_EMAIL || 'huuluc04@gmail.com',
    password: process.env.E2E_OWNER_PASSWORD || process.env.E2E_DEFAULT_PASSWORD || '',
  },
  ADMIN: {
    email: process.env.E2E_ADMIN_EMAIL || 'admin@skyline.vn',
    password: process.env.E2E_ADMIN_PASSWORD || process.env.E2E_DEFAULT_PASSWORD || '',
  },
  TECHNICIAN: {
    email: process.env.E2E_TECH_EMAIL || 'tech.skyline@gmail.com',
    password: process.env.E2E_TECH_PASSWORD || process.env.E2E_DEFAULT_PASSWORD || '',
  },
  RECEPTIONIST: {
    email: process.env.E2E_RECEPTION_EMAIL || 'reception.skyline@gmail.com',
    password: process.env.E2E_RECEPTION_PASSWORD || process.env.E2E_DEFAULT_PASSWORD || '',
  },
};

function requireLocalSupabaseGuard() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const isLocal =
    supabaseUrl.includes('127.0.0.1') ||
    supabaseUrl.includes('localhost') ||
    process.env.E2E_ALLOW_REMOTE === 'true';
  test.skip(!isLocal, 'E2E chỉ chạy với Supabase local (127.0.0.1/localhost).');
}

async function loginViaUi(page: Page, email: string, password: string) {
  expect(password, `Thiếu mật khẩu E2E cho ${email}`).toBeTruthy();
  await page.goto('/');
  const openLoginBtn = page.getByRole('button', { name: /Đăng nhập|Portal/i }).first();
  await openLoginBtn.click();

  await page.getByPlaceholder(/Nhập email tài khoản/i).fill(email);
  await page.getByPlaceholder(/Nhập mật khẩu/i).fill(password);
  await page.locator('form button[type="submit"]').click();
  await page.waitForURL(/\/portal/, { timeout: 20_000 });
}

test.describe('SKYLINE Smart Residence E2E (Supabase Local)', () => {
  test.beforeEach(() => {
    requireLocalSupabaseGuard();
  });

  test('1. Đăng nhập OWNER và truy cập cổng cư dân', async ({ page }) => {
    await loginViaUi(page, ACCOUNTS.OWNER.email, ACCOUNTS.OWNER.password);
    await expect(page).toHaveURL(/\/portal/);
    await expect(page.getByText(/CH-06|Beverly Solari|The Tropical/i).first()).toBeVisible();
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '01-owner-login.png'),
      fullPage: true,
    });
  });

  test('2. Tạo phiếu sự cố (OWNER) -> ADMIN gán KTV -> KTV xử lý', async ({ page, browser }) => {
    await loginViaUi(page, ACCOUNTS.OWNER.email, ACCOUNTS.OWNER.password);
    const title = `E2E Sự cố điều hòa ${Date.now()}`;
    const createRes = await page.request.post('/api/tickets', {
      data: {
        title,
        description: 'Kiểm thử E2E luồng tạo phiếu và điều phối KTV.',
        category: 'HVAC',
        priority: 'HIGH',
      },
    });
    expect(createRes.ok()).toBeTruthy();
    const createdJson = await createRes.json();
    const ticketId = createdJson.ticket?.id;
    expect(ticketId).toBeTruthy();

    // ADMIN gán KTV
    const adminCtx = await browser.newContext();
    const adminPage = await adminCtx.newPage();
    await loginViaUi(adminPage, ACCOUNTS.ADMIN.email, ACCOUNTS.ADMIN.password);
    const assignRes = await adminPage.request.post('/api/tickets', {
      data: {
        action: 'ASSIGN',
        ticketId,
        technicianId: 'KTV-01',
      },
    });
    expect(assignRes.ok()).toBeTruthy();
    await adminCtx.close();

    // KTV xử lý
    const techCtx = await browser.newContext();
    const techPage = await techCtx.newPage();
    await loginViaUi(techPage, ACCOUNTS.TECHNICIAN.email, ACCOUNTS.TECHNICIAN.password);
    const resolveRes = await techPage.request.post('/api/tickets', {
      data: {
        action: 'RESOLVE',
        ticketId,
        resolutionNote: 'Đã kiểm tra và vệ sinh dàn lạnh hoàn tất.',
      },
    });
    expect(resolveRes.ok()).toBeTruthy();
    await techPage.goto('/portal?tab=tech-kanban');
    await techPage.screenshot({
      path: path.join(SCREENSHOT_DIR, '02-ticket-lifecycle.png'),
      fullPage: true,
    });
    await techCtx.close();
  });

  test('3. Xem hóa đơn và thanh toán qua cổng VNPay sandbox', async ({ page }) => {
    await loginViaUi(page, ACCOUNTS.OWNER.email, ACCOUNTS.OWNER.password);
    await page.goto('/portal?tab=resident-finance');
    const billsRes = await page.request.get('/api/billing');
    expect(billsRes.ok()).toBeTruthy();
    const billsJson = await billsRes.json();
    const unpaid = (billsJson.bills || []).find((b: { status: string }) => b.status === 'UNPAID');

    if (unpaid) {
      const vnpayRes = await page.request.post('/api/billing/vnpay-create', {
        data: { billId: unpaid.id },
      });
      expect(vnpayRes.ok()).toBeTruthy();
      const vnpayJson = await vnpayRes.json();
      if (vnpayJson.paymentUrl) {
        await page.goto(vnpayJson.paymentUrl);
      }
    }

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '03-billing-vnpay-sandbox.png'),
      fullPage: true,
    });
  });

  test('4. Tạo thẻ khách (OWNER) rồi Lễ tân check-in', async ({ page, browser }) => {
    await loginViaUi(page, ACCOUNTS.OWNER.email, ACCOUNTS.OWNER.password);
    const createPassRes = await page.request.post('/api/visitor', {
      data: {
        visitorName: 'Khách E2E Test',
        visitorPhone: '0901112233',
        entryType: 'GUEST',
        purpose: 'Kiểm thử luồng check-in',
      },
    });
    expect(createPassRes.ok()).toBeTruthy();
    const passJson = await createPassRes.json();
    const passId = passJson.pass?.id;
    expect(passId).toBeTruthy();

    const receptionCtx = await browser.newContext();
    const receptionPage = await receptionCtx.newPage();
    await loginViaUi(receptionPage, ACCOUNTS.RECEPTIONIST.email, ACCOUNTS.RECEPTIONIST.password);
    const checkInRes = await receptionPage.request.post('/api/visitor', {
      data: { action: 'CHECK_IN', passId },
    });
    expect(checkInRes.ok()).toBeTruthy();
    await receptionPage.goto('/portal?tab=admin-visitors');
    await receptionPage.screenshot({
      path: path.join(SCREENSHOT_DIR, '04-visitor-checkin.png'),
      fullPage: true,
    });
    await receptionCtx.close();
  });

  test('5. Bỏ phiếu một lần và lần hai bị chặn', async ({ page }) => {
    await loginViaUi(page, ACCOUNTS.OWNER.email, ACCOUNTS.OWNER.password);
    const topicsRes = await page.request.get('/api/voting');
    expect(topicsRes.ok()).toBeTruthy();
    const topicsJson = await topicsRes.json();
    const openTopic = (topicsJson.topics || []).find(
      (t: { status: string; options?: Array<{ id: string }> }) =>
        t.status === 'OPEN' && Array.isArray(t.options) && t.options.length > 0
    );
    test.skip(!openTopic, 'Không có chủ đề biểu quyết OPEN trong seed local.');

    const optionId = openTopic.options[0].id;
    const firstVote = await page.request.post('/api/voting', {
      data: { topicId: openTopic.id, optionId },
    });
    expect(firstVote.ok()).toBeTruthy();

    const secondVote = await page.request.post('/api/voting', {
      data: { topicId: openTopic.id, optionId },
    });
    expect(secondVote.ok()).toBeFalsy();
    expect([400, 409]).toContain(secondVote.status());

    await page.goto('/portal?tab=resident-community');
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '05-voting-double-block.png'),
      fullPage: true,
    });
  });
});
