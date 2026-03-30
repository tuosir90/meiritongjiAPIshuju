import assert from "node:assert/strict";
import test from "node:test";

import {
  buildWeeklySummaries,
  buildWeeklyTrendDailyData,
  DEFAULT_VISIBLE_WEEKS,
  getVisibleWeekCount,
  getVisibleWeeklySummaries,
} from "./weekly-summary.ts";
import type { ApiConfig, DailyRecord } from "./types.ts";

const apis: ApiConfig[] = [
  { id: "volcengine", name: "火山引擎", color: "#1d4ed8" },
  { id: "yunwu", name: "云雾API", color: "#16a34a" },
  { id: "tangguo", name: "糖果姐姐API", color: "#db2777" },
];

const records: DailyRecord[] = [
  {
    id: "2026-03-23-1",
    date: "2026-03-23",
    apiCosts: [
      { apiId: "volcengine", cost: 5 },
      { apiId: "yunwu", cost: 20 },
    ],
    imageCount: 100,
    totalCost: 25,
  },
  {
    id: "2026-03-24-1",
    date: "2026-03-24",
    apiCosts: [
      { apiId: "yunwu", cost: 12 },
      { apiId: "tangguo", cost: 8 },
    ],
    imageCount: 60,
    totalCost: 20,
  },
  {
    id: "2026-03-30-1",
    date: "2026-03-30",
    apiCosts: [
      { apiId: "volcengine", cost: 7.5 },
      { apiId: "tangguo", cost: 2.5 },
    ],
    imageCount: 40,
    totalCost: 10,
  },
];

test("should group daily records into natural weeks and compute weekly totals", () => {
  const summaries = buildWeeklySummaries(records, apis);

  assert.equal(summaries.length, 2);

  assert.deepEqual(summaries[0], {
    weekKey: "2026-03-30",
    weekLabel: "2026/03/30 - 2026/04/05",
    startDate: "2026-03-30",
    endDate: "2026-04-05",
    recordCount: 1,
    totalCost: 10,
    totalImages: 40,
    averageDailyCost: 10,
    averageDailyImages: 40,
    maxDailyCost: 10,
    apiBreakdown: [
      { apiId: "volcengine", apiName: "火山引擎", totalCost: 7.5, color: "#1d4ed8" },
      { apiId: "yunwu", apiName: "云雾API", totalCost: 0, color: "#16a34a" },
      { apiId: "tangguo", apiName: "糖果姐姐API", totalCost: 2.5, color: "#db2777" },
    ],
  });

  assert.deepEqual(summaries[1], {
    weekKey: "2026-03-23",
    weekLabel: "2026/03/23 - 2026/03/29",
    startDate: "2026-03-23",
    endDate: "2026-03-29",
    recordCount: 2,
    totalCost: 45,
    totalImages: 160,
    averageDailyCost: 22.5,
    averageDailyImages: 80,
    maxDailyCost: 25,
    apiBreakdown: [
      { apiId: "volcengine", apiName: "火山引擎", totalCost: 5, color: "#1d4ed8" },
      { apiId: "yunwu", apiName: "云雾API", totalCost: 32, color: "#16a34a" },
      { apiId: "tangguo", apiName: "糖果姐姐API", totalCost: 8, color: "#db2777" },
    ],
  });
});

test("should return only the latest week when visible range is 1", () => {
  const summaries = buildWeeklySummaries(records, apis);

  const visible = getVisibleWeeklySummaries(summaries, 1);

  assert.equal(visible.length, 1);
  assert.equal(visible[0]?.weekKey, "2026-03-30");
});

test("should use 1 week as the default visible range", () => {
  assert.equal(DEFAULT_VISIBLE_WEEKS, 1);
});

test("should build daily trend data for each day in the selected week", () => {
  const summaries = buildWeeklySummaries(records, apis);
  const visible = getVisibleWeeklySummaries(summaries, 1);

  const trendData = buildWeeklyTrendDailyData(records, visible);

  assert.equal(trendData.length, 7);
  assert.deepEqual(trendData[0], {
    date: "2026-03-30",
    label: "03/30",
    当日费用: 10,
    图片数: 40,
  });
  assert.deepEqual(trendData[6], {
    date: "2026-04-05",
    label: "04/05",
    当日费用: 0,
    图片数: 0,
  });
});

test("should return selected week count based on current visible range", () => {
  const summaries = buildWeeklySummaries(records, apis);

  const visibleCount = getVisibleWeekCount(summaries, 1);

  assert.equal(visibleCount, 1);
});
