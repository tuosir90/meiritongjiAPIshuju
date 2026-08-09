/**
 * ZIKL 数据看板消费查询运行器。
 *
 * 已观察到的数据链路：刷新会话后调用 /api/data/self，汇总响应中的 quota。
 */

const { chromium } = require('playwright');

const DEFAULT_QUOTA_PER_UNIT = 500000;
const REFRESH_PATH = '/api/user/auth/refresh';
const STATUS_PATH = '/api/status';
const DATA_PATH = '/api/data/self';

function buildDataPath(dateInfo) {
  const params = new URLSearchParams({
    start_timestamp: String(dateInfo.startTimestamp),
    end_timestamp: String(dateInfo.endTimestamp),
    default_time: 'hour',
  });

  return `${DATA_PATH}?${params.toString()}`;
}

function sumQuota(records) {
  return records.reduce((total, record) => {
    const quota = Number(record?.quota);
    return Number.isFinite(quota) ? total + quota : total;
  }, 0);
}

function calculateRawAmount(records, quotaPerUnit) {
  const normalizedQuotaPerUnit = Number(quotaPerUnit);
  if (!Number.isFinite(normalizedQuotaPerUnit) || normalizedQuotaPerUnit <= 0) {
    throw new Error(`无效的 quota_per_unit: ${quotaPerUnit}`);
  }

  return sumQuota(records) / normalizedQuotaPerUnit;
}

async function isDashboardReady(page) {
  return page.locator('a[href="/dashboard/models"]').first().isVisible().catch(() => false);
}

async function waitForLogin(page, context, storageFile) {
  if (await isDashboardReady(page)) {
    console.log('已登录状态');
    await context.storageState({ path: storageFile });
    console.log('登录状态已保存到:', storageFile);
    return;
  }

  console.log('等待手动登录...(登录成功后会自动继续)');
  for (let attempt = 0; attempt < 120; attempt += 1) {
    await page.waitForTimeout(2000);
    if (await isDashboardReady(page)) {
      console.log('检测到登录成功！');
      await context.storageState({ path: storageFile });
      console.log('登录状态已保存到:', storageFile);
      return;
    }
  }

  throw new Error('登录超时（4分钟）');
}

