const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const XLSX = require('xlsx');
const Module = require('node:module');

const repoRoot = process.cwd();
process.env.NODE_PATH = path.join(repoRoot, 'node_modules');
Module._initPaths();

function makeTempDir(name) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `${name}-`));
}

function writeWorkbook(filePath, rows) {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, filePath);
}

function copyScript(source, targetDir) {
  fs.mkdirSync(targetDir, { recursive: true });
  const target = path.join(targetDir, path.basename(source));
  fs.copyFileSync(path.join(repoRoot, source), target);
  return target;
}

test('api123-crawler should use apimart overview page and convert USD quota to CNY by multiplying by 7', () => {
  const { CONFIG, convertQuotaToDailyCost } = require(path.join(
    repoRoot,
    'api123-crawler',
    'api123-crawler.js'
  ));

  assert.equal(CONFIG.url, 'https://apimart.ai/zh/overview');
  assert.equal(CONFIG.exchangeRate, 7);
  assert.equal(convertQuotaToDailyCost('6.6'), '46.20');
  assert.equal(convertQuotaToDailyCost('5'), '35.00');
  assert.equal(convertQuotaToDailyCost('0'), '0.00');
});

test('api123-crawler should provide timestamp range for one local day', () => {
  const { formatDateInfo } = require(path.join(repoRoot, 'api123-crawler', 'api123-crawler.js'));

  const dateInfo = formatDateInfo(new Date(2026, 4, 7));

  assert.equal(dateInfo.formatted, '2026/5/7');
  assert.equal(dateInfo.startTime, '2026-05-07 00:00:00');
  assert.equal(dateInfo.endTime, '2026-05-08 00:00:00');
  assert.equal(dateInfo.endTimestamp - dateInfo.startTimestamp, 86399);
});

test('apimart date filter should use custom range instead of yesterday shortcut', () => {
  const {
    CUSTOM_DATE_FILTER_SELECTORS,
    buildCalendarTarget,
    buildDateRangeInputValues,
    getCalendarMonthDelta,
  } = require(path.join(repoRoot, 'api123-crawler', 'apimart-date-filter.js'));

  assert.equal(CUSTOM_DATE_FILTER_SELECTORS.some((selector) => selector.includes('自定义')), true);
  assert.equal(CUSTOM_DATE_FILTER_SELECTORS.some((selector) => selector.includes('昨天')), false);
  assert.equal(CUSTOM_DATE_FILTER_SELECTORS.some((selector) => selector.includes('昨日')), false);
  assert.deepEqual(buildCalendarTarget({ formatted: '2026/5/7' }), {
    year: 2026,
    month: 5,
    dayText: '7',
  });
  assert.equal(getCalendarMonthDelta({ year: 2026, month: 5 }, { year: 2026, month: 4 }), -1);
  assert.equal(getCalendarMonthDelta({ year: 2026, month: 5 }, { year: 2026, month: 7 }), 2);
  assert.deepEqual(
    buildDateRangeInputValues({
      startTime: '2026-05-07 00:00:00',
      endTime: '2026-05-08 00:00:00',
    }),
    ['2026-05-07 00:00:00', '2026-05-08 00:00:00']
  );
});

test('apimart dashboard helper should extract statistics quota from API payload', () => {
  const { extractQuotaFromDashboardData } = require(path.join(
    repoRoot,
    'api123-crawler',
    'apimart-dashboard.js'
  ));

  assert.equal(extractQuotaFromDashboardData({ success: true, data: { stat_quota: 3.21 } }), '3.21');
  assert.equal(extractQuotaFromDashboardData({ success: true, data: { stat_quota: 0 } }), '0');
  assert.equal(extractQuotaFromDashboardData({ success: true, data: {} }), null);
});

test('apimart dashboard helper should extract statistics quota from visible page text', () => {
  const { extractQuotaFromPageText } = require(path.join(
    repoRoot,
    'api123-crawler',
    'apimart-dashboard.js'
  ));

  assert.equal(extractQuotaFromPageText('资源消耗\n统计额度\n$12.34'), '12.34');
  assert.equal(extractQuotaFromPageText('统计额度 1,234.56 USD'), '1234.56');
  assert.equal(extractQuotaFromPageText('今日请求数 100'), null);
});

test('apimart dashboard helper should treat token field as logged in auth info', () => {
  const { getAuthInfoFromRawUser } = require(path.join(
    repoRoot,
    'api123-crawler',
    'apimart-dashboard.js'
  ));

  assert.deepEqual(getAuthInfoFromRawUser(JSON.stringify({ id: 12, token: 'abc' })), {
    token: 'abc',
    userId: '12',
  });
  assert.deepEqual(getAuthInfoFromRawUser(JSON.stringify({ id: 13, access_token: 'def' })), {
    token: 'def',
    userId: '13',
  });
  assert.equal(getAuthInfoFromRawUser(JSON.stringify({ id: 14 })), null);
});

test('apimart dashboard helper should build auth headers without page-side fetch side effects', () => {
  const { buildAuthHeaders, isLoginPageUrl, isSuccessfulDashboardProbe } = require(path.join(
    repoRoot,
    'api123-crawler',
    'apimart-dashboard.js'
  ));

  assert.deepEqual(buildAuthHeaders(JSON.stringify({ id: 12, token: 'abc' })), {
    'Content-Type': 'application/json',
    Authorization: 'Bearer abc',
    'New-Api-User': '12',
    'New-API-User': '12',
  });
  assert.deepEqual(buildAuthHeaders(null), { 'Content-Type': 'application/json' });
  assert.deepEqual(buildAuthHeaders(JSON.stringify({ id: 15, access_token: null })), {
    'Content-Type': 'application/json',
    'New-Api-User': '15',
    'New-API-User': '15',
  });
  assert.equal(isLoginPageUrl('https://apimart.ai/zh/login'), true);
  assert.equal(isLoginPageUrl('https://apimart.ai/zh'), false);
  assert.equal(isSuccessfulDashboardProbe({ ok: true, status: 200, payload: { success: true } }), true);
  assert.equal(isSuccessfulDashboardProbe({ ok: false, status: 401, payload: {} }), false);
});

test('api123-crawler should refresh yesterday when existing value is zero', () => {
  const tempDir = makeTempDir('api123-refresh-zero');
  const scriptDir = path.join(tempDir, 'api123-crawler');
  copyScript('api123-crawler/api123-crawler.js', scriptDir);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const olderDate = new Date(today);
  olderDate.setDate(olderDate.getDate() - 2);
  const format = (date) => `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;

  writeWorkbook(path.join(tempDir, '每日数据整理.xlsx'), [
    ['日期', '向量引擎消费', 'ZIKL', '糖果姐姐api', 'APIMart', '总生图数'],
    [format(olderDate), '1', '2', '3', '0.00', '10'],
    [format(yesterday), '1', '2', '3', '0.00', '10'],
  ]);

  const { getMissingDates } = require(path.join(scriptDir, 'api123-crawler.js'));

  assert.deepEqual(getMissingDates().map((dateInfo) => dateInfo.formatted), [format(yesterday)]);
});
