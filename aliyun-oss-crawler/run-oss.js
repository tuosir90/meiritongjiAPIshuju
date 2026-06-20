/**
 * 阿里云OSS 数据抓取 - 主运行脚本
 */

const { chromium } = require('playwright');
const {
  CONFIG,
  getMissingDates,
  hasStoredAuth,
  shouldAutoWriteZeroForMissingFolder,
  writeToExcel,
} = require('./oss-crawler');

/**
 * 等待用户登录成功
 */
async function waitForLogin(page, context) {
  // 检测是否已登录（URL包含aliyun.com且不包含login）
  const checkLogin = async () => {
    const url = page.url();
    return url.includes('aliyun.com') && !url.includes('login');
  };

  // 检测是否在目标页面
  const isOnTargetPage = () => {
    const url = page.url();
    return url.includes('oss.console.aliyun.com') && url.includes('meigong-design-system-v2');
  };

  if (await checkLogin()) {
    console.log('已登录状态');
    await context.storageState({ path: CONFIG.storageFile });
    console.log('登录状态已保存');

    // 如果不在目标页面，跳转到目标页面
    if (!isOnTargetPage()) {
      console.log('跳转到目标OSS bucket页面...');
      await page.goto(CONFIG.url, { waitUntil: 'networkidle', timeout: CONFIG.timeout });
      await page.waitForTimeout(2000);
    }
    return;
  }

  console.log('等待手动登录...(登录成功后会自动继续)');

  for (let i = 0; i < 240; i++) {
    await page.waitForTimeout(2000);
    if (await checkLogin()) {
      console.log('检测到登录成功！');
      await context.storageState({ path: CONFIG.storageFile });
      console.log('登录状态已保存到:', CONFIG.storageFile);

      // 登录成功后跳转到目标页面
      console.log('跳转到目标OSS bucket页面...');
      await page.goto(CONFIG.url, { waitUntil: 'networkidle', timeout: CONFIG.timeout });
      await page.waitForTimeout(2000);
      return;
    }
  }

  throw new Error('登录超时（8分钟）');
}

/**
 * 导航到目标文件夹
 */
async function navigateToFolder(page) {
  console.log('\n等待页面加载...');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'debug-page.png' });
  console.log('已保存调试截图: debug-page.png');
}

/**
 * 查找目标日期行并点击该行的统计按钮
 */
async function findDateAndClickStats(page, dateInfo) {
  console.log(`查找日期文件夹: ${dateInfo.folderName}`);

  // 滚动加载更多内容，确保目标日期可见
  for (let i = 0; i < 5; i++) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
  }

  // 查找包含目标日期的表格行（tr元素）
  const targetRow = page.locator(`tr:has-text("${dateInfo.folderName}")`).first();

  if (!(await targetRow.isVisible().catch(() => false))) {
    throw new Error(`未找到日期文件夹: ${dateInfo.folderName}`);
  }

  console.log(`找到日期行: ${dateInfo.folderName}`);

  // 在目标行内查找统计按钮
  // 之前能工作的选择器是 .xcomponent-btn-helper:has-text("统计")
  let statsBtn = targetRow.locator('.xcomponent-btn-helper:has-text("统计")').first();

  if (!(await statsBtn.isVisible().catch(() => false))) {
    // 备用：查找行内的链接
    statsBtn = targetRow.locator('a:has-text("统计")').first();
  }

  if (!(await statsBtn.isVisible().catch(() => false))) {
    // 再备用：查找行内包含"统计"文字的元素
    statsBtn = targetRow.locator('text=统计').first();
  }

  const isVisible = await statsBtn.isVisible().catch(() => false);
  console.log(`统计按钮可见: ${isVisible}`);

  return { targetRow, statsBtn };
}

/**
 * 提取弹窗中的当前目录和对象总数
 */
function extractStats(text) {
  const currentDirMatch = String(text || '').match(/(generated\/\d{4}-\d{2}-\d{2}\/)/);
  const totalMatch = String(text || '').match(/对象总数\s*(\d+)/);

  return {
    currentDir: currentDirMatch ? currentDirMatch[1] : '',
    total: totalMatch ? totalMatch[1] : null,
  };
}

/**
 * 获取当前可见的目录统计弹窗
 */
async function findStatsDialog(page, folderName) {
  const expectedDir = `generated/${folderName}/`;
  const dialogs = page.locator('[role="dialog"]');
  const count = await dialogs.count();

  for (let i = 0; i < count; i++) {
    const dialog = dialogs.nth(i);
    if (!(await dialog.isVisible().catch(() => false))) continue;

    const text = await dialog.textContent().catch(() => '');
    if (!text || !text.includes('目录统计') || !text.includes('对象总数')) continue;

    const stats = extractStats(text);
    console.log(`检测到统计弹窗: 当前目录=${stats.currentDir || '未识别'}, 对象总数=${stats.total || '未识别'}`);

    if (stats.currentDir === expectedDir && stats.total !== null) {
      return { dialog, stats };
    }
  }

  return null;
}