async function openDataDashboard(page) {
  const dataDashboardLink = page.locator('a[href="/dashboard/models"]').first();
  await dataDashboardLink.waitFor({ state: 'visible', timeout: 30000 });

  if (!/\/dashboard\/models(?:[/?#]|$)/.test(page.url())) {
    await Promise.all([
      page.waitForURL(/\/dashboard\/models(?:[/?#]|$)/, { timeout: 30000 }),
      dataDashboardLink.click(),
    ]);
  }

  await page.waitForTimeout(500);
}

async function fetchConsumptionData(page, dateInfo) {
  const dataPath = buildDataPath(dateInfo);
  const result = await page.evaluate(async ({ refreshPath, statusPath, requestPath, fallbackQuotaPerUnit }) => {
    const refreshResponse = await fetch(refreshPath, {
      method: 'POST',
      credentials: 'include',
    });
    const refreshPayload = await refreshResponse.json().catch(() => null);
    const accessToken = refreshPayload?.data?.access_token;

    if (!refreshResponse.ok || !accessToken) {
      return {
        success: false,
        stage: 'refresh',
        status: refreshResponse.status,
        message: refreshPayload?.message || '未获取到 access token',
      };
    }

    const statusResponse = await fetch(statusPath, { credentials: 'include' });
    const statusPayload = await statusResponse.json().catch(() => null);
    const dataResponse = await fetch(requestPath, {
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const dataPayload = await dataResponse.json().catch(() => null);

    return {
      success: dataResponse.ok && dataPayload?.success === true,
      stage: 'data',
      status: dataResponse.status,
      message: dataPayload?.message || '',
      records: Array.isArray(dataPayload?.data) ? dataPayload.data : [],
      quotaPerUnit: Number(statusPayload?.data?.quota_per_unit) || fallbackQuotaPerUnit,
    };
  }, {
    refreshPath: REFRESH_PATH,
    statusPath: STATUS_PATH,
    requestPath: dataPath,
    fallbackQuotaPerUnit: DEFAULT_QUOTA_PER_UNIT,
  });

  if (!result.success) {
    throw new Error(`ZIKL 接口${result.stage}失败 (HTTP ${result.status}): ${result.message || '未知错误'}`);
  }

  const records = result.records.filter((record) => {
    const createdAt = Number(record?.created_at);
    return !Number.isFinite(createdAt)
      || (createdAt >= dateInfo.startTimestamp && createdAt < dateInfo.endTimestamp);
  });
  const rawQuota = sumQuota(records);
  const rawAmount = calculateRawAmount(records, result.quotaPerUnit);

  return {
    dataPath,
    records,
    rawQuota,
    rawAmount,
    quotaPerUnit: result.quotaPerUnit,
  };
}

async function runZiklDashboardCrawler(options) {
  console.log(`=== ${options.title} ===\n`);

  const dates = options.getDatesToCollect();
  if (dates.length === 0) {
    console.log('没有需要采集的日期，数据已是最新！');
    return [];
  }

  console.log(`检测到 ${dates.length} 个缺失日期需要采集：`);
  dates.forEach((dateInfo) => console.log(`  - ${dateInfo.formatted}`));
  console.log('');

  const browser = await chromium.launch({ headless: options.config.headless });
  const storageFile = options.getStorageFile
    ? options.getStorageFile()
    : options.config.storageFile;
  const context = options.hasStoredAuth()
    ? await browser.newContext({ storageState: storageFile })
    : await browser.newContext();
  const page = await context.newPage();

  try {
    console.log(options.hasStoredAuth() ? '检测到已保存的登录状态，正在加载...' : '首次运行，请在浏览器中手动登录...');
    await page.goto(options.config.url, {
      waitUntil: 'domcontentloaded',
      timeout: options.config.timeout,
    });
    await waitForLogin(page, context, storageFile);
    await openDataDashboard(page);

    const results = [];
    for (let index = 0; index < dates.length; index += 1) {
      const dateInfo = dates[index];
      console.log(`\n[${index + 1}/${dates.length}] 采集日期: ${dateInfo.formatted}`);
      console.log(`查询范围: ${dateInfo.startTime} ~ ${dateInfo.endTime}`);

      const consumption = await fetchConsumptionData(page, dateInfo);
      const finalAmount = options.formatAmount(consumption.rawAmount);
      const apiUrl = new URL(consumption.dataPath, options.config.url).href;

      console.log(`数据接口: GET ${apiUrl}`);
      console.log(`接口记录数: ${consumption.records.length}`);
      console.log(`原始 quota: ${consumption.rawQuota}，quota_per_unit: ${consumption.quotaPerUnit}`);
      console.log(options.describeAmount(consumption.rawAmount, finalAmount));

      if (options.dryRun) {
        console.log(`试运行：未写入 Excel（日期: ${dateInfo.formatted}, ZIKL: ${finalAmount}）`);
      } else {
        options.writeToExcel(dateInfo.formatted, finalAmount);
      }

      results.push({ dateInfo, consumption, finalAmount });
    }

    await context.storageState({ path: storageFile });
    console.log('登录状态已更新:', storageFile);
    return results;
  } catch (error) {
    await page.screenshot({ path: 'zikl-error-screenshot.png' }).catch(() => {});
    throw error;
  } finally {
    await browser.close();
  }
}

module.exports = {
  DEFAULT_QUOTA_PER_UNIT,
  buildDataPath,
  sumQuota,
  calculateRawAmount,
  fetchConsumptionData,
  runZiklDashboardCrawler,
};
