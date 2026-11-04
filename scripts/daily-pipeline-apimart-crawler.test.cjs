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

test('apimart network helper should add an opt-in Chromium host resolver rule', () => {
  const { buildChromiumLaunchOptions } = require(path.join(
    repoRoot,
    'api123-crawler',
    'apimart-network.js'
  ));

  assert.deepEqual(buildChromiumLaunchOptions({}), {});
  assert.deepEqual(buildChromiumLaunchOptions({ APIMART_HOST_RESOLVER_IP: '172.67.70.35' }), {
    args: ['--host-resolver-rules=MAP apimart.ai 172.67.70.35,EXCLUDE localhost'],
  });
  assert.throws(
    () => buildChromiumLaunchOptions({ APIMART_HOST_RESOLVER_IP: 'not-an-ip' }),
    /valid IPv4 address/
  );
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

test('api123-crawler should only collect yesterday when older APIMart rows are blank', () => {
  const tempDir = makeTempDir('api123-yesterday-only');
  const scriptDir = path.join(tempDir, 'api123-crawler');
  copyScript('api123-crawler/api123-crawler.js', scriptDir);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const gapDate = new Date(today);
  gapDate.setDate(gapDate.getDate() - 2);
  const trackingStart = new Date(today);
  trackingStart.setDate(trackingStart.getDate() - 3);
  const historicalDate = new Date(today);
  historicalDate.setDate(historicalDate.getDate() - 4);
  const format = (date) => `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;

  writeWorkbook(path.join(tempDir, '每日数据整理.xlsx'), [
    ['日期', '向量引擎消费', 'ZIKL', '糖果姐姐api', 'APIMart', '总生图数'],
    [format(historicalDate), '1', '2', '3', '', '10'],
    [format(trackingStart), '1', '2', '3', '1.00', '10'],
    [format(gapDate), '1', '2', '3', '', '10'],
    [format(yesterday), '1', '2', '3', '', '10'],
  ]);

  const { getMissingDates } = require(path.join(scriptDir, 'api123-crawler.js'));

  assert.deepEqual(
    getMissingDates().map((dateInfo) => dateInfo.formatted),
    [format(yesterday)]
  );
});

test('api123-crawler should backfill older blank APIMart rows with zero', () => {
  const tempDir = makeTempDir('api123-backfill-zero');
  const scriptDir = path.join(tempDir, 'api123-crawler');
  copyScript('api123-crawler/api123-crawler.js', scriptDir);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const historicalDate = new Date(today);
  historicalDate.setDate(historicalDate.getDate() - 2);
  const format = (date) => `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
  const workbookPath = path.join(tempDir, '每日数据整理.xlsx');

  writeWorkbook(workbookPath, [
    ['日期', '向量引擎消费', 'ZIKL', '糖果姐姐api', 'APIMart', '总生图数'],
    [format(historicalDate), '1', '2', '3', '', '10'],
    [format(yesterday), '1', '2', '3', '', '10'],
  ]);

  const { backfillHistoricalBlanksWithZero } = require(path.join(
    scriptDir,
    'api123-crawler.js'
  ));
  const result = backfillHistoricalBlanksWithZero();
  const workbook = XLSX.readFile(workbookPath);
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 });

  assert.deepEqual(result.dates, [format(historicalDate)]);
  assert.equal(rows[1][4], '0.00');
  assert.equal(String(rows[2][4] ?? ''), '');
});

function makeNoticeDialogPage(dialogText, visibleDismissSelector) {
  const state = { open: true, clicked: [], queried: [] };
  const dialog = {
    async innerText() {
      return dialogText;
    },
    locator(selector) {
      state.queried.push(selector);
      return {
        first() {
          return {
            async isVisible() {
              return state.open && selector === visibleDismissSelector;
            },
            async click() {
              state.clicked.push(selector);
              state.open = false;
            },
          };
        },
      };
    },
  };
  const page = {
    locator(selector) {
      return {
        async count() {
          return state.open && selector === '[role="dialog"]:visible' ? 1 : 0;
        },
        nth() {
          return dialog;
        },
      };
    },
    async waitForTimeout() {},
  };

  return { page, state };
}

test('apimart date filter should acknowledge blocking notice dialog before custom range', async () => {
  const { dismissBlockingNoticeDialogs } = require(path.join(
    repoRoot,
    'api123-crawler',
    'apimart-date-filter.js'
  ));
  const { page, state } = makeNoticeDialogPage(
    'API Key 安全更新提醒\n尊敬的 APIMart 用户：\n我已知晓\n前往 API Key 管理',
    'button:has-text("我已知晓")'
  );

  assert.equal(await dismissBlockingNoticeDialogs(page), true);
  assert.deepEqual(state.clicked, ['button:has-text("我已知晓")']);
  assert.equal(state.queried.some((selector) => selector.includes('前往')), false);
});

test('apimart date filter should leave non-notice dialogs untouched', async () => {
  const { dismissBlockingNoticeDialogs } = require(path.join(
    repoRoot,
    'api123-crawler',
    'apimart-date-filter.js'
  ));
  const { page, state } = makeNoticeDialogPage('选择日期\n确定', 'button:has-text("我已知晓")');

  assert.equal(await dismissBlockingNoticeDialogs(page), false);
  assert.deepEqual(state.clicked, []);
});