/**
 * 关闭所有可见的目录统计弹窗，避免读取上一次日期的残留结果
 */
async function closeStatsDialogs(page) {
  for (let i = 0; i < 5; i++) {
    const dialog = page.locator('[role="dialog"]:has-text("目录统计")').first();
    if (!(await dialog.isVisible().catch(() => false))) return;

    const text = await dialog.textContent().catch(() => '');
    const stats = extractStats(text);
    console.log(`关闭残留统计弹窗: 当前目录=${stats.currentDir || '未识别'}`);

    const closeBtn = dialog
      .locator('button:has-text("取消"), button:has-text("关闭"), .next-dialog-close, [aria-label="Close"]')
      .first();

    if (await closeBtn.isVisible().catch(() => false)) {
      await closeBtn.click();
    } else {
      await page.keyboard.press('Escape');
    }

    await page.waitForTimeout(800);
  }

  if (await page.locator('[role="dialog"]:has-text("目录统计")').first().isVisible().catch(() => false)) {
    throw new Error('目录统计弹窗关闭失败');
  }
}

/**
 * 点击统计按钮并提取对象总数
 */
async function clickStatsAndExtract(page, statsBtn, dateInfo) {
  if (!(await statsBtn.isVisible().catch(() => false))) {
    throw new Error('统计按钮不可见');
  }

  await closeStatsDialogs(page);

  // 滚动到统计按钮位置，确保可见
  await statsBtn.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  console.log('点击统计按钮...');
  // 使用 force: true 强制点击
  await statsBtn.click({ force: true });
  console.log('已点击统计按钮，等待弹窗...');

  const deadline = Date.now() + 30000;
  let matchedDialog = null;

  while (Date.now() < deadline) {
    matchedDialog = await findStatsDialog(page, dateInfo.folderName);
    if (matchedDialog) break;
    await page.waitForTimeout(500);
  }

  await page.screenshot({ path: `debug-stats-${dateInfo.folderName}.png` });

  if (!matchedDialog) {
    throw new Error(`未找到匹配 ${dateInfo.folderName} 的目录统计弹窗`);
  }

  console.log(`对象总数: ${matchedDialog.stats.total}`);
  return matchedDialog.stats.total;
}

async function main() {
  console.log('=== 阿里云OSS 数据抓取脚本 ===\n');

  const missingDates = getMissingDates();

  if (missingDates.length === 0) {
    console.log('没有需要采集的日期，数据已是最新！');
    return;
  }

  console.log(`检测到 ${missingDates.length} 个缺失日期需要采集：`);
  missingDates.forEach(d => console.log(`  - ${d.formatted} (文件夹: ${d.folderName})`));
  console.log('');

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
    await page.goto(CONFIG.url, { waitUntil: 'networkidle', timeout: CONFIG.timeout });
    await page.waitForTimeout(2000);

    await waitForLogin(page, context);
    await navigateToFolder(page);

    for (let i = 0; i < missingDates.length; i++) {
      const dateInfo = missingDates[i];
      console.log(`\n[${i + 1}/${missingDates.length}] 采集日期: ${dateInfo.formatted}`);
      console.log(`文件夹名: ${dateInfo.folderName}`);

      try {
        const { targetRow, statsBtn } = await findDateAndClickStats(page, dateInfo);
        const rowText = await targetRow.textContent().catch(() => '');
        console.log(`目标行文本: ${rowText.replace(/\s+/g, ' ').trim()}`);
        const count = await clickStatsAndExtract(page, statsBtn, dateInfo);

        if (count !== null) {
          writeToExcel(dateInfo.formatted, count);
        }

        await closeStatsDialogs(page);
      } catch (err) {
        const message = err && err.message ? err.message : String(err);
        console.log(`日期 ${dateInfo.formatted} 采集失败: ${message}`);
        if (message.includes('未找到日期文件夹')) {
          const pageText = await page.locator('body').innerText().catch(() => '');
          if (shouldAutoWriteZeroForMissingFolder(pageText, dateInfo.folderName)) {
            writeToExcel(dateInfo.formatted, 0);
            console.log(`已确认列表加载完成且目标文件夹不存在，自动写入0: ${dateInfo.formatted}`);
          } else {
            throw new Error(`页面未完成加载或目标文件夹可能存在，禁止自动写入0: ${dateInfo.folderName}`);
          }
        }
      }

      if (i < missingDates.length - 1) {
        console.log('等待2秒后继续下一个日期...');
        await page.waitForTimeout(2000);
      }
    }
  } catch (error) {
    console.error('\n出错:', error.message);
    process.exitCode = 1;
    await page.screenshot({ path: 'error-screenshot.png' });
  } finally {
    await browser.close();
    console.log(process.exitCode ? '\n采集失败' : '\n全部完成');
  }
}

main();
