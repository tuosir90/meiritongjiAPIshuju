const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
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

function readWorkbook(filePath) {
  const wb = XLSX.readFile(filePath);
  return XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
}

function copyScript(source, targetDir) {
  fs.mkdirSync(targetDir, { recursive: true });
  const target = path.join(targetDir, path.basename(source));
  fs.copyFileSync(path.join(repoRoot, source), target);
  return target;
}

test('sync-daily-data should parse APIMart column and include it in total cost', () => {
  const tempDir = makeTempDir('sync-123api');
  fs.mkdirSync(path.join(tempDir, 'public'), { recursive: true });
  copyScript('sync-daily-data.js', tempDir);

  writeWorkbook(path.join(tempDir, '每日数据整理.xlsx'), [
    ['日期', '向量引擎消费', 'ZIKL', '糖果姐姐api', 'APIMart', '总生图数'],
    ['2026/4/14', '2.92', '12.46', '31.33', '5', '271'],
  ]);

  fs.writeFileSync(
    path.join(tempDir, 'public', 'initial-data.json'),
    JSON.stringify({ version: '1.0.0', apis: [], records: [] }, null, 2),
    'utf8'
  );

  execFileSync('node', ['sync-daily-data.js', '--skip-git'], {
    cwd: tempDir,
    env: {
      ...process.env,
      NODE_PATH: path.join(repoRoot, 'node_modules'),
    },
  });

  const json = JSON.parse(
    fs.readFileSync(path.join(tempDir, 'public', 'initial-data.json'), 'utf8')
  );

  assert.equal(json.records.length, 1);
  assert.deepEqual(json.apis.find((api) => api.id === '123api'), {
    id: '123api',
    name: 'APIMart',
    color: '#f59e0b',
  });
  assert.deepEqual(json.records[0], {
    id: '2026-04-14-1',
    date: '2026-04-14',
    apiCosts: [
      { apiId: 'volcengine', cost: 2.92 },
      { apiId: 'zikl', cost: 12.46 },
      { apiId: 'tangguo', cost: 31.33 },
      { apiId: '123api', cost: 5 },
      { apiId: 'manxiaobai', cost: 0 },
      { apiId: 'xinshijie', cost: 0 },
    ],
    imageCount: 271,
    totalCost: 51.71,
  });
});

test('sync-daily-data should preserve existing historical otuai dates by default', () => {
  const tempDir = makeTempDir('sync-update-123api');
  fs.mkdirSync(path.join(tempDir, 'public'), { recursive: true });
  copyScript('sync-daily-data.js', tempDir);

  writeWorkbook(path.join(tempDir, '每日数据整理.xlsx'), [
    ['日期', '向量引擎消费', 'ZIKL', '糖果姐姐api', 'APIMart', '馒小白', '章鱼哥AI', '总生图数'],
    ['2026/5/22', '2.92', '12.46', '31.33', '5', '1.1', '7.15', '271'],
  ]);

  const existingRecord = {
    id: '2026-05-22-1',
    date: '2026-05-22',
    apiCosts: [
      { apiId: 'volcengine', cost: 2.92 },
      { apiId: 'zikl', cost: 12.46 },
      { apiId: 'tangguo', cost: 31.33 },
      { apiId: '123api', cost: 5 },
      { apiId: 'manxiaobai', cost: 1.1 },
      { apiId: 'otuai', cost: 7.15 },
    ],
    imageCount: 271,
    totalCost: 59.96,
  };

  fs.writeFileSync(
    path.join(tempDir, 'public', 'initial-data.json'),
    JSON.stringify({
      version: '1.0.0',
      apis: [{ id: 'otuai', name: '章鱼哥AI', color: '#06b6d4' }],
      records: [existingRecord],
    }, null, 2),
    'utf8'
  );

  execFileSync('node', ['sync-daily-data.js', '--skip-git'], {
    cwd: tempDir,
    env: {
      ...process.env,
      NODE_PATH: path.join(repoRoot, 'node_modules'),
    },
  });

  const json = JSON.parse(
    fs.readFileSync(path.join(tempDir, 'public', 'initial-data.json'), 'utf8')
  );

  assert.equal(json.version, '1.0.1');
  assert.equal(json.apis.some((api) => api.id === 'otuai'), false);
  assert.equal(json.records[0].totalCost, existingRecord.totalCost);
  assert.equal(json.records[0].apiCosts.find((cost) => cost.apiId === 'otuai').cost, 7.15);
  assert.equal(json.records[0].apiCosts.find((cost) => cost.apiId === 'xinshijie').cost, 0);
});

