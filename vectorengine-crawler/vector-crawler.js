/**
 * 向量引擎API 数据抓取脚本 - 工具函数
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// 配置
const CONFIG = {
  url: 'https://api.vectorengine.ai/console',
  storageFile: path.join(__dirname, 'vectorengine-auth.json'),
  outputFile: path.join(__dirname, '..', '每日数据整理.xlsx'),
  headless: false,
  timeout: 30000,
};

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
 * 获取目标日期（直接使用Excel最新日期，由云雾脚本先写入）
 */
function getTargetDate() {
  const latestDate = getLatestDateFromExcel();

  let targetDate;
  if (latestDate) {
    targetDate = new Date(latestDate);
  } else {
    targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - 1);
  }
  targetDate.setHours(0, 0, 0, 0);

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
 * 将数据写入 Excel 第二列（向量引擎消费）
 * 只写入对应日期行的数据，不新增行
 */
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

  // 写入第二列（索引1）
  data[rowIndex][1] = amount;

  const newWorksheet = XLSX.utils.aoa_to_sheet(data);
  workbook.Sheets[sheetName] = newWorksheet;

  XLSX.writeFile(workbook, CONFIG.outputFile);
  console.log(`数据已写入: ${CONFIG.outputFile}`);
  console.log(`  日期: ${date}, 向量引擎消费: ${amount}`);
}

module.exports = { CONFIG, getTargetDate, hasStoredAuth, writeToExcel };
