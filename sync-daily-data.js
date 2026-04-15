#!/usr/bin/env node
/**
 * 每日数据同步脚本
 * 从 Excel 表格读取数据，补齐缺失日期到 initial-data.json
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const REPO_ROOT = __dirname;
const EXCEL_FILE = path.join(REPO_ROOT, '每日数据整理.xlsx');
const DATA_FILE = path.join(REPO_ROOT, 'public', 'initial-data.json');
const PUSH_REMOTE = 'https://tuosir90@github.com/tuosir90/meiritongjiAPIshuju.git';
const PUSH_BRANCH = 'main';
const args = process.argv.slice(2);
const SKIP_GIT = args.includes('--skip-git');
const SKIP_PUSH = args.includes('--skip-push');
const DEFAULT_APIS = [
  { id: 'volcengine', name: '火山引擎（字节跳动）', color: '#0052D9' },
  { id: 'yunwu', name: '云雾API', color: '#00b96b' },
  { id: 'tangguo', name: '糖果姐姐API', color: '#ff5c93' },
  { id: '123api', name: '123api', color: '#f59e0b' },
];

function convertDateToIso(dateValue) {
  if (!dateValue) return null;
  if (typeof dateValue === 'number') {
    const excelDate = XLSX.SSF.parse_date_code(dateValue);
    if (excelDate) {
      return `${excelDate.y}-${String(excelDate.m).padStart(2, '0')}-${String(excelDate.d).padStart(2, '0')}`;
    }
  }
  const dateStr = String(dateValue);
  const match = dateStr.match(/^(\d{4})[\/.-](\d{1,2})[\/.-](\d{1,2})$/);
  return match ? `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}` : null;
}

function parseNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const num = parseFloat(value);
  return Number.isNaN(num) ? null : num;
}

function incrementVersion(version) {
  const parts = version.split('.');
  const lastIndex = parts.length - 1;
  const lastValue = Number.parseInt(parts[lastIndex], 10);
  if (parts.length < 2 || Number.isNaN(lastValue)) {
    throw new Error(`版本号格式错误：${version}`);
  }
  parts[lastIndex] = String(lastValue + 1);
  return parts.join('.');
}

function normalizeRow(row) {
  if (row.length >= 6) {
    return {
      dateVal: row[0],
      volcVal: row[1],
      yunwuVal: row[2],
      tangguoVal: row[3],
      api123Val: row[4],
      countVal: row[5],
    };
  }
  return {
    dateVal: row[0],
    volcVal: row[1],
    yunwuVal: row[2],
    tangguoVal: row[3],
    api123Val: null,
    countVal: row[4],
  };
}

function buildRecord(row, rowNumber) {
  const { dateVal, volcVal, yunwuVal, tangguoVal, api123Val, countVal } = normalizeRow(row);
  const date = convertDateToIso(dateVal);
  if (!date) {
    return { warning: `行 ${rowNumber}: 日期格式无效，已跳过` };
  }

  const volc = parseNumber(volcVal);
  const yunwu = parseNumber(yunwuVal);
  const tangguo = parseNumber(tangguoVal);
  const count = parseNumber(countVal);
  const api123 = parseNumber(api123Val) ?? 0;
  if ([volc, yunwu, tangguo, count].some((value) => value === null)) {
    return { warning: `日期 ${date} 数据不完整，已跳过` };
  }

  const totalCost = Math.round((volc + yunwu + tangguo + api123) * 100) / 100;
  return {
    record: {
      id: `${date}-1`,
      date,
      apiCosts: [
        { apiId: 'volcengine', cost: volc },
        { apiId: 'yunwu', cost: yunwu },
        { apiId: 'tangguo', cost: tangguo },
        { apiId: '123api', cost: api123 },
      ],
      imageCount: Math.floor(count),
      totalCost,
    },
  };
}

function isSameRecord(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function syncRecords() {
  console.log('[信息] 开始同步数据...\n');
  if (!fs.existsSync(EXCEL_FILE) || !fs.existsSync(DATA_FILE)) {
    const missingFile = !fs.existsSync(EXCEL_FILE) ? EXCEL_FILE : DATA_FILE;
    throw new Error(`未找到文件：${missingFile}`);
  }

  console.log(`[信息] 读取 Excel 文件：${EXCEL_FILE}`);
  const workbook = XLSX.readFile(EXCEL_FILE);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  const parsedByDate = new Map();
  const warnings = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    const { record, warning } = buildRecord(row, i + 1);
    if (warning) {
      warnings.push(warning);
      continue;
    }
    if (parsedByDate.has(record.date)) {
      warnings.push(`日期 ${record.date} 重复出现，已覆盖旧记录`);
    }
    parsedByDate.set(record.date, record);
  }

  console.log(`[信息] 从 Excel 解析到 ${parsedByDate.size} 条记录`);
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  const recordsByDate = new Map(data.records.map((record) => [record.date, record]));
  const changedDates = [];
  const apiConfigChanged = JSON.stringify(data.apis) !== JSON.stringify(DEFAULT_APIS);

  data.apis = DEFAULT_APIS;
  for (const [date, record] of parsedByDate.entries()) {
    const existing = recordsByDate.get(date);
    if (!existing || !isSameRecord(existing, record)) {
      recordsByDate.set(date, record);
      changedDates.push(date);
    }
  }

  if (changedDates.length === 0 && !apiConfigChanged) {
    console.log('[信息] 未发现需要同步的数据');
    return { warnings };
  }

  data.records = Array.from(recordsByDate.values()).sort((a, b) => b.date.localeCompare(a.date));
  data.version = incrementVersion(data.version);
  data.lastUpdated = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
  fs.writeFileSync(DATA_FILE, `${JSON.stringify(data, null, 2)}\n`, 'utf8');

  console.log(`[成功] 已同步 ${changedDates.length} 条记录：${changedDates.join(', ')}`);
  console.log(`[成功] 版本号更新为：${data.version}`);
  return { data, changedDates, warnings };
}

function runGitSync(data, missing) {
  console.log('\n[信息] 执行 Git 操作...');
  execSync('git add public/initial-data.json', { cwd: REPO_ROOT, stdio: 'inherit' });
  const commitTitle = missing.length === 1
    ? `chore: 更新数据到 v${data.version} - 添加${missing[0].date}记录`
    : `chore: 更新数据到 v${data.version} - 添加${missing[0].date}等${missing.length}条记录`;
  const commitBody = '🤖 Generated with [Claude Code](https://claude.com/claude-code)\n\nCo-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>';
  execSync(`git commit -m "${commitTitle}" -m "${commitBody}"`, { cwd: REPO_ROOT, stdio: 'inherit' });
  if (!SKIP_PUSH) {
    execSync(`git push "${PUSH_REMOTE}" ${PUSH_BRANCH}`, { cwd: REPO_ROOT, stdio: 'inherit' });
    console.log('[成功] 已推送到远程仓库');
  }
}

function printWarnings(warnings) {
  if (warnings.length === 0) return;
  console.log('[警告] 解析过程中发现以下问题：');
  warnings.forEach((warning) => console.log(` - ${warning}`));
}

function main() {
  try {
    const { data, changedDates, warnings } = syncRecords();
    printWarnings(warnings);
    if (!changedDates || changedDates.length === 0) return;
    if (!SKIP_GIT) {
      const changedRecords = data.records.filter((record) => changedDates.includes(record.date));
      runGitSync(data, changedRecords);
    }
    console.log('\n[完成] 数据同步成功！');
  } catch (error) {
    console.error(`[错误] ${error.message}`);
    if (!SKIP_GIT) {
      console.error(`[提示] 请确认使用 tuosir90 账号路径推送：git push "${PUSH_REMOTE}" ${PUSH_BRANCH}`);
    }
    process.exit(1);
  }
}

main();