test('sync-daily-data should add zero xinshijie to protected otuai history without recalculating total', () => {
  const tempDir = makeTempDir('sync-protected-xinshijie');
  fs.mkdirSync(path.join(tempDir, 'public'), { recursive: true });
  copyScript('sync-daily-data.js', tempDir);

  writeWorkbook(path.join(tempDir, '每日数据整理.xlsx'), [
    ['日期', '向量引擎消费', 'ZIKL', '糖果姐姐api', 'APIMart', '馒小白', '新世界API', '章鱼哥AI', '总生图数'],
    ['2026/5/22', '2.92', '12.46', '31.33', '5', '1.1', '', '7.15', '271'],
  ]);

  const existingRecord = {
    id: '2026-05-22-1',
    date: '2026-05-22',
    apiCosts: [
      { apiId: 'volcengine', cost: 2.92 },
      { apiId: 'zikl', cost: 12.46 },
      { apiId: 'tangguo', cost: 31.33 },
      { apiId: '123api', cost: 5 },
      { apiId: 'manxiaobai', cost: 1.1 },
      { apiId: 'otuai', cost: 7.15 },
    ],
    imageCount: 271,
    totalCost: 59.96,
  };

  fs.writeFileSync(
    path.join(tempDir, 'public', 'initial-data.json'),
    JSON.stringify({
      version: '1.0.0',
      apis: [{ id: 'otuai', name: '章鱼哥AI', color: '#06b6d4' }],
      records: [existingRecord],
    }, null, 2),
    'utf8'
  );

  execFileSync('node', ['sync-daily-data.js', '--skip-git'], {
    cwd: tempDir,
    env: {
      ...process.env,
      NODE_PATH: path.join(repoRoot, 'node_modules'),
    },
  });

  const json = JSON.parse(
    fs.readFileSync(path.join(tempDir, 'public', 'initial-data.json'), 'utf8')
  );
  const syncedRecord = json.records[0];

  assert.equal(syncedRecord.totalCost, 59.96);
  assert.equal(syncedRecord.apiCosts.find((cost) => cost.apiId === 'otuai').cost, 7.15);
  assert.equal(syncedRecord.apiCosts.find((cost) => cost.apiId === 'xinshijie').cost, 0);
});

test('sync-daily-data should ignore otuai column for new future records', () => {
  const tempDir = makeTempDir('sync-ignore-otuai');
  fs.mkdirSync(path.join(tempDir, 'public'), { recursive: true });
  copyScript('sync-daily-data.js', tempDir);

  writeWorkbook(path.join(tempDir, '每日数据整理.xlsx'), [
    ['日期', '向量引擎消费', 'ZIKL', '糖果姐姐api', 'APIMart', '馒小白', '章鱼哥AI', '总生图数'],
    ['2026/6/26', '2.92', '12.46', '31.33', '5', '1.1', '99', '271'],
  ]);

  fs.writeFileSync(
    path.join(tempDir, 'public', 'initial-data.json'),
    JSON.stringify({ version: '1.0.0', apis: [], records: [] }, null, 2),
    'utf8'
  );

  execFileSync('node', ['sync-daily-data.js', '--skip-git'], {
    cwd: tempDir,
    env: {
      ...process.env,
      NODE_PATH: path.join(repoRoot, 'node_modules'),
    },
  });

  const json = JSON.parse(
    fs.readFileSync(path.join(tempDir, 'public', 'initial-data.json'), 'utf8')
  );

  assert.equal(json.records[0].apiCosts.some((cost) => cost.apiId === 'otuai'), false);
  assert.equal(json.records[0].totalCost, 52.81);
});

