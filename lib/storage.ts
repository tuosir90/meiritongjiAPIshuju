"use client";

import { AppData, ApiConfig, DailyRecord } from "./types";

const STORAGE_KEY = "api-cost-tracker-data-v2"; // 更新版本，使用新的API配置
const VERSION_KEY = "api-cost-tracker-version"; // 存储当前数据版本号

/**
 * 默认API配置
 */
const DEFAULT_APIS: ApiConfig[] = [
  { id: "volcengine", name: "火山引擎（字节跳动）", color: "#0052D9" },
  { id: "yunwu", name: "云雾API", color: "#00b96b" },
  { id: "tangguo", name: "糖果姐姐API", color: "#ff5c93" },
];

/**
 * 获取默认数据
 */
function getDefaultData(): AppData {
  return {
    apis: DEFAULT_APIS,
    records: [],
  };
}

/**
 * 从localStorage加载数据
 */
export function loadData(): AppData {
  if (typeof window === "undefined") {
    return getDefaultData();
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored) as AppData;
      // 确保数据结构完整
      if (!data.apis || !Array.isArray(data.apis)) {
        data.apis = DEFAULT_APIS;
      }
      if (!data.records || !Array.isArray(data.records)) {
        data.records = [];
      }
      return data;
    }
  } catch (error) {
    console.error("加载数据失败:", error);
  }

  return getDefaultData();
}

/**
 * 保存数据到localStorage
 */
export function saveData(data: AppData): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("保存数据失败:", error);
  }
}

/**
 * 添加API配置
 */
export function addApi(data: AppData, api: ApiConfig): AppData {
  return {
    ...data,
    apis: [...data.apis, api],
  };
}

/**
 * 删除API配置
 */
export function removeApi(data: AppData, apiId: string): AppData {
  return {
    ...data,
    apis: data.apis.filter((api) => api.id !== apiId),
    records: data.records.map((record) => ({
      ...record,
      apiCosts: record.apiCosts.filter((cost) => cost.apiId !== apiId),
      totalCost: record.apiCosts
        .filter((cost) => cost.apiId !== apiId)
        .reduce((sum, cost) => sum + cost.cost, 0),
    })),
  };
}

/**
 * 添加或更新每日记录
 */
export function saveRecord(data: AppData, record: DailyRecord): AppData {
  const existingIndex = data.records.findIndex((r) => r.id === record.id);

  const newRecords = [...data.records];
  if (existingIndex >= 0) {
    newRecords[existingIndex] = record;
  } else {
    newRecords.push(record);
  }

  // 按日期降序排序
  newRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return {
    ...data,
    records: newRecords,
  };
}

/**
 * 删除每日记录
 */
export function deleteRecord(data: AppData, recordId: string): AppData {
  return {
    ...data,
    records: data.records.filter((r) => r.id !== recordId),
  };
}

/**
 * 计算累计总费用
 */
export function calculateTotalCost(records: DailyRecord[]): number {
  return records.reduce((sum, record) => sum + record.totalCost, 0);
}

/**
 * 计算累计图片总数
 */
export function calculateTotalImages(records: DailyRecord[]): number {
  return records.reduce((sum, record) => sum + record.imageCount, 0);
}

/**
 * 获取本地存储的数据版本
 */
export function getLocalVersion(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem(VERSION_KEY);
}

/**
 * 保存数据版本到本地
 */
export function saveVersion(version: string): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(VERSION_KEY, version);
}

/**
 * 比较版本号（逐段比较数值）
 * 返回 true 表示 newVersion 更新
 */
export function isNewerVersion(currentVersion: string | null, newVersion: string): boolean {
  if (!newVersion) {
    return false;
  }
  if (!currentVersion) {
    return true;
  }

  const parseVersion = (version: string) =>
    version.split(".").map((part) => Number.parseInt(part, 10) || 0);

  const currentParts = parseVersion(currentVersion);
  const newParts = parseVersion(newVersion);
  const maxLength = Math.max(currentParts.length, newParts.length);

  for (let i = 0; i < maxLength; i++) {
    const currentPart = currentParts[i] ?? 0;
    const newPart = newParts[i] ?? 0;
    if (newPart > currentPart) {
      return true;
    }
    if (newPart < currentPart) {
      return false;
    }
  }

  return false;
}
