/**
 * 新世界API 数据抓取入口
 *
 * 规则：只采集昨天一天，历史日期在同步/展示时按 0 处理。
 */

const {
  CONFIG,
  formatDateInfo,
  getMissingDates,
  hasStoredAuth,
  writeToExcel,
} = require('./xinshijie-crawler');
const { runConsoleCostCrawler } = require('../scripts/console-cost-runner');

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
  return dateArg ? dateArg.slice('--date='.length) : process.env.XINSHIJIE_FORCE_DATE;
}

function getDatesToCollect() {
  const forcedDate = parseTargetDate(getForcedDateArg());
  return forcedDate ? [formatDateInfo(forcedDate)] : getMissingDates();
}

const forcedDateArg = getForcedDateArg();
if (forcedDateArg) {
  console.log('指定日期采集，跳过历史空白补 0');
}

runConsoleCostCrawler({
  title: '新世界API 数据抓取脚本',
  config: CONFIG,
  getMissingDates: getDatesToCollect,
  hasStoredAuth,
  writeToExcel(date, amount) {
    writeToExcel(date, amount, { backfillOlder: !forcedDateArg });
  },
  searchSelectors: [
    'button:has(span[aria-label="search"])',
    'button:has(svg.lucide-search)',
    'button[aria-label="search"]',
    'button:has-text("搜索")',
    'i.el-icon-search',
    '.el-icon-search',
    '[class*="search"]',
  ],
  requireModal: true,
  failOnMissingAmount: true,
  missingAmountErrorMessage: '未提取到统计额度，停止写入，避免把有效数据覆盖为0',
  formatAmount(amount) {
    return amount ?? '0';
  },
});

module.exports = { getDatesToCollect, parseTargetDate };
