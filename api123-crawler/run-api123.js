/**
 * 123api 数据抓取 - 主运行脚本
 * 优先使用保存的登录状态，其次尝试环境变量自动登录
 */

const { chromium } = require('playwright');
const {
  CONFIG,
  convertQuotaToDailyCost,
  getMissingDates,
  hasStoredAuth,
  writeToExcel,
} = require('./api123-crawler');

async function checkLogin(page) {
  const url = page.url();
  return url.includes('/console') && !url.includes('/login');
}

async function tryAutoLogin(page, context) {
  const username = process.env[CONFIG.usernameEnv];
  const password = process.env[CONFIG.passwordEnv];
  if (!username || !password) {
    return false;
  }

  console.log('检测到环境变量，尝试自动登录...');
  await page.goto('https://128api.cn/login', { waitUntil: 'domcontentloaded', timeout: CONFIG.timeout });
  await page.waitForTimeout(1000);
  const inputs = page.locator('input');
  await inputs.nth(0).fill(username);
  await inputs.nth(1).fill(password);
  await page.getByRole('button', { name: '继续' }).click();
  await page.waitForTimeout(4000);

  if (!(await checkLogin(page))) {
    return false;
  }

  await context.storageState({ path: CONFIG.storageFile });
  console.log('自动登录成功，状态已保存');
  return true;
}

async function waitForLogin(page, context) {
  if (await checkLogin(page)) {
    console.log('已登录状态');
    await context.storageState({ path: CONFIG.storageFile });
    return;
  }

  if (await tryAutoLogin(page, context)) {
    return;
  }

  console.log('等待手动登录...(登录成功后会自动继续)');
  for (let i = 0; i < 120; i++) {
    await page.waitForTimeout(2000);
    if (await checkLogin(page)) {
      console.log('检测到登录成功！');
      await context.storageState({ path: CONFIG.storageFile });
      console.log('登录状态已保存到:', CONFIG.storageFile);
      return;
    }
  }

  throw new Error('登录超时（4分钟）');
}

async function searchAndExtract(page, dateInfo) {
  console.log('\n开始提取数据...');
  await page.screenshot({ path: 'debug-page.png' });
  console.log('已保存调试截图: debug-page.png');
  await page.waitForTimeout(3000);

  const searchSelectors = [
    'button:has(span[aria-label="search"])',
    'button:has(svg.lucide-search)',
    'button[aria-label="search"]',
    'button:has-text("搜索")',
    'i.el-icon-search',
    '.el-icon-search',
    '[class*="search"]',
  ];

  let clicked = false;
  for (const selector of searchSelectors) {
    const el = page.locator(selector).first();
    if (await el.isVisible().catch(() => false)) {
      console.log(`找到元素: ${selector}`);
      await el.click();
      clicked = true;
      break;
    }
  }

  if (!clicked) {
    throw new Error('未找到搜索按钮');
  }

  await page.waitForTimeout(1000);
  const modal = page.locator('.semi-modal-wrap:visible').last();
  if (await modal.count() === 0) {
    throw new Error('已点击放大镜，但未找到搜索条件弹窗');
  }

  const inputs = await modal.locator('input').all();
  console.log(`  在弹窗内找到 ${inputs.length} 个输入框`);
  for (const [index, value] of [dateInfo.startTime, dateInfo.endTime].entries()) {
    await inputs[index].click();
    await page.waitForTimeout(200);
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    await page.waitForTimeout(100);
    await page.keyboard.type(value, { delay: 20 });
    const box = await inputs[index].boundingBox();
    if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y - 20);
    }
    await page.waitForTimeout(500);
  }

  await page.screenshot({ path: 'debug-date-filled.png' });
  await modal.locator('button:has-text("确定")').first().click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'debug-after-search.png' });

  const bodyText = await page.locator('body').innerText().catch(() => '');
  const match = bodyText.match(/统计额度\s*\$?([\d.]+)/);
  if (match) {
    console.log(`统计额度: ${match[1]}`);
    return match[1];
  }

  console.log('未能提取到数据，自动填写0');
  return '0';
}

async function main() {
  console.log('=== 123api 数据抓取脚本 ===\n');
  const missingDates = getMissingDates();
  if (missingDates.length === 0) {
    console.log('没有需要采集的日期，数据已是最新！');
    return;
  }

  console.log(`检测到 ${missingDates.length} 个缺失日期需要采集：`);
  missingDates.forEach((dateInfo) => console.log(`  - ${dateInfo.formatted}`));
  console.log('');

  const browser = await chromium.launch({ headless: CONFIG.headless });
  const context = hasStoredAuth()
    ? await browser.newContext({ storageState: CONFIG.storageFile })
    : await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(CONFIG.url, { waitUntil: 'networkidle', timeout: CONFIG.timeout });
    await page.waitForTimeout(2000);
    await waitForLogin(page, context);

    for (let i = 0; i < missingDates.length; i++) {
      const dateInfo = missingDates[i];
      console.log(`\n[${i + 1}/${missingDates.length}] 采集日期: ${dateInfo.formatted}`);
      console.log(`查询范围: ${dateInfo.startTime} ~ ${dateInfo.endTime}`);
      const quotaAmount = await searchAndExtract(page, dateInfo);
      const dailyCost = convertQuotaToDailyCost(quotaAmount);
      console.log(
        `123api 页面额度: ${quotaAmount}，按 ${CONFIG.quotaDivisor} 换算后的真实费用: ${dailyCost}`
      );
      writeToExcel(dateInfo.formatted, dailyCost);
      if (i < missingDates.length - 1) {
        console.log('等待2秒后继续下一个日期...');
        await page.waitForTimeout(2000);
      }
    }
  } catch (error) {
    console.error('\n出错:', error.message);
    await page.screenshot({ path: 'error-screenshot.png' });
  } finally {
    await browser.close();
    console.log('\n全部完成');
  }
}

main();
