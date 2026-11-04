/**
 * 糖果姐姐API 数据抓取入口
 */

const {
  CONFIG,
  formatDateInfo,
  getMissingDates,
  getStorageFile,
  hasStoredAuth,
  writeToExcel,
} = require('./tangguo-crawler');
const { runZiklDashboardCrawler } = require('../scripts/zikl-dashboard-runner');

function formatTangguoAmount(amount) {
  return amount !== null ? parseFloat(amount).toFixed(2) : '0.00';
}

function describeTangguoAmount(amount, finalAmount) {
  return `原始金额: ${amount}, 倍率: 1, 写入值: ${finalAmount}`;
}

function parseTargetDate(rawDate) {
  if (!rawDate) return null;
  const match = String(rawDate).trim().match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/);
  if (!match) {
    throw new Error(`日期格式无效：${rawDate}，请使用 YYYY-MM-DD 或 YYYY/M/D`);
  }

  const parsedDate = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (
    parsedDate.getFullYear() !== Number(match[1])
    || parsedDate.getMonth() !== Number(match[2]) - 1
    || parsedDate.getDate() !== Number(match[3])
  ) {
    throw new Error(`日期格式无效：${rawDate}，请使用实际存在的日期`);
  }

  return parsedDate;
}

function getForcedDateArg() {
  const dateArg = process.argv.find((arg) => arg.startsWith('--date='));
  return dateArg ? dateArg.slice('--date='.length) : process.env.TANGGUO_FORCE_DATE;
}

function getDatesToCollect() {
  const forcedDate = parseTargetDate(getForcedDateArg());
  return forcedDate ? [formatDateInfo(forcedDate)] : getMissingDates();
}

function isDryRun() {
  return process.argv.includes('--dry-run') || process.env.TANGGUO_DRY_RUN === '1';
}

async function main() {
  try {
    return await runZiklDashboardCrawler({
      title: '糖果姐姐API 数据抓取脚本',
      serviceName: '糖果姐姐API',
      config: CONFIG,
      getDatesToCollect,
      getStorageFile,
      hasStoredAuth,
      writeToExcel,
      dryRun: isDryRun(),
      formatAmount: formatTangguoAmount,
      describeAmount: describeTangguoAmount,
      errorScreenshotPath: 'tangguo-error-screenshot.png',
    });
  } catch (error) {
    console.error('\n出错:', error.message);
    process.exitCode = 1;
    return null;
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  formatTangguoAmount,
  describeTangguoAmount,
  getDatesToCollect,
  parseTargetDate,
  isDryRun,
  main,
};
