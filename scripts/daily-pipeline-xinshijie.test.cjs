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

function readWorkbook(filePath) {
  const wb = XLSX.readFile(filePath);
  return XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {
    header: 1,
    defval: null,
  });
}

function copyScript(source, targetDir) {
  fs.mkdirSync(targetDir, { recursive: true });
  const target = path.join(targetDir, path.basename(source));
  fs.copyFileSync(path.join(repoRoot, source), target);
  return target;
}

function formatSlashDate(date) {
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
}

test('xinshijie-crawler only collects yesterday and leaves older dates at zero', () => {
  const tempDir = makeTempDir('xinshijie-yesterday-only');
  const scriptDir = path.join(tempDir, 'xinshijie-api-crawler');
  copyScript('xinshijie-api-crawler/xinshijie-crawler.js', scriptDir);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const olderDate = new Date(today);
  olderDate.setDate(olderDate.getDate() - 2);

  writeWorkbook(path.join(tempDir, '每日数据整理.xlsx'), [
    ['日期', '向量引擎消费', 'ZIKL', '糖果姐姐api', 'APIMart', '馒小白', '新世界API', '章鱼哥AI', '总生图数'],
    [formatSlashDate(olderDate), '1', '2', '3', '4', '5', '', '', '10'],
    [formatSlashDate(yesterday), '1', '2', '3', '4', '5', '', '', '10'],
  ]);

  const { CONFIG, getMissingDates, writeToExcel } = require(path.join(scriptDir, 'xinshijie-crawler.js'));

  assert.equal(CONFIG.url, 'https://api.novaeworld.top/console');
  assert.deepEqual(
    getMissingDates().map((dateInfo) => dateInfo.formatted),
    [formatSlashDate(yesterday)]
  );

  writeToExcel(formatSlashDate(yesterday), '6.78');

  const rows = readWorkbook(path.join(tempDir, '每日数据整理.xlsx'));
  assert.equal(rows[1][6], '0');
  assert.equal(rows[2][6], '6.78');
  assert.equal(rows[2][8], '10');
});
