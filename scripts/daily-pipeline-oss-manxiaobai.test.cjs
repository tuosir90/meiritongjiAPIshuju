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

test('oss-crawler writes image count to column 7 without filling manxiaobai column', () => {
  const tempDir = makeTempDir('oss-manxiaobai');
  const scriptDir = path.join(tempDir, 'aliyun-oss-crawler');
  copyScript('aliyun-oss-crawler/oss-crawler.js', scriptDir);

  const workbookPath = path.join(tempDir, '每日数据整理.xlsx');
  writeWorkbook(workbookPath, [
    ['日期', '火山引擎消费', '云雾api消费', '糖果姐姐api', 'APIMart', '馒小白', '总生图数'],
    ['2026/5/19', '3.60', '27.23', '53.90', '1.51', '', ''],
  ]);

  const { getMissingDates, writeToExcel } = require(path.join(scriptDir, 'oss-crawler.js'));

  assert.deepEqual(getMissingDates().map((date) => date.formatted), ['2026/5/19']);

  writeToExcel('2026/5/19', 1276);

  const rows = readWorkbook(workbookPath);
  assert.equal(rows[1][5], '');
  assert.equal(rows[1][6], 1276);
});
