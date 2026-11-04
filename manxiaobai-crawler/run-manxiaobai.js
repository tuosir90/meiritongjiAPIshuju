/**
 * 馒小白API 数据抓取入口
 *
 * 倍率：充值 11 元到账 10 元 → 实际花费 = 显示额度 × 1.1
 */

const {
  CONFIG,
  backfillHistoricalBlanksWithZero,
  formatDateInfo,
  getMissingDates,
  hasStoredAuth,
  writeToExcel,
} = require('./manxiaobai-crawler');
const { runZiklDashboardCrawler } = require('../scripts/zikl-dashboard-runner');

function formatManxiaobaiAmount(amount) {
  return amount !== null ? (parseFloat(amount) * 1.1).toFixed(2) : '0.00';
}

function describeManxiaobaiAmount(amount, finalAmount) {
  return `原始金额: ${amount}, 倍率: 1.1, 写入值: ${finalAmount}`;
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
  return dateArg ? dateArg.slice('--date='.length) : process.env.MANXIAOBAI_FORCE_DATE;
}

function getDatesToCollect() {
  const forcedDate = parseTargetDate(getForcedDateArg());
  return forcedDate ? [formatDateInfo(forcedDate)] : getMissingDates();
}

function isDryRun() {
  return process.argv.includes('--dry-run') || process.env.MANXIAOBAI_DRY_RUN === '1';
}

async function main() {
  try {
    if (getForcedDateArg()) {
      console.log('指定日期采集，跳过历史空白补 0');
    } else {
      const backfillResult = backfillHistoricalBlanksWithZero();
      if (backfillResult.dates.length > 0) {
        console.log(`历史空白日期已补 0: ${backfillResult.dates.length} 个`);
      }
    }

    return await runZiklDashboardCrawler({
      title: '馒小白API 数据抓取脚本',
      serviceName: '馒小白',
      config: CONFIG,
      getDatesToCollect,
      hasStoredAuth,
      writeToExcel,
      dryRun: isDryRun(),
      formatAmount: formatManxiaobaiAmount,
      describeAmount: describeManxiaobaiAmount,
      errorScreenshotPath: 'manxiaobai-error-screenshot.png',
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
  formatManxiaobaiAmount,
  describeManxiaobaiAmount,
  getDatesToCollect,
  parseTargetDate,
  isDryRun,
  main,
};
