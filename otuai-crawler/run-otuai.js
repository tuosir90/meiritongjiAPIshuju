/**
 * 章鱼哥AI 数据抓取入口
 *
 * 倍率：1:1（页面显示即真实消费）
 */

const { CONFIG, getMissingDates, hasStoredAuth, writeToExcel } = require('./otuai-crawler');
const { runConsoleCostCrawler } = require('../scripts/console-cost-runner');

runConsoleCostCrawler({
  title: '章鱼哥AI 数据抓取脚本',
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
    return amount !== null ? parseFloat(amount).toFixed(2) : '0';
  },
  describeAmount(amount, finalAmount) {
    return `原始金额: ${amount}（1:1 倍率，最终: ${finalAmount}）`;
  },
});
