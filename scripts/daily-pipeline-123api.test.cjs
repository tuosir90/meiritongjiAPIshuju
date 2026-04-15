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

test('sync-daily-data should parse 6-column rows and include 123api in total cost', () => {
  const tempDir = makeTempDir('sync-123api');
  fs.mkdirSync(path.join(tempDir, 'public'), { recursive: true });
  copyScript('sync-daily-data.js', tempDir);

  writeWorkbook(path.join(tempDir, '每日数据整理.xlsx'), [
    ['日期', '火山引擎消费', '云雾api消费', '糖果姐姐api', '123api', '总生图数'],
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
  assert.deepEqual(json.records[0], {
    id: '2026-04-14-1',
    date: '2026-04-14',
    apiCosts: [
      { apiId: 'volcengine', cost: 2.92 },
      { apiId: 'yunwu', cost: 12.46 },
      { apiId: 'tangguo', cost: 31.33 },
      { apiId: '123api', cost: 5 },
    ],
    imageCount: 271,
    totalCost: 51.71,
  });
});

test('sync-daily-data should update existing dates when Excel adds 123api values', () => {
  const tempDir = makeTempDir('sync-update-123api');
  fs.mkdirSync(path.join(tempDir, 'public'), { recursive: true });
  copyScript('sync-daily-data.js', tempDir);

  writeWorkbook(path.join(tempDir, '每日数据整理.xlsx'), [
    ['日期', '火山引擎消费', '云雾api消费', '糖果姐姐api', '123api', '总生图数'],
    ['2026/4/14', '2.92', '12.46', '31.33', '5', '271'],
  ]);

  fs.writeFileSync(
    path.join(tempDir, 'public', 'initial-data.json'),
    JSON.stringify({
      version: '1.0.0',
      apis: [],
      records: [
        {
          id: '2026-04-14-1',
          date: '2026-04-14',
          apiCosts: [
            { apiId: 'volcengine', cost: 2.92 },
            { apiId: 'yunwu', cost: 12.46 },
            { apiId: 'tangguo', cost: 31.33 },
          ],
          imageCount: 271,
          totalCost: 46.71,
        },
      ],
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
  assert.deepEqual(json.records[0].apiCosts, [
    { apiId: 'volcengine', cost: 2.92 },
    { apiId: 'yunwu', cost: 12.46 },
    { apiId: 'tangguo', cost: 31.33 },
    { apiId: '123api', cost: 5 },
  ]);
  assert.equal(json.records[0].totalCost, 51.71);
});

test('yunwu-crawler should create 6 columns when appending a new date row', () => {
  const tempDir = makeTempDir('yunwu-123api');
  const scriptDir = path.join(tempDir, 'scripts');
  copyScript('scripts/yunwu-crawler.js', scriptDir);

  writeWorkbook(path.join(tempDir, '每日数据整理.xlsx'), [
    ['日期', '火山引擎消费', '云雾api消费', '糖果姐姐api', '123api', '总生图数'],
  ]);

  const { writeToExcel } = require(path.join(scriptDir, 'yunwu-crawler.js'));
  writeToExcel('2026/4/15', '12.34');

  const rows = readWorkbook(path.join(tempDir, '每日数据整理.xlsx'));
  assert.equal(rows[1].length, 6);
  assert.deepEqual(rows[1], ['2026/4/15', '', '12.34', '', '', '']);
});

test('oss-crawler should treat image count as column 6 after inserting 123api', () => {
  const tempDir = makeTempDir('oss-123api');
  const scriptDir = path.join(tempDir, 'aliyun-oss-crawler');
  copyScript('aliyun-oss-crawler/oss-crawler.js', scriptDir);

  writeWorkbook(path.join(tempDir, '每日数据整理.xlsx'), [
    ['日期', '火山引擎消费', '云雾api消费', '糖果姐姐api', '123api', '总生图数'],
    ['2025/12/1', '1', '2', '3', '', '456'],
  ]);

  const { getMissingDates } = require(path.join(scriptDir, 'oss-crawler.js'));
  assert.deepEqual(getMissingDates(), []);
});
