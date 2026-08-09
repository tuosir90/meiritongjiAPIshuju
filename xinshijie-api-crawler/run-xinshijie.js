/**
 * 新世界API 数据抓取入口
 *
 * 规则：只采集昨天一天，历史日期在同步/展示时按 0 处理。
 */

const { CONFIG, getMissingDates, hasStoredAuth, writeToExcel } = require('./xinshijie-crawler');
const { runConsoleCostCrawler } = require('../scripts/console-cost-runner');

runConsoleCostCrawler({
  title: '新世界API 数据抓取脚本',
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
    return amount ?? '0';
  },
});
