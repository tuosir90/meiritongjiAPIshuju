/**
 * 馒小白API 数据抓取入口
 *
 * 倍率：充值 11 元到账 10 元 → 实际花费 = 显示额度 × 1.1
 */

const { CONFIG, getMissingDates, hasStoredAuth, writeToExcel } = require('./manxiaobai-crawler');
const { runConsoleCostCrawler } = require('../scripts/console-cost-runner');

runConsoleCostCrawler({
  title: '馒小白API 数据抓取脚本',
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
    return amount !== null ? (parseFloat(amount) * 1.1).toFixed(2) : '0';
  },
  describeAmount(amount, finalAmount) {
    return `原始金额: ${amount}，乘以 1.1 后: ${finalAmount}`;
  },
});
