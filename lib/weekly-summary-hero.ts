import type { WeeklySummary } from "./types.ts";
import { formatCurrency } from "./utils.ts";

export interface WeeklyHeroStat {
  label: string;
  value: string;
  note: string;
  iconName: "totalCost" | "totalImages" | "averageCost" | "weekCount";
}

function formatDelta(current: number, previous?: number) {
  if (previous === undefined) {
    return "暂无上周数据可对比";
  }

  const delta = current - previous;
  if (delta === 0) {
    return "与上一周持平";
  }

  const prefix = delta > 0 ? "+" : "";
  return `${prefix}${formatCurrency(delta)} 较上一周`;
}

export function getWeeklyHeroStats(
  latestWeek: WeeklySummary,
  previousWeek: WeeklySummary | undefined,
  totalWeeks: number,
  version?: string
): WeeklyHeroStat[] {
  return [
    {
      label: "周总费用",
      value: formatCurrency(latestWeek.totalCost),
      note: formatDelta(latestWeek.totalCost, previousWeek?.totalCost),
      iconName: "totalCost",
    },
    {
      label: "周图片数",
      value: latestWeek.totalImages.toLocaleString(),
      note: `日均 ${Math.round(latestWeek.averageDailyImages).toLocaleString()} 张`,
      iconName: "totalImages",
    },
    {
      label: "平均费用",
      value: formatCurrency(latestWeek.averageDailyCost),
      note: `基于 ${latestWeek.recordCount} 天记录`,
      iconName: "averageCost",
    },
    {
      label: "统计周数",
      value: totalWeeks.toString(),
      note: version ? `数据版本 ${version}` : "已按自然周聚合",
      iconName: "weekCount",
    },
  ];
}
