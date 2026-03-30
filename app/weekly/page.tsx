import type { Metadata } from "next";

import { WeeklySummaryPage } from "@/components/weekly-summary";

export const metadata: Metadata = {
  title: "周汇总统计",
  description: "按自然周查看 API 费用与生图数据汇总",
};

export default function WeeklyPage() {
  return <WeeklySummaryPage />;
}
