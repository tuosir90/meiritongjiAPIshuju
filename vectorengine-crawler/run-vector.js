/**
 * 向量引擎API 数据抓取 - 主运行脚本
 * 首次运行需手动登录，之后自动使用保存的登录状态
 */

const { chromium } = require('playwright');
const { CONFIG, getTargetDate, hasStoredAuth, writeToExcel } = require('./vector-crawler');

/**
 * 等待用户登录成功，检测到后保存状态
 */
async function waitForLogin(page, context) {
  const checkLogin = async () => {
    const url = page.url();
    return url.includes('/console') && !url.includes('/login');
  };

  if (await checkLogin()) {
    console.log('已登录状态');
    await context.storageState({ path: CONFIG.storageFile });
    console.log('登录状态已保存');
    return;
  }

  console.log('等待手动登录...(登录成功后会自动继续)');

  for (let i = 0; i < 120; i++) {
    await page.waitForTimeout(2000);
    if (await checkLogin()) {
      console.log('检测到登录成功！');
      await context.storageState({ path: CONFIG.storageFile });
      console.log('登录状态已保存到:', CONFIG.storageFile);
      return;
    }
  }

  throw new Error('登录超时（4分钟）');
}

/**
 * 执行搜索并提取统计额度
 */
async function searchAndExtract(page, dateInfo) {
  console.log('\n开始提取数据...');
  await page.screenshot({ path: 'debug-page.png' });
  console.log('已保存调试截图: debug-page.png');
  await page.waitForTimeout(3000);

  // 点击搜索按钮
  console.log('查找搜索按钮...');
  const searchSelectors = [
    'i.el-icon-search',
    '.el-icon-search',
    '[class*="search"]',
    'button:has-text("搜索")',
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
    console.log('未找到搜索按钮，尝试直接提取页面数据...');
  }

  await page.waitForTimeout(1000);
  return await fillDateAndExtract(page, dateInfo);
}

/**
 * 填写日期并提取数据
 */
async function fillDateAndExtract(page, dateInfo) {
  console.log('填写日期范围...');
  console.log(`  起始时间: ${dateInfo.startTime}`);
  console.log(`  结束时间: ${dateInfo.endTime}`);

  const inputs = await page.locator('input[type="text"]').all();
  console.log(`  找到 ${inputs.length} 个文本输入框`);

  // 填写起始时间
  if (inputs.length >= 1) {
    console.log('  清空并填写起始时间...');
    await inputs[0].click();
    await page.waitForTimeout(200);
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    await page.waitForTimeout(100);
    await page.keyboard.type(dateInfo.startTime, { delay: 20 });
    await page.waitForTimeout(200);
    const box = await inputs[0].boundingBox();
    if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y - 20);
    }
    await page.waitForTimeout(500);
  }

  // 填写结束时间
  if (inputs.length >= 2) {
    console.log('  清空并填写结束时间...');
    await inputs[1].click();
    await page.waitForTimeout(200);
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    await page.waitForTimeout(100);
    await page.keyboard.type(dateInfo.endTime, { delay: 20 });
    await page.waitForTimeout(200);
    const box2 = await inputs[1].boundingBox();
    if (box2) {
      await page.mouse.click(box2.x + box2.width / 2, box2.y - 20);
    }
    await page.waitForTimeout(500);
  }

  await page.screenshot({ path: 'debug-date-filled.png' });
  return await clickConfirmAndExtract(page);
}

/**
 * 点击确定并提取数据
 */
async function clickConfirmAndExtract(page) {
  console.log('点击确定...');
  await page.locator('button:has-text("确定")').first().click();
  await page.waitForTimeout(3000);

  await page.screenshot({ path: 'debug-after-search.png' });
  console.log('提取统计额度...');

  let amount = null;

  // 方式1: 查找"统计额度"
  const statsText = await page.locator('text=统计额度').first().locator('..').textContent().catch(() => null);
  if (statsText) {
    const match = statsText.match(/[\d.]+/);
    if (match) amount = match[0];
  }

  // 方式2: 查找资源消耗区域
  if (!amount) {
    const area = await page.locator('.el-card, [class*="card"]').filter({ hasText: '资源消耗' }).first();
    const text = await area.textContent().catch(() => null);
    if (text) {
      const match = text.match(/统计额度[^\d]*([\d.]+)/);
      if (match) amount = match[1];
    }
  }

  if (amount) {
    console.log(`统计额度: ${amount}`);
    return amount;
  }

  console.log('未能提取到数据');
  return null;
}

async function main() {
  console.log('=== 向量引擎API 数据抓取脚本 ===\n');

  const dateInfo = getTargetDate();
  console.log(`目标日期: ${dateInfo.formatted}`);
  console.log(`查询范围: ${dateInfo.startTime} ~ ${dateInfo.endTime}\n`);

  const browser = await chromium.launch({ headless: CONFIG.headless });

  let context;
  if (hasStoredAuth()) {
    console.log('检测到已保存的登录状态，正在加载...');
    context = await browser.newContext({ storageState: CONFIG.storageFile });
  } else {
    console.log('首次运行，请在浏览器中手动登录...');
    context = await browser.newContext();
  }

  const page = await context.newPage();

  try {
    await page.goto(CONFIG.url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    await waitForLogin(page, context);
    const amount = await searchAndExtract(page, dateInfo);

    if (amount !== null) {
      writeToExcel(dateInfo.formatted, amount);
    }
  } catch (error) {
    console.error('\n出错:', error.message);
    await page.screenshot({ path: 'error-screenshot.png' });
  } finally {
    await browser.close();
    console.log('\n完成');
  }
}

main();
