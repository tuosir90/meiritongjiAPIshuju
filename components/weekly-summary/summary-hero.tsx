import { ArrowUpRight, CalendarDays, Package, Sparkles, TrendingUp } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { WeeklySummary } from "@/lib/types";
import { getWeeklyHeroStats } from "@/lib/weekly-summary-hero";

interface WeeklySummaryHeroProps {
  latestWeek?: WeeklySummary;
  previousWeek?: WeeklySummary;
  totalWeeks: number;
  version?: string;
}

export function WeeklySummaryHero({
  latestWeek,
  previousWeek,
  totalWeeks,
  version,
}: WeeklySummaryHeroProps) {
  if (!latestWeek) {
    return (
      <Card className="border-dashed border-slate-300 bg-white/60 shadow-sm dark:border-white/15 dark:bg-white/5">
        <CardContent className="py-16 text-center text-slate-600 dark:text-slate-300">
          当前还没有可汇总的周数据。
        </CardContent>
      </Card>
    );
  }

  const topApi = latestWeek.apiBreakdown
    .slice()
    .sort((a, b) => b.totalCost - a.totalCost)[0];

  const statCards = getWeeklyHeroStats(latestWeek, previousWeek, totalWeeks, version);

  const iconMap = {
    totalCost: Sparkles,
    totalImages: Package,
    averageCost: TrendingUp,
    weekCount: CalendarDays,
  } as const;

  return (
    <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
      <Card className="relative overflow-hidden border-0 bg-slate-950 text-white shadow-[0_24px_80px_-32px_rgba(15,23,42,0.8)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.28),_transparent_28%),radial-gradient(circle_at_80%_20%,_rgba(16,185,129,0.22),_transparent_24%),linear-gradient(135deg,_rgba(15,23,42,0.98),_rgba(12,74,110,0.92))]" />
        <CardContent className="relative space-y-8 p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.24em] text-sky-100">
                Weekly Pulse
              </p>
              <div className="space-y-2">
                <h2 className="text-3xl font-semibold tracking-tight">{latestWeek.weekLabel}</h2>
                <p className="max-w-2xl text-sm leading-6 text-slate-200">
                  这里集中展示当前选中周期的费用产出、峰值与 API 构成，方便做周度复盘。
                </p>
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/10 px-4 py-3 text-right shadow-lg shadow-slate-950/20">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-300">主导 API</div>
              <div className="mt-2 text-xl font-semibold">{topApi?.apiName || "暂无数据"}</div>
              <div className="mt-1 text-sm text-emerald-200">
                {topApi ? formatCurrency(topApi.totalCost) : formatCurrency(0)}
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {statCards.map((item) => {
              const Icon = iconMap[item.iconName];
              return (
                <div
                  key={item.label}
                  className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-300">{item.label}</span>
                    <Icon className="h-4 w-4 text-sky-200" />
                  </div>
                  <div className="mt-5 text-3xl font-semibold tracking-tight">{item.value}</div>
                  <div className="mt-3 flex items-center gap-2 text-sm text-slate-300">
                    <ArrowUpRight className="h-4 w-4 text-emerald-300" />
                    {item.note}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/60 bg-white/80 shadow-lg shadow-emerald-100/50 backdrop-blur dark:border-white/10 dark:bg-white/5 dark:shadow-none">
        <CardContent className="space-y-5 p-6">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-300">
              当前选中周期 API 构成
            </p>
            <h3 className="text-2xl font-semibold text-slate-950 dark:text-white">费用分布</h3>
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
              按当前选中周期聚合各 API 的费用，快速判断当前成本主要集中在哪个渠道。
            </p>
          </div>

          <div className="space-y-4">
            {latestWeek.apiBreakdown.map((item) => {
              const ratio = latestWeek.totalCost > 0 ? (item.totalCost / latestWeek.totalCost) * 100 : 0;
              return (
                <div key={item.apiId} className="space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-medium text-slate-900 dark:text-slate-100">{item.apiName}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        占比 {ratio.toFixed(1)}%
                      </div>
                    </div>
                    <div className="text-right font-semibold text-slate-900 dark:text-slate-100">
                      {formatCurrency(item.totalCost)}
                    </div>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(ratio, item.totalCost > 0 ? 6 : 0)}%`,
                        backgroundColor: item.color || "#10b981",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
