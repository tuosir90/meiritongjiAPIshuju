import assert from "node:assert/strict";
import test from "node:test";

import { buildDailyChartData, buildMonthlyChartData } from "./data.ts";
import type { ApiConfig, DailyRecord } from "../../lib/types.ts";

const apis: ApiConfig[] = [
  { id: "manxiaobai", name: "馒小白", color: "#8b5cf6" },
  { id: "xinshijie", name: "新世界API", color: "#14b8a6" },
];

const records: DailyRecord[] = [
  {
    id: "2026-06-29-1",
    date: "2026-06-29",
    apiCosts: [{ apiId: "manxiaobai", cost: 5 }],
    imageCount: 10,
    totalCost: 5,
  },
  {
    id: "2026-06-30-1",
    date: "2026-06-30",
    apiCosts: [
      { apiId: "manxiaobai", cost: 5 },
      { apiId: "xinshijie", cost: 6.78 },
    ],
    imageCount: 12,
    totalCost: 11.78,
  },
];

test("daily chart data should show zero for missing xinshijie history", () => {
  const chartData = buildDailyChartData(records, apis);

  assert.equal(chartData[0]["新世界API"], 0);
  assert.equal(chartData[1]["新世界API"], 6.78);
});

test("monthly chart data should include xinshijie zero values in aggregation", () => {
  const chartData = buildMonthlyChartData(records, apis);

  assert.equal(chartData[0]["新世界API"], 6.78);
});
