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

const {
  collectWithReadonlyApi,
  countPrefixObjects,
  describeError,
  getReadonlyCredentials,
  parseRegQueryValue,
  pickPositiveControl,
} = require(path.join(repoRoot, 'aliyun-oss-crawler/oss-api-counter.js'));

// 测试里一律注入空的用户级变量读取器，绝不读取本机真实 Key（断言失败时会打印实际值）
const noUserEnv = () => '';

function fakeClient(pagesByPrefix, calls = []) {
  return {
    async listV2(query) {
      calls.push(query);
      const pages = pagesByPrefix[query.prefix] || [[]];
      const index = query['continuation-token'] ? Number(query['continuation-token']) : 0;
      return {
        objects: pages[index].map((name) => ({ name })),
        isTruncated: index < pages.length - 1,
        nextContinuationToken: index < pages.length - 1 ? String(index + 1) : undefined,
      };
    },
  };
}

const record = (folderName, value) => ({
  dateInfo: { folderName, formatted: folderName.replace(/-0?/g, '/') },
  time: new Date(`${folderName}T00:00:00`).getTime(),
  value,
});

test('只读取专用只读变量，两个都有才算配置', () => {
  assert.equal(getReadonlyCredentials({ OSS_ACCESS_KEY_ID: 'other', OSS_ACCESS_KEY_SECRET: 'other' }, noUserEnv), null);
  assert.equal(getReadonlyCredentials({ OSS_READONLY_ACCESS_KEY_ID: 'id' }, noUserEnv), null);
  assert.deepEqual(
    getReadonlyCredentials({ OSS_READONLY_ACCESS_KEY_ID: ' id ', OSS_READONLY_ACCESS_KEY_SECRET: ' secret ' }, noUserEnv),
    { accessKeyId: 'id', accessKeySecret: 'secret' },
  );
});

test('进程里没有变量时回退读取用户级环境变量，进程变量优先', () => {
  const fake = { OSS_READONLY_ACCESS_KEY_ID: 'user-id', OSS_READONLY_ACCESS_KEY_SECRET: 'user-secret' };
  const reader = (name) => fake[name] || '';
  assert.deepEqual(getReadonlyCredentials({}, reader), { accessKeyId: 'user-id', accessKeySecret: 'user-secret' });
  assert.deepEqual(getReadonlyCredentials({ OSS_READONLY_ACCESS_KEY_ID: 'proc-id' }, reader), { accessKeyId: 'proc-id', accessKeySecret: 'user-secret' });
  assert.equal(getReadonlyCredentials({}, () => ''), null);
});

test('parseRegQueryValue 解析 reg query 输出', () => {
  const output = '\r\nHKEY_CURRENT_USER\\Environment\r\n    OSS_READONLY_ACCESS_KEY_ID    REG_SZ    FAKEID123\r\n\r\n';
  assert.equal(parseRegQueryValue(output, 'OSS_READONLY_ACCESS_KEY_ID'), 'FAKEID123');
  assert.equal(parseRegQueryValue('    X    REG_EXPAND_SZ    abc', 'X'), 'abc');
  assert.equal(parseRegQueryValue('ERROR: not found', 'OSS_READONLY_ACCESS_KEY_ID'), '');
  assert.equal(parseRegQueryValue('    OSS_READONLY_ACCESS_KEY_ID_OLD    REG_SZ    nope', 'OSS_READONLY_ACCESS_KEY_ID'), '');
});

test('countPrefixObjects 逐页累加并排除目录占位对象', async () => {
  const calls = [];
  const client = fakeClient({
    'generated/2026-11-02/': [
      ['generated/2026-11-02/', 'generated/2026-11-02/a.png', 'generated/2026-11-02/b.png'],
      ['generated/2026-11-02/sub/c.png'],
    ],
  }, calls);
  assert.equal(await countPrefixObjects(client, '2026-11-02'), 3);
  assert.equal(calls.length, 2);
  assert.equal(calls[1]['continuation-token'], '1');
  assert.equal(calls[0]['max-keys'], 1000);
});

test('countPrefixObjects 遇到截断但没有 token 时报错', async () => {
  const client = { listV2: async () => ({ objects: [{ name: 'x' }], isTruncated: true }) };
  await assert.rejects(() => countPrefixObjects(client, '2026-11-02'), /continuation token/);
});

test('pickPositiveControl 取最近的正整数记录', () => {
  const control = pickPositiveControl([record('2026-10-31', 1200), record('2026-11-02', 1469), record('2026-11-01', 0), { ...record('2026-11-03', NaN) }]);
  assert.equal(control.dateInfo.folderName, '2026-11-02');
  assert.equal(pickPositiveControl([record('2026-11-01', 0)]), null);
});

test('describeError 只输出错误码和状态码', () => {
  assert.equal(describeError({ code: 'AccessDenied', status: 403, message: 'detail with id' }), 'AccessDenied（HTTP 403）');
  assert.equal(describeError(new Error('first\nsecond')), 'first');
});

test('未配置只读 Key 时不建客户端、不写 Excel，交回浏览器流程', async () => {
  let made = false;
  const writes = [];
  const handled = await collectWithReadonlyApi({
    missingDates: [{ formatted: '2026/11/3', folderName: '2026-11-03' }],
    credentials: null,
    getRecordedCounts: () => [record('2026-11-02', 1469)],
    writeToExcel: (...args) => writes.push(args),
    makeClient: () => { made = true; },
    log: () => {},
  });
  assert.equal(handled, false);
  assert.equal(made, false);
  assert.deepEqual(writes, []);
});

