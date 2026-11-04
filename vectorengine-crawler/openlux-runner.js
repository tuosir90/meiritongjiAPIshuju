/** OpenLux 已登录浏览器会话的消费查询；只输出统计值，不输出登录凭据。 */
const { chromium } = require('playwright');
const { launchChromium } = require('../scripts/browser-launcher');

function summarizeUsage(result) {
  if (result.statusHttp !== 200 || !result.statusSuccess ||
      result.dataHttp !== 200 || !result.dataSuccess) {
    throw new Error('OpenLux认证或统计接口失败，停止写入');
  }
  const quotaPerUnit = Number(result.quotaPerUnit);
  if (!Number.isFinite(quotaPerUnit) || quotaPerUnit <= 0 || !Array.isArray(result.quotas)) {
    throw new Error('OpenLux统计响应格式无效，停止写入');
  }
  if (!result.quotas.every(value => typeof value === 'number' && Number.isFinite(value) && value >= 0)) {
    throw new Error('OpenLux quota无效，停止写入');
  }
  const quota = result.quotas.reduce((sum, value) => sum + value, 0);
  const raw = quota / quotaPerUnit;
  return { records: result.quotas.length, quota, quotaPerUnit, raw, amount: (raw * 8).toFixed(2) };
}

async function fetchUsage(page, dateInfo) {
  const start = Math.floor(new Date(dateInfo.startTime.replace(' ', 'T')).getTime() / 1000);
  const end = Math.floor(new Date(dateInfo.endTime.replace(' ', 'T')).getTime() / 1000);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    throw new Error('OpenLux查询日期无效');
  }
  return page.evaluate(async ({ start, end }) => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user?.id) throw new Error('OpenLux缺少登录用户状态，请重新登录');
    const statusResponse = await fetch('/api/status', { credentials: 'include' });
    const status = await statusResponse.json();
    const params = new URLSearchParams({ start_timestamp: String(start),
      end_timestamp: String(end), default_time: 'hour' });
    const dataResponse = await fetch(`/api/data/self?${params}`, {
      credentials: 'include', headers: { 'New-Api-User': String(user.id) },
    });
    const data = await dataResponse.json();
    return { statusHttp: statusResponse.status, statusSuccess: status.success,
      quotaPerUnit: status.data?.quota_per_unit, dataHttp: dataResponse.status,
      dataSuccess: data.success, quotas: Array.isArray(data.data) ? data.data.map(row => row.quota) : null };
  }, { start, end });
}

async function runOpenLuxCrawler({ config, getMissingDates, hasStoredAuth, writeToExcel }) {
  console.log('=== 向量引擎 OpenLux 数据抓取 ===');
  const dates = getMissingDates();
  if (!dates.length) {
    console.log('没有需要采集的日期，数据已是最新！');
    return;
  }
  console.log('待采日期:', dates.map(date => date.formatted).join(', '));
  const browser = await launchChromium(chromium, { headless: config.headless });
  try {
    const context = await browser.newContext(hasStoredAuth() ? { storageState: config.storageFile } : {});
    const page = await context.newPage();
    await page.goto(config.url, { waitUntil: 'domcontentloaded', timeout: config.timeout });
    const dashboard = page.locator('a[href="/console/dashboard"]').first();
    if (!await dashboard.isVisible().catch(() => false)) {
      console.log('等待登录态恢复或手动登录...(登录成功后自动继续)');
      await dashboard.waitFor({ state: 'visible', timeout: 240000 });
    }
    console.log('检测到OpenLux登录成功');
    await context.storageState({ path: config.storageFile });
    console.log('Cookie及登录态已保存:', config.storageFile);
    await dashboard.click();
    await page.waitForURL('**/console/dashboard');
    for (const date of dates) {
      console.log(`采集日期: ${date.formatted}，范围: ${date.startTime} ~ ${date.endTime}`);
      const result = summarizeUsage(await fetchUsage(page, date));
      console.log(`接口记录数: ${result.records}，quota: ${result.quota}，quota_per_unit: ${result.quotaPerUnit}`);
      console.log(`原始金额: ${result.raw}，倍率: 8，写入值: ${result.amount}`);
      writeToExcel(date.formatted, result.amount);
    }
    await context.storageState({ path: config.storageFile });
    console.log('向量引擎OpenLux采集完成');
  } finally {
    await browser.close();
  }
}

module.exports = { summarizeUsage, runOpenLuxCrawler };