test('sync-daily-data should include xinshijie and default older dates to zero', () => {
  const tempDir = makeTempDir('sync-xinshijie');
  fs.mkdirSync(path.join(tempDir, 'public'), { recursive: true });
  copyScript('sync-daily-data.js', tempDir);

  writeWorkbook(path.join(tempDir, '每日数据整理.xlsx'), [
    ['日期', '向量引擎消费', 'ZIKL', '糖果姐姐api', 'APIMart', '馒小白', '新世界API', '章鱼哥AI', '总生图数'],
    ['2026/6/29', '1', '2', '3', '4', '5', '', '', '10'],
    ['2026/6/30', '1', '2', '3', '4', '5', '6.78', '', '10'],
  ]);

  fs.writeFileSync(
    path.join(tempDir, 'public', 'initial-data.json'),
    JSON.stringify({ version: '1.0.0', apis: [], records: [] }, null, 2),
    'utf8'
  );

  execFileSync('node', ['sync-daily-data.js', '--skip-git'], {
    cwd: tempDir,
    env: {
      ...process.env,
      NODE_PATH: path.join(repoRoot, 'node_modules'),
    },
  });

  const json = JSON.parse(
    fs.readFileSync(path.join(tempDir, 'public', 'initial-data.json'), 'utf8')
  );
  const olderRecord = json.records.find((record) => record.date === '2026-06-29');
  const yesterdayRecord = json.records.find((record) => record.date === '2026-06-30');

  assert.deepEqual(json.apis.find((api) => api.id === 'xinshijie'), {
    id: 'xinshijie',
    name: '新世界API',
    color: '#14b8a6',
  });
  assert.equal(olderRecord.apiCosts.find((cost) => cost.apiId === 'xinshijie').cost, 0);
  assert.equal(olderRecord.totalCost, 15);
  assert.equal(yesterdayRecord.apiCosts.find((cost) => cost.apiId === 'xinshijie').cost, 6.78);
  assert.equal(yesterdayRecord.totalCost, 21.78);
});

test('zikl-crawler should create current API columns when appending a new date row', () => {
  const tempDir = makeTempDir('zikl-123api');
  const scriptDir = path.join(tempDir, 'scripts');
  copyScript('scripts/zikl-crawler.js', scriptDir);

  writeWorkbook(path.join(tempDir, '每日数据整理.xlsx'), [
    ['日期', '向量引擎消费', 'ZIKL', '糖果姐姐api', 'APIMart', '总生图数'],
  ]);

  const { writeToExcel } = require(path.join(scriptDir, 'zikl-crawler.js'));
  writeToExcel('2026/4/15', '12.34');

  const rows = readWorkbook(path.join(tempDir, '每日数据整理.xlsx'));
  assert.equal(rows[1].length, 9);
  assert.deepEqual(rows[1], ['2026/4/15', '', '12.34', '', '', '', '', '', '']);
});

test('oss-crawler should treat image count as column 6 after inserting APIMart', () => {
  const tempDir = makeTempDir('oss-123api');
  const scriptDir = path.join(tempDir, 'aliyun-oss-crawler');
  copyScript('aliyun-oss-crawler/oss-crawler.js', scriptDir);

  writeWorkbook(path.join(tempDir, '每日数据整理.xlsx'), [
    ['日期', '向量引擎消费', 'ZIKL', '糖果姐姐api', 'APIMart', '总生图数'],
    ['2025/12/1', '1', '2', '3', '', '456'],
  ]);

  const { getMissingDates } = require(path.join(scriptDir, 'oss-crawler.js'));
  assert.deepEqual(getMissingDates(), []);
});
