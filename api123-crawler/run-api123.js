/**
 * APIMart 数据抓取 - 主运行脚本
 * 首次运行会弹出浏览器等待手动登录，并自动保存登录状态
 */

const { chromium } = require('playwright');
const {
  CONFIG,
  convertQuotaToDailyCost,
  getMissingDates,
  hasStoredAuth,
  writeToExcel,
} = require('./api123-crawler');
const {
  extractVisibleQuotaFromPage,
  fetchDashboardQuota,
  getAuthInfoFromRawUser,
  getStoredRawUser,
  isLoginPageUrl,
} = require('./apimart-dashboard');
const { applyCustomDateRange } = require('./apimart-date-filter');

async function hasUserSession(page) {
  const rawUser = await getStoredRawUser(page);
  if (getAuthInfoFromRawUser(rawUser)) return true;

  const url = page.url();
  return url.includes('apimart.ai') && !isLoginPageUrl(url) && !url.includes('/register');
}

async function gotoOverview(page) {
  await page.goto(CONFIG.url, { waitUntil: 'domcontentloaded', timeout: CONFIG.timeout });
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => null);
}

async function saveLoginState(page, context) {
  await context.storageState({ path: CONFIG.storageFile });
  console.log('登录状态已保存到:', CONFIG.storageFile);
  if (!page.url().includes('/overview')) {
    await gotoOverview(page);
  }
}

async function waitForLogin(page, context) {
  if (await hasUserSession(page)) {
    console.log('已登录状态');
    await saveLoginState(page, context);
    return;
  }

  console.log('等待手动登录 APIMart...(请在弹出的页面输入账号和密码，登录成功后会自动继续)');
  for (let i = 0; i < 120; i++) {
    await page.waitForTimeout(2000);
    if (await hasUserSession(page)) {
      console.log('检测到登录成功！');
      await saveLoginState(page, context);
      return;
    }
  }

  throw new Error('登录超时（4分钟）');
}

async function extractQuotaAmount(page, dateInfo) {
  console.log('\n开始提取数据...');
  await gotoOverview(page);
  await applyCustomDateRange(page, dateInfo);
  await page.screenshot({ path: 'debug-page.png' });
  console.log('已保存调试截图: debug-page.png');

  const visibleAmount = await extractVisibleQuotaFromPage(page);
  if (visibleAmount !== null) {
    console.log(`页面显示统计额度: $${visibleAmount}`);
  }

  let amount;
  try {
    amount = await fetchDashboardQuota(page, dateInfo);
  } catch (error) {
    if (visibleAmount === null) throw error;
    console.log(`接口精确额度读取失败，使用页面显示额度: ${error.message}`);
    amount = visibleAmount;
  }

  console.log(`统计额度: $${amount}`);
  await page.screenshot({ path: 'debug-after-search.png' });
  return amount;
}

async function main() {
  console.log('=== APIMart 数据抓取脚本 ===\n');
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
    if (hasStoredAuth()) {
      console.log('检测到已保存的登录状态，正在加载...');
    } else {
      console.log('首次运行，请在弹出的 APIMart 页面手动登录...');
    }

    await gotoOverview(page);
    await waitForLogin(page, context);

    for (let i = 0; i < missingDates.length; i++) {
      const dateInfo = missingDates[i];
      console.log(`\n[${i + 1}/${missingDates.length}] 采集日期: ${dateInfo.formatted}`);
      console.log(`查询范围: ${dateInfo.startTime} ~ ${dateInfo.endTime}`);
      const quotaAmount = await extractQuotaAmount(page, dateInfo);
      const dailyCost = convertQuotaToDailyCost(quotaAmount);
      console.log(
        `APIMart 页面额度: $${quotaAmount}，按汇率 ${CONFIG.exchangeRate} 换算后的人民币费用: ${dailyCost}`
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
