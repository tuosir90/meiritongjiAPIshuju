/**
 * 阿里云OSS 只读 API 统计
 *
 * 配置专用只读 AccessKey（OSS_READONLY_ACCESS_KEY_ID / OSS_READONLY_ACCESS_KEY_SECRET）后，
 * 用 ListObjectsV2 统计 generated/YYYY-MM-DD/ 前缀下的对象数，不再需要浏览器登录。
 * 每次使用前先拿 Excel 里最近一个已入库的正数做阳性对照，API 结果不一致就退回浏览器流程。
 * 只读这两个专用变量，不使用其他项目的 OSS_ACCESS_KEY_ID 等；日志只输出错误码，不输出 Key。
 *
 * 手工核对（只读，不写 Excel）：node oss-api-counter.js --date=2026-11-02[,2026-11-01]
 */

const BUCKET = 'meigong-design-system-v2';
const REGION = 'oss-cn-hangzhou';
const READONLY_ID_ENV = 'OSS_READONLY_ACCESS_KEY_ID';
const READONLY_SECRET_ENV = 'OSS_READONLY_ACCESS_KEY_SECRET';
const MAX_PAGES = 1000;

function getReadonlyCredentials(env = process.env) {
  const accessKeyId = String(env[READONLY_ID_ENV] || '').trim();
  const accessKeySecret = String(env[READONLY_SECRET_ENV] || '').trim();
  return accessKeyId && accessKeySecret ? { accessKeyId, accessKeySecret } : null;
}

function createClient(credentials) {
  const OSS = require('ali-oss');
  return new OSS({ region: REGION, bucket: BUCKET, secure: true, authorizationV4: true, ...credentials });
}

function datePrefix(folderName) {
  return `generated/${folderName}/`;
}

/** 逐页统计前缀下的对象数（含子目录）；与前缀同名的目录占位对象不计入。 */
async function countPrefixObjects(client, folderName) {
  const prefix = datePrefix(folderName);
  let total = 0;
  let token = null;
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const result = await client.listV2({ prefix, 'max-keys': 1000, ...(token ? { 'continuation-token': token } : {}) });
    total += (result.objects || []).filter((object) => object.name !== prefix).length;
    if (!result.isTruncated) return total;
    token = result.nextContinuationToken;
    if (!token) throw new Error('OSS 分页结果缺少 continuation token');
  }
  throw new Error(`OSS 分页超过 ${MAX_PAGES} 页，停止统计`);
}

function describeError(error) {
  if (error && error.code) return `${error.code}${error.status ? `（HTTP ${error.status}）` : ''}`;
  return String((error && error.message) || error).split('\n')[0];
}

/** records: [{ dateInfo, time, value }]，取日期最近、值为正整数的一条。 */
function pickPositiveControl(records) {
  return records
    .filter((record) => Number.isInteger(record.value) && record.value > 0)
    .sort((a, b) => b.time - a.time)[0] || null;
}

/**
 * 返回 true 表示已用 API 完成全部待补日期；false 表示没有配置或对照未通过，调用方继续走浏览器流程。
 * 对照通过后逐日统计出错会抛出，由调用方按采集失败处理。
 */
async function collectWithReadonlyApi({ missingDates, credentials, getRecordedCounts, writeToExcel, makeClient = createClient, log = console.log }) {
  if (!credentials) return false;
  log('检测到 OSS 只读 AccessKey，改用 ListObjectsV2 统计（不打开浏览器）');
  const control = pickPositiveControl(getRecordedCounts());
  if (!control) {
    log('Excel 中没有可做阳性对照的历史正数，改用浏览器流程');
    return false;
  }

  let client;
  try {
    client = makeClient(credentials);
    const controlCount = await countPrefixObjects(client, control.dateInfo.folderName);
    if (controlCount !== control.value) {
      log(`阳性对照不一致：${control.dateInfo.formatted} Excel=${control.value}，API=${controlCount}；改用浏览器流程`);
      return false;
    }
    log(`阳性对照通过：${control.dateInfo.formatted} Excel=${control.value}，API=${controlCount}`);
  } catch (error) {
    log(`OSS API 不可用（${describeError(error)}），改用浏览器流程`);
    return false;
  }

  for (const dateInfo of missingDates) {
    const count = await countPrefixObjects(client, dateInfo.folderName);
    log(`[API] ${dateInfo.formatted} 前缀 ${datePrefix(dateInfo.folderName)} 对象总数: ${count}`);
    writeToExcel(dateInfo.formatted, count);
  }
  return true;
}

async function runCli() {
  const arg = process.argv.find((item) => item.startsWith('--date='));
  const dates = (arg ? arg.slice('--date='.length) : '').split(',').map((d) => d.trim()).filter(Boolean);
  if (!dates.length || dates.some((d) => !/^\d{4}-\d{2}-\d{2}$/.test(d))) {
    console.error('用法：node oss-api-counter.js --date=YYYY-MM-DD[,YYYY-MM-DD]');
    return 2;
  }
  const credentials = getReadonlyCredentials();
  if (!credentials) {
    console.error(`未配置 ${READONLY_ID_ENV} / ${READONLY_SECRET_ENV}`);
    return 2;
  }
  const { getRecordedCounts } = require('./oss-crawler');
  const recorded = new Map(getRecordedCounts().map((r) => [r.dateInfo.folderName, r.value]));
  const client = createClient(credentials);
  let allMatch = true;
  for (const folderName of dates) {
    const count = await countPrefixObjects(client, folderName);
    const excel = recorded.has(folderName) ? recorded.get(folderName) : null;
    const match = excel === count;
    allMatch = allMatch && match;
    console.log(`${folderName} excel=${excel === null ? '空' : excel} api=${count} match=${match}`);
  }
  return allMatch ? 0 : 1;
}

if (require.main === module) {
  runCli().then((code) => {
    process.exitCode = code;
  }, (error) => {
    console.error(`OSS API 统计失败: ${describeError(error)}`);
    process.exitCode = 1;
  });
}

module.exports = {
  BUCKET,
  READONLY_ID_ENV,
  READONLY_SECRET_ENV,
  collectWithReadonlyApi,
  countPrefixObjects,
  datePrefix,
  describeError,
  getReadonlyCredentials,
  pickPositiveControl,
};
