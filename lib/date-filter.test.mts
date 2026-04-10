import assert from "node:assert/strict";
import test from "node:test";

import { filterRecordsByDate } from "./date-filter.ts";
import type { DailyRecord } from "./types.ts";

const records: DailyRecord[] = [
  {
    id: "2026-03-31-1",
    date: "2026-03-31",
    apiCosts: [],
    imageCount: 120,
    totalCost: 12,
  },
  {
    id: "2026-04-01-1",
    date: "2026-04-01",
    apiCosts: [],
    imageCount: 180,
    totalCost: 18,
  },
  {
    id: "2026-04-30-1",
    date: "2026-04-30",
    apiCosts: [],
    imageCount: 260,
    totalCost: 26,
  },
  {
    id: "2026-05-01-1",
    date: "2026-05-01",
    apiCosts: [],
    imageCount: 300,
    totalCost: 30,
  },
];

test("should keep only records inside the selected month range", () => {
  const filtered = filterRecordsByDate(records, {
    startDate: "2026-04-01",
    endDate: "2026-04-30",
    label: "2026年4月",
  });

  assert.deepEqual(
    filtered.map((record) => record.id),
    ["2026-04-01-1", "2026-04-30-1"]
  );
});

test("should return all records when no date range is selected", () => {
  const filtered = filterRecordsByDate(records, {
    startDate: null,
    endDate: null,
    label: "全部",
  });

  assert.deepEqual(filtered, records);
});
