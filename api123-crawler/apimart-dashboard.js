/**
 * APIMart 控制台统计额度读取工具
 */

const APIMART_ORIGIN = 'https://apimart.ai';
const { pickAmountFromCandidates } = require('../scripts/cost-amount-extractor');

function buildDashboardApiPath(dateInfo) {
  if (!Number.isFinite(dateInfo.startTimestamp) || !Number.isFinite(dateInfo.endTimestamp)) {
    throw new Error('日期范围缺少有效时间戳');
  }

  return `/api/web/user/self?start_timestamp=${dateInfo.startTimestamp}&end_timestamp=${dateInfo.endTimestamp}`;
}

function extractQuotaFromDashboardData(payload) {
  const data = payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload;
  if (!data || typeof data !== 'object') return null;

  const rawQuota = data.stat_quota ?? data.statistics_quota ?? data.statisticsQuota;
  if (rawQuota === undefined || rawQuota === null || rawQuota === '') return null;

  const quota = Number(String(rawQuota ?? '').replaceAll(',', ''));
  if (!Number.isFinite(quota)) return null;

  return String(quota);
}

function extractQuotaFromPageText(rawText) {
  return pickAmountFromCandidates([rawText]);
}

function getAuthInfoFromRawUser(rawUser) {
  if (!rawUser) return null;

  try {
    const user = typeof rawUser === 'string' ? JSON.parse(rawUser) : rawUser;
    const token = user.access_token || user.token;
    if (!token || !user.id) return null;

    return {
      token,
      userId: String(user.id),
    };
  } catch {
    return null;
  }
}

function buildAuthHeaders(rawUser) {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (!rawUser) return headers;

  try {
    const user = typeof rawUser === 'string' ? JSON.parse(rawUser) : rawUser;
    const token = user.access_token || user.token;
    if (token) headers.Authorization = `Bearer ${token}`;
    if (user.id) {
      const userId = String(user.id);
      headers['New-Api-User'] = userId;
      headers['New-API-User'] = userId;
    }
  } catch {}

  return headers;
}

function isSuccessfulDashboardProbe(probe) {
  if (!probe || probe.ok !== true) return false;
  return !probe.payload || probe.payload.success !== false;
}

function isLoginPageUrl(url) {
  return String(url || '').includes('/login');
}

async function getStoredRawUser(page) {
  return page.evaluate(() => window.localStorage.getItem('user')).catch(() => null);
}

async function requestDashboardApi(page, apiPath) {
  const rawUser = await getStoredRawUser(page);
  const url = new URL(apiPath, APIMART_ORIGIN).toString();
  const response = await page.request.get(url, {
    headers: buildAuthHeaders(rawUser),
  });
  const payload = await response.json().catch(() => null);

  return {
    ok: response.ok(),
    status: response.status(),
    payload,
  };
}

async function probeDashboardSession(page) {
  const rawUser = await getStoredRawUser(page);
  if (getAuthInfoFromRawUser(rawUser)) return true;

  return isSuccessfulDashboardProbe(await requestDashboardApi(page, '/api/web/user/self'));
}

async function fetchDashboardQuota(page, dateInfo) {
  const apiPath = buildDashboardApiPath(dateInfo);
  const { ok, status, payload } = await requestDashboardApi(page, apiPath);
  if (!ok) {
    const message = payload && typeof payload === 'object' ? payload.message : '';
    throw new Error(message || `APIMart 接口请求失败: ${status}`);
  }

  const quota = extractQuotaFromDashboardData(payload);
  if (quota === null) {
    throw new Error('APIMart 返回数据中未找到统计额度 stat_quota');
  }

  return quota;
}

async function extractVisibleQuotaFromPage(page) {
  const statsText = await page.locator('text=统计额度').first().locator('..').textContent().catch(() => null);
  const bodyText = await page.locator('body').innerText().catch(() => '');
  return pickAmountFromCandidates([statsText, bodyText]);
}

module.exports = {
  buildAuthHeaders,
  buildDashboardApiPath,
  extractQuotaFromDashboardData,
  extractQuotaFromPageText,
  extractVisibleQuotaFromPage,
  fetchDashboardQuota,
  getAuthInfoFromRawUser,
  getStoredRawUser,
  isLoginPageUrl,
  isSuccessfulDashboardProbe,
  probeDashboardSession,
  requestDashboardApi,
};
