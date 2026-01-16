import { DateFilter, MonthOption } from "./types";

export function createEmptyFilter(): DateFilter {
  return {
    startDate: null,
    endDate: null,
    label: "全部",
  };
}

export function getQuickDateRange(type: string, baseDate = new Date()): DateFilter {
  const today = new Date(baseDate);
  const year = today.getFullYear();
  const month = today.getMonth();

  switch (type) {
    case "last7days": {
      const last7 = new Date(today);
      last7.setDate(last7.getDate() - 6);
      return {
        startDate: last7.toISOString().split("T")[0],
        endDate: today.toISOString().split("T")[0],
        label: "最近7天",
      };
    }
    case "last30days": {
      const last30 = new Date(today);
      last30.setDate(last30.getDate() - 29);
      return {
        startDate: last30.toISOString().split("T")[0],
        endDate: today.toISOString().split("T")[0],
        label: "最近30天",
      };
    }
    case "thisMonth": {
      const monthStart = new Date(year, month, 1);
      return {
        startDate: monthStart.toISOString().split("T")[0],
        endDate: today.toISOString().split("T")[0],
        label: "本月",
      };
    }
    case "lastMonth": {
      const lastMonthStart = new Date(year, month - 1, 1);
      const lastMonthEnd = new Date(year, month, 0);
      return {
        startDate: lastMonthStart.toISOString().split("T")[0],
        endDate: lastMonthEnd.toISOString().split("T")[0],
        label: "上月",
      };
    }
    default:
      return createEmptyFilter();
  }
}

export function getMonthOptions(count = 12, baseDate = new Date()): MonthOption[] {
  const months: MonthOption[] = [];
  for (let i = 0; i < count; i += 1) {
    const date = new Date(baseDate.getFullYear(), baseDate.getMonth() - i, 1);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const monthStr = `${year}-${month.toString().padStart(2, "0")}`;
    months.push({
      value: monthStr,
      label: `${year}年${month}月`,
    });
  }
  return months;
}

export function getMonthRange(monthStr: string): DateFilter {
  const [year, month] = monthStr.split("-").map(Number);
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0);

  return {
    startDate: monthStart.toISOString().split("T")[0],
    endDate: monthEnd.toISOString().split("T")[0],
    label: `${year}年${month}月`,
  };
}
