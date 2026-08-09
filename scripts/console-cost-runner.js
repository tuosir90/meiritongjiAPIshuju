/**
 * 控制台类消耗抓取共享运行器
 */

const { chromium } = require('playwright');
const { pickAmountFromCandidates } = require('./cost-amount-extractor');

async function checkLogin(page) {
  const url = page.url();
  return url.includes('/console') && !url.includes('/login');
}

async function waitForLogin(page, context, storageFile) {
  if (await checkLogin(page)) {
    console.log('已登录状态');
    await context.storageState({ path: storageFile });
    console.log('登录状态已保存');
    return;
  }

  console.log('等待手动登录...(登录成功后会自动继续)');
  for (let i = 0; i < 120; i++) {
    await page.waitForTimeout(2000);
    if (await checkLogin(page)) {
      console.log('检测到登录成功！');
      await context.storageState({ path: storageFile });
      console.log('登录状态已保存到:', storageFile);
      return;
    }
  }

  throw new Error('登录超时（4分钟）');
}

async function clickSearchButton(page, searchSelectors) {
  console.log('查找搜索按钮...');
  const timeoutMs = 45000;
  const intervalMs = 500;
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    for (const selector of searchSelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        console.log(`找到元素: ${selector}`);
        await element.click();
        return;
      }
    }

    await page.waitForTimeout(intervalMs);
  }

  throw new Error('未找到搜索按钮');
}

async function clickConfirmButton(scope, confirmSelectors) {
  const timeoutMs = 45000;
  const intervalMs = 500;
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    for (const selector of confirmSelectors) {
      const button = scope.locator(selector).first();
      if (await button.isVisible().catch(() => false)) {
        console.log(`找到确认按钮: ${selector}`);
        await button.click();
        return;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error(`未找到确认按钮: ${confirmSelectors.join(', ')}`);
}

async function resolveScope(page, options) {
  const modal = page.locator(options.modalSelector ?? '.semi-modal-wrap:visible').last();
  if (await modal.count() === 0) {
    if (options.requireModal) {
      throw new Error('已点击放大镜，但未找到搜索条件弹窗');
    }
    return { scope: page, scopeLabel: '页面' };
  }

  return { scope: modal, scopeLabel: '弹窗' };
}

async function fillSingleInput(page, input, value) {
  await input.click();
  await page.waitForTimeout(200);
  await page.keyboard.press('Control+A');
  await page.keyboard.press('Backspace');
  await page.waitForTimeout(100);
  await page.keyboard.type(value, { delay: 20 });
  await page.waitForTimeout(200);
  const box = await input.boundingBox();
  if (box) {
    await page.mouse.click(box.x + box.width / 2, box.y - 20);
  }
  await page.waitForTimeout(500);
}

async function searchAndExtract(page, dateInfo, options) {
  console.log('\n开始提取数据...');
  await page.screenshot({ path: 'debug-page.png' });
  console.log('已保存调试截图: debug-page.png');
  await page.waitForTimeout(3000);

  await clickSearchButton(page, options.searchSelectors);
  await page.waitForTimeout(1000);

  const { scope, scopeLabel } = await resolveScope(page, options);
  const inputs = await scope.locator(options.inputSelector ?? 'input').all();
  console.log('填写日期范围...');
  console.log(`  起始时间: ${dateInfo.startTime}`);
  console.log(`  结束时间: ${dateInfo.endTime}`);
  console.log(`  在${scopeLabel}内找到 ${inputs.length} 个输入框`);

  for (const [index, value] of [dateInfo.startTime, dateInfo.endTime].entries()) {
    console.log(index === 0 ? '  清空并填写起始时间...' : '  清空并填写结束时间...');
    await fillSingleInput(page, inputs[index], value);
  }

  await page.screenshot({ path: 'debug-date-filled.png' });
  if (options.logFilledScreenshot) {
    console.log('  已保存日期填写截图: debug-date-filled.png');
  }

  console.log('点击确认按钮...');
  await clickConfirmButton(scope, options.confirmButtonSelectors ?? [
    'button:has-text("确定")',
    'button:has-text("确认")',
  ]);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'debug-after-search.png' });

  console.log('提取统计额度...');
  const statsText = await page.locator('text=统计额度').first().locator('..').textContent().catch(() => null);
  const areaText = await page
    .locator(options.amountAreaSelector ?? '.el-card, [class*="card"]')
    .filter({ hasText: '资源消耗' })
    .first()
    .textContent()
    .catch(() => null);
  const bodyText = await page.locator('body').innerText().catch(() => '');
  const amount = pickAmountFromCandidates([statsText, areaText, bodyText]);

  if (amount !== null) {
    console.log(`统计额度: ${amount}`);
    return amount;
  }

  console.log('未能提取到数据，请检查截图 debug-after-search.png');
  return null;
}

async function runConsoleCostCrawler(options) {
  console.log(`=== ${options.title} ===\n`);

  const missingDates = options.getMissingDates();
  if (missingDates.length === 0) {
    console.log('没有需要采集的日期，数据已是最新！');
    return;
  }

  console.log(`检测到 ${missingDates.length} 个缺失日期需要采集：`);
  missingDates.forEach((dateInfo) => console.log(`  - ${dateInfo.formatted}`));
  console.log('');

  const browser = await chromium.launch({ headless: options.config.headless });
  const context = options.hasStoredAuth()
    ? await browser.newContext({ storageState: options.config.storageFile })
    : await browser.newContext();
  const page = await context.newPage();

  try {
    if (options.hasStoredAuth()) {
      console.log('检测到已保存的登录状态，正在加载...');
    } else {
      console.log('首次运行，请在浏览器中手动登录...');
    }

    await page.goto(options.config.url, { waitUntil: 'domcontentloaded', timeout: options.config.timeout });
    await page.waitForTimeout(2000);
    await waitForLogin(page, context, options.config.storageFile);

    for (let i = 0; i < missingDates.length; i++) {
      const dateInfo = missingDates[i];
      console.log(`\n[${i + 1}/${missingDates.length}] 采集日期: ${dateInfo.formatted}`);
      console.log(`查询范围: ${dateInfo.startTime} ~ ${dateInfo.endTime}`);

      const amount = await searchAndExtract(page, dateInfo, options);
      if (amount === null && options.failOnMissingAmount) {
        throw new Error(options.missingAmountErrorMessage ?? '未提取到统计额度，停止写入，避免把有效数据覆盖为0');
      }

      const finalAmount = options.formatAmount(amount);
      if (amount === null) {
        console.log(options.emptyAmountMessage ?? '未提取到数据，自动填写0');
      } else if (options.describeAmount) {
        console.log(options.describeAmount(amount, finalAmount));
      }

      options.writeToExcel(dateInfo.formatted, finalAmount);
      if (i < missingDates.length - 1) {
        console.log('等待2秒后继续下一个日期...');
        await page.waitForTimeout(2000);
      }
    }
  } catch (error) {
    console.error('\n出错:', error.message);
    await page.screenshot({ path: 'error-screenshot.png' });
    process.exitCode = 1;
  } finally {
    await browser.close();
    console.log('\n全部完成');
  }
}

module.exports = { runConsoleCostCrawler, clickSearchButton, clickConfirmButton };
