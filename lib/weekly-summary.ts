import type { ApiConfig, DailyRecord, WeeklySummary } from "./types.ts";

export const DEFAULT_VISIBLE_WEEKS = 1;

interface WeeklyTrendDailyPoint {
  date: string;
  label: string;
  当日费用: number;
  图片数: number;
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatSlashDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}/${month}/${day}`;
}

function getWeekRange(dateString: string) {
  const current = new Date(`${dateString}T00:00:00`);
  const day = current.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const startDate = new Date(current);
  startDate.setDate(current.getDate() + diffToMonday);

  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);

  return {
    startDate,
    endDate,
  };
}

function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100;
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function formatMonthDay(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${month}/${day}`;
}

export function buildWeeklySummaries(
  records: DailyRecord[],
  apis: ApiConfig[]
): WeeklySummary[] {
  const weeklyMap = new Map<string, WeeklySummary>();

  records.forEach((record) => {
    const { startDate, endDate } = getWeekRange(record.date);
    const weekKey = toIsoDate(startDate);
    const existing = weeklyMap.get(weekKey);

    if (!existing) {
      weeklyMap.set(weekKey, {
        weekKey,
        weekLabel: `${formatSlashDate(startDate)} - ${formatSlashDate(endDate)}`,
        startDate: weekKey,
        endDate: toIsoDate(endDate),
        recordCount: 0,
        totalCost: 0,
        totalImages: 0,
        averageDailyCost: 0,
        averageDailyImages: 0,
        maxDailyCost: 0,
        apiBreakdown: apis.map((api) => ({
          apiId: api.id,
          apiName: api.name,
          totalCost: 0,
          color: api.color,
        })),
      });
    }

    const summary = weeklyMap.get(weekKey)!;
    summary.recordCount += 1;
    summary.totalCost = roundToTwo(summary.totalCost + record.totalCost);
    summary.totalImages += record.imageCount;
    summary.maxDailyCost = Math.max(summary.maxDailyCost, record.totalCost);

    record.apiCosts.forEach((apiCost) => {
      const target = summary.apiBreakdown.find((item) => item.apiId === apiCost.apiId);
      if (target) {
        target.totalCost = roundToTwo(target.totalCost + apiCost.cost);
      }
    });
  });

  return Array.from(weeklyMap.values())
    .map((summary) => ({
      ...summary,
      averageDailyCost: roundToTwo(summary.totalCost / summary.recordCount),
      averageDailyImages: roundToTwo(summary.totalImages / summary.recordCount),
    }))
    .sort((a, b) => b.startDate.localeCompare(a.startDate));
}

export function getVisibleWeeklySummaries(
  summaries: WeeklySummary[],
  visibleWeeks: number
): WeeklySummary[] {
  if (visibleWeeks === -1) {
    return summaries;
  }

  return summaries.slice(0, visibleWeeks);
}

export function getVisibleWeekCount(
  summaries: WeeklySummary[],
  visibleWeeks: number
): number {
  return getVisibleWeeklySummaries(summaries, visibleWeeks).length;
}

export function buildCombinedWeeklySummary(
  summaries: WeeklySummary[]
): WeeklySummary | undefined {
  if (summaries.length === 0) {
    return undefined;
  }

  const orderedSummaries = summaries
    .slice()
    .sort((a, b) => b.startDate.localeCompare(a.startDate));
  const newestSummary = orderedSummaries[0];
  const oldestSummary = orderedSummaries[orderedSummaries.length - 1];
  const apiBreakdownMap = new Map<string, WeeklySummary["apiBreakdown"][number]>();

  let totalCost = 0;
  let totalImages = 0;
  let recordCount = 0;
  let maxDailyCost = 0;

  orderedSummaries.forEach((summary) => {
    totalCost += summary.totalCost;
    totalImages += summary.totalImages;
    recordCount += summary.recordCount;
    maxDailyCost = Math.max(maxDailyCost, summary.maxDailyCost);

    summary.apiBreakdown.forEach((api) => {
      const existing = apiBreakdownMap.get(api.apiId);
      if (existing) {
        existing.totalCost = roundToTwo(existing.totalCost + api.totalCost);
        return;
      }

      apiBreakdownMap.set(api.apiId, { ...api });
    });
  });

  return {
    weekKey: `${oldestSummary.startDate}_${newestSummary.endDate}`,
    weekLabel: `${formatSlashDate(new Date(`${oldestSummary.startDate}T00:00:00`))} - ${formatSlashDate(new Date(`${newestSummary.endDate}T00:00:00`))}`,
    startDate: oldestSummary.startDate,
    endDate: newestSummary.endDate,
    recordCount,
    totalCost: roundToTwo(totalCost),
    totalImages,
    averageDailyCost: recordCount > 0 ? roundToTwo(totalCost / recordCount) : 0,
    averageDailyImages: recordCount > 0 ? roundToTwo(totalImages / recordCount) : 0,
    maxDailyCost,
    apiBreakdown: Array.from(apiBreakdownMap.values()),
  };
}

export function buildPreviousCombinedWeeklySummary(
  summaries: WeeklySummary[],
  selectedWeekCount: number
): WeeklySummary | undefined {
  if (selectedWeekCount <= 0) {
    return undefined;
  }

  return buildCombinedWeeklySummary(
    summaries.slice(selectedWeekCount, selectedWeekCount * 2)
  );
}

export function buildWeeklyTrendDailyData(
  records: DailyRecord[],
  summaries: WeeklySummary[]
): WeeklyTrendDailyPoint[] {
  const recordMap = new Map(records.map((record) => [record.date, record]));

  return summaries
    .slice()
    .reverse()
    .flatMap((summary) => {
      const points: WeeklyTrendDailyPoint[] = [];
      let currentDate = new Date(`${summary.startDate}T00:00:00`);
      const endDate = new Date(`${summary.endDate}T00:00:00`);

      while (currentDate <= endDate) {
        const isoDate = toIsoDate(currentDate);
        const record = recordMap.get(isoDate);
        points.push({
          date: isoDate,
          label: formatMonthDay(currentDate),
          当日费用: roundToTwo(record?.totalCost ?? 0),
          图片数: record?.imageCount ?? 0,
        });
        currentDate = addDays(currentDate, 1);
      }

      return points;
    });
}
