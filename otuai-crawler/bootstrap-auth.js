/**
 * 一次性脚本：打开章鱼哥AI 登录页，等你手动登录，保存 auth.json
 * 用法：node bootstrap-auth.js
 *
 * 登录账号：tuosir / VzcsNraqJ.2PJ.a
 */

const { chromium } = require('playwright');
const { CONFIG } = require('./otuai-crawler');

(async () => {
  console.log('=== 章鱼哥AI 登录态引导 ===\n');
  console.log('即将打开:', CONFIG.url);
  console.log('请在浏览器中登录（tuosir / VzcsNraqJ.2PJ.a），登录成功后脚本自动保存登录态。\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(CONFIG.url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    const isLoggedIn = () => {
      const url = page.url();
      return url.includes('/console') && !url.includes('/login');
    };

    for (let i = 0; i < 120; i++) {
      await page.waitForTimeout(2000);
      if (isLoggedIn()) {
        await context.storageState({ path: CONFIG.storageFile });
        console.log('✓ 检测到登录成功，已保存到:', CONFIG.storageFile);
        return;
      }
    }
    console.log('✗ 4 分钟内未检测到登录成功，退出');
  } catch (err) {
    console.error('出错:', err.message);
  } finally {
    await browser.close();
  }
})();
