/**
 * 向量引擎API 数据抓取入口
 */

const { CONFIG, getMissingDates, hasStoredAuth, writeToExcel } = require('./vector-crawler');
const { runConsoleCostCrawler } = require('../scripts/console-cost-runner');

runConsoleCostCrawler({
  title: '向量引擎API 数据抓取脚本',
  config: CONFIG,
  getMissingDates,
  hasStoredAuth,
  writeToExcel,
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
  formatAmount(amount) {
    return amount !== null ? (parseFloat(amount) / 2).toFixed(2) : '0';
  },
  describeAmount(amount, finalAmount) {
    return `原始金额: ${amount}，除以2后: ${finalAmount}`;
  },
});
