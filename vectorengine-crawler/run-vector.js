/**
 * 向量引擎API 数据抓取入口
 */

const { CONFIG, getMissingDates, hasStoredAuth, writeToExcel } = require('./vector-crawler');
const { runOpenLuxCrawler } = require('./openlux-runner');

runOpenLuxCrawler({
  config: CONFIG,
  getMissingDates,
  hasStoredAuth,
  writeToExcel,
}).catch(error => {
  console.error('向量引擎采集失败:', error.message);
  process.exitCode = 1;
});
