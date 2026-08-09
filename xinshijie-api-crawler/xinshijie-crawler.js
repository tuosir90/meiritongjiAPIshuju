/**
 * 新世界API 数据抓取脚本 - 工具函数
 *
 * 页面结构与馒小白一致（New API console 模板）。
 * 规则：只采集昨天一天；昨天之前的历史日期不补采，展示层按 0 处理。
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const TARGET_HEADER = '新世界API';
const LEGACY_OTUAI_HEADER = '章鱼哥AI';
const IMAGE_COUNT_HEADER = '总生图数';
const TARGET_FALLBACK_COL = 6;

const CONFIG = {
  url: 'https://api.novaeworld.top/console',
  storageFile: path.join(__dirname, 'xinshijie-auth.json'),
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

function formatExcelDate(serial) {
  if (typeof serial !== 'number') return serial;
  const date = new Date((serial - 25569) * 86400 * 1000);
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
}

function getHeaderIndex(data, headerName) {
  const header = data[0] || [];
  return header.findIndex((cell) => String(cell || '').trim() === headerName);
}

function getPlannedInsertIndex(data) {
  const legacyIndex = getHeaderIndex(data, LEGACY_OTUAI_HEADER);
  if (legacyIndex >= 0) return legacyIndex;

  const imageCountIndex = getHeaderIndex(data, IMAGE_COUNT_HEADER);
  if (imageCountIndex >= 0) return imageCountIndex;

  return TARGET_FALLBACK_COL;
}

function getTargetColumnIndex(data) {
  const existingIndex = getHeaderIndex(data, TARGET_HEADER);
  return existingIndex >= 0 ? existingIndex : null;
}

function ensureTargetHeader(data) {
  const existingIndex = getTargetColumnIndex(data);
  if (existingIndex !== null) return existingIndex;

  const insertIndex = getPlannedInsertIndex(data);
  for (let i = 0; i < data.length; i++) {
    if (!data[i]) data[i] = [];
    while (data[i].length < insertIndex) {
      data[i].push('');
    }
    data[i].splice(insertIndex, 0, i === 0 ? TARGET_HEADER : '');
  }

  return insertIndex;
}

function getYesterday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday;
}

function backfillOlderDatesWithZero(data, targetCol, yesterday) {
  for (let i = 1; i < data.length; i++) {
    const dateObj = parseCellDate(data[i][0]);
    if (!dateObj) continue;
    dateObj.setHours(0, 0, 0, 0);
    if (dateObj >= yesterday) continue;

    const value = data[i][targetCol];
    if (value === undefined || value === null || String(value).trim() === '') {
      data[i][targetCol] = '0';
    }
  }
}

function getMissingDates() {
  if (!fs.existsSync(CONFIG.outputFile)) return [];

  const workbook = XLSX.readFile(CONFIG.outputFile);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  if (data.length <= 1) return [];

  const yesterday = getYesterday();
  const targetCol = getTargetColumnIndex(data);

  for (let i = 1; i < data.length; i++) {
    const dateObj = parseCellDate(data[i][0]);
    if (!dateObj) continue;
    dateObj.setHours(0, 0, 0, 0);
    if (dateObj.getTime() !== yesterday.getTime()) continue;

    if (targetCol === null) return [formatDateInfo(dateObj)];

    const value = data[i][targetCol];
    if (value === undefined || value === null || String(value).trim() === '') {
      return [formatDateInfo(dateObj)];
    }
    return [];
  }

  return [];
}

function hasStoredAuth() {
  return fs.existsSync(CONFIG.storageFile);
}

function writeToExcel(date, amount) {
  const workbook = XLSX.readFile(CONFIG.outputFile);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  const targetCol = ensureTargetHeader(data);
  const yesterday = getYesterday();
  backfillOlderDatesWithZero(data, targetCol, yesterday);
  let rowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    const cellDate = data[i][0];
    if (cellDate === date || formatExcelDate(cellDate) === date) {
      rowIndex = i;
      break;
    }
  }

  if (rowIndex === -1) {
    console.log(`错误: 未找到日期 ${date} 的行，请先运行ZIKL脚本`);
    return;
  }

  data[rowIndex][targetCol] = amount;

  const newWorksheet = XLSX.utils.aoa_to_sheet(data);
  workbook.Sheets[sheetName] = newWorksheet;
  XLSX.writeFile(workbook, CONFIG.outputFile);
  console.log(`数据已写入: ${CONFIG.outputFile}`);
  console.log(`  日期: ${date}, 新世界API: ${amount}`);
}

module.exports = { CONFIG, getMissingDates, hasStoredAuth, writeToExcel };
