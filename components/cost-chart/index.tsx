"use client";

import { useMemo, useState } from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiConfig, DailyRecord } from "@/lib/types";
import { buildDailyChartData, buildMonthlyChartData } from "./data";
import { CostTrendCard } from "./cost-trend-card";
import { ImageCountCard } from "./image-count-card";
import { ViewMode } from "./types";

interface CostChartProps {
  records: DailyRecord[];
  apis: ApiConfig[];
}

export function CostChart({ records, apis }: CostChartProps) {
  const [costViewMode, setCostViewMode] = useState<ViewMode>("daily");
  const [imageViewMode, setImageViewMode] = useState<ViewMode>("daily");

  const dailyChartData = useMemo(() => buildDailyChartData(records, apis), [records, apis]);
  const monthlyChartData = useMemo(() => buildMonthlyChartData(records, apis), [records, apis]);

  if (records.length === 0) {
    return (
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle>费用趋势图</CardTitle>
          <CardDescription>暂无数据可展示</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <CostTrendCard
        apis={apis}
        viewMode={costViewMode}
        onViewModeChange={setCostViewMode}
        dailyData={dailyChartData}
        monthlyData={monthlyChartData}
      />
      <ImageCountCard
        viewMode={imageViewMode}
        onViewModeChange={setImageViewMode}
        dailyData={dailyChartData}
        monthlyData={monthlyChartData}
      />
    </div>
  );
}
