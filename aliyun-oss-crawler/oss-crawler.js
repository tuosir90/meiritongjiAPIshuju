/**
 * 阿里云OSS 数据抓取脚本 - 工具函数
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// 配置
const CONFIG = {
  url: 'https://oss.console.aliyun.com/bucket/oss-cn-hangzhou/meigong-design-system-v2/object?path=generated%2F',
  storageFile: path.join(__dirname, 'aliyun-auth.json'),
  outputFile: path.join(__dirname, '..', '每日数据整理.xlsx'),
  headless: false,
  timeout: 120000,
};

module.exports = { CONFIG };

/**
 * 从Excel读取最新日期
 */
function getLatestDateFromExcel() {
  if (!fs.existsSync(CONFIG.outputFile)) return null;

  const workbook = XLSX.readFile(CONFIG.outputFile);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  if (data.length <= 1) return null;

  for (let i = data.length - 1; i >= 1; i--) {
    const cellDate = data[i][0];
    if (cellDate) {
      if (typeof cellDate === 'number') {
        return new Date((cellDate - 25569) * 86400 * 1000);
      }
      const parts = String(cellDate).split('/');
      if (parts.length === 3) {
        return new Date(parts[0], parts[1] - 1, parts[2]);
      }
    }
  }
  return null;
}

/**
 * 格式化日期为OSS所需的格式
 */
function formatDateInfo(targetDate) {
  const y = targetDate.getFullYear();
  const m = String(targetDate.getMonth() + 1).padStart(2, '0');
  const d = String(targetDate.getDate()).padStart(2, '0');

  return {
    formatted: `${y}/${targetDate.getMonth() + 1}/${targetDate.getDate()}`,
    folderName: `${y}-${m}-${d}`,
  };
}

/**
 * 解析 Excel 日期单元格
 */
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

/**
 * 获取所有需要补采的日期（已存在行且目标列为空）
 */
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

    const value = data[i][5];
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

/**
 * 获取目标日期（保留兼容性）
 */
function getTargetDate() {
  const dates = getMissingDates();
  return dates.length > 0 ? dates[0] : null;
}

/**
 * 检查是否有保存的登录状态
 */
function hasStoredAuth() {
  return fs.existsSync(CONFIG.storageFile);
}

/**
 * 格式化 Excel 日期序列号
 */
function formatExcelDate(serial) {
  if (typeof serial !== 'number') return serial;
  const date = new Date((serial - 25569) * 86400 * 1000);
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
}

/**
 * 将数据写入 Excel 第六列（总生图数）
 * 只写入对应日期行的数据，不新增行
 */
function writeToExcel(date, count) {
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

  // 只写入第六列（索引5），不修改日期列
  data[rowIndex][5] = count;

  const newWorksheet = XLSX.utils.aoa_to_sheet(data);
  workbook.Sheets[sheetName] = newWorksheet;

  XLSX.writeFile(workbook, CONFIG.outputFile);
  console.log(`数据已写入: ${CONFIG.outputFile}`);
  console.log(`  日期: ${date}, 总生图数: ${count}`);
}

module.exports = { CONFIG, getTargetDate, getMissingDates, hasStoredAuth, writeToExcel };
