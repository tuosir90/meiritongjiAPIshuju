import type { ApiConfig, DailyRecord, WeeklySummary } from "./types.ts";

export const DEFAULT_VISIBLE_WEEKS = 1;

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
