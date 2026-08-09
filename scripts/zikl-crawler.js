/**
 * ZIKL 数据抓取脚本
 * 使用 Playwright 自动化提取每日资源消耗数据
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const CANONICAL_AUTH_FILE = path.join(__dirname, 'zikl-auth.json');
const LEGACY_AUTH_FILE = path.join(__dirname, 'yunwu-auth.json');

// 配置
const CONFIG = {
  url: 'https://img.mzfe.de/dashboard/overview',
  storageFile: CANONICAL_AUTH_FILE,
  outputFile: path.join(__dirname, '..', '每日数据整理.xlsx'),
  headless: false,
  timeout: 30000,
};

function getStorageFile() {
  if (fs.existsSync(CANONICAL_AUTH_FILE) || !fs.existsSync(LEGACY_AUTH_FILE)) {
    return CANONICAL_AUTH_FILE;
  }
  return LEGACY_AUTH_FILE;
}

/**
 * 从Excel读取最新日期
 */
function getLatestDateFromExcel() {
  if (!fs.existsSync(CONFIG.outputFile)) return null;

  const workbook = XLSX.readFile(CONFIG.outputFile);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  if (data.length <= 1) return null;

  // 找最新日期（最后一行有日期的）
  for (let i = data.length - 1; i >= 1; i--) {
    const cellDate = data[i][0];
    if (cellDate) {
      // 处理Excel日期序列号
      if (typeof cellDate === 'number') {
        return new Date((cellDate - 25569) * 86400 * 1000);
      }
      // 处理字符串格式 "2026/1/21"
      const parts = String(cellDate).split('/');
      if (parts.length === 3) {
        return new Date(parts[0], parts[1] - 1, parts[2]);
      }
    }
  }
  return null;
}

/**
 * 格式化日期为查询所需的格式
 */
function formatDateInfo(targetDate) {
  const startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 1);

  const formatDateTime = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d} 00:00:00`;
  };

  return {
    formatted: `${startDate.getFullYear()}/${startDate.getMonth() + 1}/${startDate.getDate()}`,
    startTime: formatDateTime(startDate),
    endTime: formatDateTime(endDate),
    startTimestamp: Math.floor(startDate.getTime() / 1000),
    endTimestamp: Math.floor(endDate.getTime() / 1000),
  };
}

/**
 * 获取所有缺失的日期（从Excel最新日期+1天 到 昨天）
 */
function getMissingDates() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const latestDate = getLatestDateFromExcel();

  let startDate;
  if (latestDate) {
    startDate = new Date(latestDate);
    startDate.setDate(startDate.getDate() + 1);
    startDate.setHours(0, 0, 0, 0);
  } else {
    // 如果没有数据，默认从昨天开始
    startDate = new Date(yesterday);
  }

  const missingDates = [];
  const current = new Date(startDate);

  while (current <= yesterday) {
    missingDates.push(formatDateInfo(new Date(current)));
    current.setDate(current.getDate() + 1);
  }

  return missingDates;
}

/**
 * 获取昨天的日期（保留兼容性）
 */
function getYesterdayDate() {
  const dates = getMissingDates();
  return dates.length > 0 ? dates[0] : null;
}

/**
 * 检查是否有保存的登录状态
 */
function hasStoredAuth() {
  const storageFile = getStorageFile();
  if (!fs.existsSync(storageFile)) return false;

  try {
    const state = JSON.parse(fs.readFileSync(storageFile, 'utf8'));
    const expectedHost = new URL(CONFIG.url).hostname;
    const matchesHost = (host) => {
      const normalized = String(host || '').replace(/^\./, '').toLowerCase();
      return normalized === expectedHost || expectedHost.endsWith(`.${normalized}`);
    };

    const hasCookie = (state.cookies || []).some((cookie) => matchesHost(cookie.domain));
    const hasOrigin = (state.origins || []).some((origin) => {
      try {
        return matchesHost(new URL(origin.origin).hostname);
      } catch {
        return false;
      }
    });

    return hasCookie || hasOrigin;
  } catch {
    return false;
  }
}

/**
 * 将数据写入 Excel 第三列（ZIKL）
 */
function writeToExcel(date, amount) {
  const workbook = XLSX.readFile(CONFIG.outputFile);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // 转换为数组格式
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  // 查找是否已有该日期的记录
  let rowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    const cellDate = data[i][0];
    if (cellDate === date || formatExcelDate(cellDate) === date) {
      rowIndex = i;
      break;
    }
  }

  if (rowIndex === -1) {
    // 新增一行
    rowIndex = data.length;
    data.push([date, '', '', '', '', '', '', '', '']);
  }

  // 写入第三列（索引2）
  data[rowIndex][0] = date;
  data[rowIndex][2] = amount;

  // 重新创建工作表
  const newWorksheet = XLSX.utils.aoa_to_sheet(data);
  workbook.Sheets[sheetName] = newWorksheet;

  XLSX.writeFile(workbook, CONFIG.outputFile);
  console.log(`数据已写入: ${CONFIG.outputFile}`);
  console.log(`  日期: ${date}, ZIKL: ${amount}`);
}

/**
 * 格式化 Excel 日期序列号
 */
function formatExcelDate(serial) {
  if (typeof serial !== 'number') return serial;
  const date = new Date((serial - 25569) * 86400 * 1000);
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
}

module.exports = {
  CONFIG,
  formatDateInfo,
  getYesterdayDate,
  getMissingDates,
  getStorageFile,
  hasStoredAuth,
  writeToExcel,
};
