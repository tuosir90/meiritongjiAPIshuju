import { ApiConfig, DailyRecord } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { ChartDataPoint } from "./types";

function formatMonth(monthStr: string) {
  const [year, month] = monthStr.split("-");
  return `${year}年${month}月`;
}

function aggregateByMonth(records: DailyRecord[], apis: ApiConfig[]): ChartDataPoint[] {
  const monthlyData: Record<string, Record<string, number | string>> = {};

  records.forEach((record) => {
    const date = new Date(record.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        month: monthKey,
        总费用: 0,
        图片数: 0,
      };

      apis.forEach((api) => {
        monthlyData[monthKey][api.name] = 0;
      });
    }

    const monthData = monthlyData[monthKey];
    monthData.总费用 = Number(monthData.总费用) + record.totalCost;
    monthData.图片数 = Number(monthData.图片数) + record.imageCount;

    record.apiCosts.forEach((apiCost) => {
      const api = apis.find((item) => item.id === apiCost.apiId);
      if (api) {
        monthData[api.name] = Number(monthData[api.name]) + apiCost.cost;
      }
    });
  });

  return Object.values(monthlyData)
    .sort((a, b) => String(a.month).localeCompare(String(b.month)))
    .map((item) => ({
      ...item,
      displayMonth: formatMonth(String(item.month)),
      总费用: Math.round(Number(item.总费用) * 100) / 100,
      ...apis.reduce(
        (acc, api) => ({
          ...acc,
          [api.name]: Math.round(Number(item[api.name]) * 100) / 100,
        }),
        {}
      ),
    }));
}

export function buildDailyChartData(records: DailyRecord[], apis: ApiConfig[]): ChartDataPoint[] {
  return records
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((record) => {
      const dataPoint: ChartDataPoint = {
        date: formatDate(record.date),
        总费用: record.totalCost,
        图片数: record.imageCount,
      };

      record.apiCosts.forEach((apiCost) => {
        const api = apis.find((item) => item.id === apiCost.apiId);
        if (api) {
          dataPoint[api.name] = apiCost.cost;
        }
      });

      return dataPoint;
    });
}

export function buildMonthlyChartData(records: DailyRecord[], apis: ApiConfig[]): ChartDataPoint[] {
  return aggregateByMonth(records, apis);
}
