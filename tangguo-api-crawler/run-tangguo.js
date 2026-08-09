/**
 * 糖果姐姐API 数据抓取入口
 */

const { CONFIG, getMissingDates, hasStoredAuth, writeToExcel } = require('./tangguo-crawler');
const { runConsoleCostCrawler } = require('../scripts/console-cost-runner');

runConsoleCostCrawler({
  title: '糖果姐姐API 数据抓取脚本',
  config: CONFIG,
  getMissingDates,
  hasStoredAuth,
  writeToExcel,
  searchSelectors: [
    'i.el-icon-search',
    '.el-icon-search',
    '[class*="search"]',
    'button:has-text("搜索")',
  ],
  inputSelector: 'input[type="text"]',
  formatAmount(amount) {
    return amount ?? '0';
  },
});
