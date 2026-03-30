"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { ArrowLeft, CalendarRange, RefreshCw } from "lucide-react";

import { DashboardFooter } from "@/components/dashboard/footer";
import { RefreshToast } from "@/components/dashboard/refresh-toast";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/hooks/use-app-data";
import {
  buildWeeklySummaries,
  DEFAULT_VISIBLE_WEEKS,
  getVisibleWeeklySummaries,
} from "@/lib/weekly-summary";
import { RefreshMessage } from "@/components/dashboard/types";
import { WeeklySummaryHero } from "./summary-hero";
import { WeeklyTrendChart } from "./trend-chart";
import { WeeklySummaryTable } from "./summary-table";

const RANGE_OPTIONS = [
  { label: "1周", value: 1 },
  { label: "4周", value: 4 },
  { label: "8周", value: 8 },
  { label: "12周", value: 12 },
  { label: "全部", value: -1 },
];

export function WeeklySummaryPage() {
  const { data, isLoading, isRefreshing, refreshData } = useAppData();
  const [refreshMessage, setRefreshMessage] = useState<RefreshMessage | null>(null);
  const [visibleWeeks, setVisibleWeeks] = useState(DEFAULT_VISIBLE_WEEKS);
  const [isPending, startTransition] = useTransition();

  const weeklySummaries = useMemo(
    () => buildWeeklySummaries(data.records, data.apis),
    [data.records, data.apis]
  );

  const displayedSummaries = useMemo(() => {
    return getVisibleWeeklySummaries(weeklySummaries, visibleWeeks);
  }, [visibleWeeks, weeklySummaries]);

  const latestWeek = displayedSummaries[0];
  const previousWeek = weeklySummaries[1];

  const handleRefresh = async () => {
    const result = await refreshData();
    setRefreshMessage({
      type: result.success ? "success" : "error",
      text: result.message,
    });
    setTimeout(() => setRefreshMessage(null), 3000);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="text-lg font-medium">正在准备周汇总视图...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.12),_transparent_28%),radial-gradient(circle_at_80%_10%,_rgba(56,189,248,0.16),_transparent_24%),linear-gradient(180deg,_#f8fafc_0%,_#eefbf4_45%,_#f8fafc_100%)] dark:bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_24%),radial-gradient(circle_at_80%_10%,_rgba(14,165,233,0.18),_transparent_20%),linear-gradient(180deg,_#020617_0%,_#052e2b_48%,_#020617_100%)]">
      <RefreshToast message={refreshMessage} />

      <header className="sticky top-0 z-50 border-b border-white/50 bg-white/75 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70">
        <div className="container mx-auto flex flex-col gap-4 px-4 py-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Button asChild variant="outline" size="sm" className="border-white/60 bg-white/70 dark:border-white/10 dark:bg-white/5">
                <Link href="/">
                  <ArrowLeft className="h-4 w-4" />
                  返回总览
                </Link>
              </Button>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-emerald-50/80 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                <CalendarRange className="h-3.5 w-3.5" />
                自然周汇总
              </span>
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
                一周数据汇总统计
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                单独页面查看每周费用、图片产出、峰值与 API 构成。
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {RANGE_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant={visibleWeeks === option.value ? "default" : "outline"}
                size="sm"
                onClick={() => startTransition(() => setVisibleWeeks(option.value))}
                className={visibleWeeks === option.value ? "bg-slate-950 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200" : "border-white/60 bg-white/70 dark:border-white/10 dark:bg-white/5"}
              >
                {isPending && visibleWeeks === option.value ? "切换中..." : option.label}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="border-white/60 bg-white/70 dark:border-white/10 dark:bg-white/5"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "刷新中..." : "刷新数据"}
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto space-y-6 px-4 py-8">
        <WeeklySummaryHero
          latestWeek={latestWeek}
          previousWeek={previousWeek}
          totalWeeks={weeklySummaries.length}
          version={data.version}
        />
        <WeeklyTrendChart summaries={displayedSummaries} />
        <WeeklySummaryTable summaries={displayedSummaries} />
      </main>

      <DashboardFooter />
    </div>
  );
}