test('阳性对照不一致时不写 Excel，交回浏览器流程', async () => {
  const writes = [];
  const logs = [];
  const handled = await collectWithReadonlyApi({
    missingDates: [{ formatted: '2026/11/3', folderName: '2026-11-03' }],
    credentials: { accessKeyId: 'id', accessKeySecret: 'secret' },
    getRecordedCounts: () => [record('2026-11-02', 1469)],
    writeToExcel: (...args) => writes.push(args),
    makeClient: () => fakeClient({ 'generated/2026-11-02/': [['generated/2026-11-02/a.png']] }),
    log: (line) => logs.push(line),
  });
  assert.equal(handled, false);
  assert.deepEqual(writes, []);
  assert.ok(logs.some((line) => line.includes('阳性对照不一致') && line.includes('Excel=1469') && line.includes('API=1')));
});

test('没有可用对照、或对照阶段接口报错时交回浏览器流程，日志不含 Key', async () => {
  const base = {
    missingDates: [{ formatted: '2026/11/3', folderName: '2026-11-03' }],
    credentials: { accessKeyId: 'AKID-SHOULD-NOT-LEAK', accessKeySecret: 'SECRET-SHOULD-NOT-LEAK' },
    writeToExcel: () => assert.fail('不应写入'),
  };
  const logs = [];
  assert.equal(await collectWithReadonlyApi({ ...base, getRecordedCounts: () => [record('2026-11-01', 0)], log: (l) => logs.push(l) }), false);
  const failing = { listV2: async () => { const e = new Error('The OSS Access Key Id you provided does not exist'); e.code = 'InvalidAccessKeyId'; e.status = 403; throw e; } };
  assert.equal(await collectWithReadonlyApi({ ...base, getRecordedCounts: () => [record('2026-11-02', 1469)], makeClient: () => failing, log: (l) => logs.push(l) }), false);
  assert.ok(logs.some((line) => line.includes('InvalidAccessKeyId（HTTP 403）')));
  assert.ok(logs.every((line) => !line.includes('SHOULD-NOT-LEAK')));
});

test('对照通过后逐日写入 API 统计值', async () => {
  const pages = {
    'generated/2026-11-02/': [Array.from({ length: 1469 }, (_, i) => `generated/2026-11-02/${i}.png`)],
    'generated/2026-11-03/': [Array.from({ length: 1000 }, (_, i) => `generated/2026-11-03/${i}.png`), ['generated/2026-11-03/last.png']],
  };
  const writes = [];
  const handled = await collectWithReadonlyApi({
    missingDates: [{ formatted: '2026/11/3', folderName: '2026-11-03' }, { formatted: '2026/11/4', folderName: '2026-11-04' }],
    credentials: { accessKeyId: 'id', accessKeySecret: 'secret' },
    getRecordedCounts: () => [record('2026-11-02', 1469)],
    writeToExcel: (...args) => writes.push(args),
    makeClient: () => fakeClient(pages),
    log: () => {},
  });
  assert.equal(handled, true);
  assert.deepEqual(writes, [['2026/11/3', 1001], ['2026/11/4', 0]]);
});

test('对照通过后逐日统计出错时抛出，由入口按采集失败处理', async () => {
  let call = 0;
  const client = { listV2: async () => { call += 1; if (call > 1) throw Object.assign(new Error('timeout'), { code: 'ResponseTimeoutError' }); return { objects: [{ name: 'generated/2026-11-02/a.png' }], isTruncated: false }; } };
  await assert.rejects(() => collectWithReadonlyApi({
    missingDates: [{ formatted: '2026/11/3', folderName: '2026-11-03' }],
    credentials: { accessKeyId: 'id', accessKeySecret: 'secret' },
    getRecordedCounts: () => [record('2026-11-02', 1)],
    writeToExcel: () => assert.fail('不应写入'),
    makeClient: () => client,
    log: () => {},
  }), /timeout/);
});

test('getRecordedCounts 只读取昨天及以前已填写的总生图数', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oss-recorded-'));
  const scriptDir = path.join(tempDir, 'aliyun-oss-crawler');
  fs.mkdirSync(scriptDir, { recursive: true });
  fs.copyFileSync(path.join(repoRoot, 'aliyun-oss-crawler/oss-crawler.js'), path.join(scriptDir, 'oss-crawler.js'));
  const today = new Date();
  const fmt = (d) => `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
  const daysAgo = (n) => { const d = new Date(today); d.setDate(d.getDate() - n); return d; };
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
    ['日期', 'ZIKL', '总生图数'],
    [fmt(daysAgo(3)), '1', 1200],
    [fmt(daysAgo(2)), '1', 0],
    [fmt(daysAgo(1)), '1', ''],
    [fmt(today), '1', 999],
  ]), 'Sheet1');
  XLSX.writeFile(wb, path.join(tempDir, '每日数据整理.xlsx'));
  const { getRecordedCounts } = require(path.join(scriptDir, 'oss-crawler.js'));
  const records = getRecordedCounts();
  assert.deepEqual(records.map((r) => r.value), [1200, 0]);
  assert.equal(pickPositiveControl(records).value, 1200);
});
