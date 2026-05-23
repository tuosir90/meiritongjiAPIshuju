/**
 * 章鱼哥AI 数据抓取脚本 - 工具函数
 *
 * 页面结构与向量引擎一致（同款 console 模板），写入 Excel 第 7 列（索引 6，章鱼哥AI）。
 * 倍率：1:1（页面显示即真实消费，无需换算）
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const TARGET_COL = 6; // 章鱼哥AI 列索引（第7列）

const CONFIG = {
  url: 'https://otuapi.com/console',
  storageFile: path.join(__dirname, 'otuai-auth.json'),
  outputFile: path.join(__dirname, '..', '每日数据整理.xlsx'),
  headless: false,
  timeout: 30000,
};

function formatDateInfo(targetDate) {
  const endDate = new Date(targetDate);
  endDate.setDate(endDate.getDate() + 1);

  const formatDateTime = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d} 00:00:00`;
  };

  return {
    formatted: `${targetDate.getFullYear()}/${targetDate.getMonth() + 1}/${targetDate.getDate()}`,
    startTime: formatDateTime(targetDate),
    endTime: formatDateTime(endDate),
  };
}

function parseCellDate(cellDate) {
  if (!cellDate) return null;
  if (cellDate instanceof Date) return new Date(cellDate.getTime());
  if (typeof cellDate === 'number') {
    return new Date((cellDate - 25569) * 86400 * 1000);
  }
  const parts = String(cellDate).split('/');
  if (parts.length === 3) {
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  return null;
}

function getMissingDates() {
  if (!fs.existsSync(CONFIG.outputFile)) return [];

  const workbook = XLSX.readFile(CONFIG.outputFile);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  if (data.length <= 1) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const missingDates = [];
  const seen = new Set();

  for (let i = 1; i < data.length; i++) {
    const cellDate = data[i][0];
    const dateObj = parseCellDate(cellDate);
    if (!dateObj) continue;

    dateObj.setHours(0, 0, 0, 0);
    if (dateObj > yesterday) continue;

    const value = data[i][TARGET_COL];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      continue;
    }

    const dateInfo = formatDateInfo(dateObj);
    if (!seen.has(dateInfo.formatted)) {
      missingDates.push(dateInfo);
      seen.add(dateInfo.formatted);
    }
  }

  return missingDates;
}

function hasStoredAuth() {
  return fs.existsSync(CONFIG.storageFile);
}

function formatExcelDate(serial) {
  if (typeof serial !== 'number') return serial;
  const date = new Date((serial - 25569) * 86400 * 1000);
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
}

function writeToExcel(date, amount) {
  const workbook = XLSX.readFile(CONFIG.outputFile);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  let rowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    const cellDate = data[i][0];
    if (cellDate === date || formatExcelDate(cellDate) === date) {
      rowIndex = i;
      break;
    }
  }

  if (rowIndex === -1) {
    console.log(`错误: 未找到日期 ${date} 的行，请先运行云雾脚本`);
    return;
  }

  data[rowIndex][TARGET_COL] = amount;

  const newWorksheet = XLSX.utils.aoa_to_sheet(data);
  workbook.Sheets[sheetName] = newWorksheet;

  XLSX.writeFile(workbook, CONFIG.outputFile);
  console.log(`数据已写入: ${CONFIG.outputFile}`);
  console.log(`  日期: ${date}, 章鱼哥AI消费: ${amount}`);
}

module.exports = { CONFIG, getMissingDates, hasStoredAuth, writeToExcel };
