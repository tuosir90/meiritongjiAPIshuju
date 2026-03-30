import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DailyRecord, WeeklySummary } from "@/lib/types";
import { buildWeeklyTrendDailyData } from "@/lib/weekly-summary";

interface WeeklyTrendChartProps {
  records: DailyRecord[];
  summaries: WeeklySummary[];
}

export function WeeklyTrendChart({ records, summaries }: WeeklyTrendChartProps) {
  if (summaries.length === 0) {
    return (
      <Card className="border-white/60 bg-white/80 shadow-lg shadow-emerald-100/50 backdrop-blur dark:border-white/10 dark:bg-white/5 dark:shadow-none">
        <CardHeader>
          <CardTitle className="text-slate-950 dark:text-white">周趋势总览</CardTitle>
          <CardDescription>暂无可展示的周汇总数据。</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const chartData = buildWeeklyTrendDailyData(records, summaries);
  const isDense = chartData.length > 10;

  return (
    <Card className="border-white/60 bg-white/80 shadow-lg shadow-emerald-100/50 backdrop-blur dark:border-white/10 dark:bg-white/5 dark:shadow-none">
      <CardHeader>
        <CardTitle className="text-slate-950 dark:text-white">周趋势总览</CardTitle>
        <CardDescription>
          横坐标改为每日日期，费用与图片产出都按天展示，便于看清一周内每天的数据波动。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={360}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
            <XAxis
              dataKey="label"
              className="text-slate-600 dark:text-slate-400"
              fontSize={12}
              angle={isDense ? -35 : 0}
              textAnchor={isDense ? "end" : "middle"}
              height={isDense ? 56 : 30}
              minTickGap={isDense ? 6 : 12}
            />
            <YAxis
              yAxisId="cost"
              className="text-slate-600 dark:text-slate-400"
              fontSize={12}
            />
            <YAxis
              yAxisId="images"
              orientation="right"
              className="text-slate-600 dark:text-slate-400"
              fontSize={12}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255,255,255,0.96)",
                border: "1px solid #dbeafe",
                borderRadius: "16px",
                boxShadow: "0 18px 45px -28px rgba(15, 23, 42, 0.5)",
              }}
            />
            <Legend />
            <Bar
              yAxisId="cost"
              dataKey="当日费用"
              fill="#0f766e"
              radius={[10, 10, 0, 0]}
              maxBarSize={36}
            />
            <Line
              yAxisId="images"
              type="monotone"
              dataKey="图片数"
              stroke="#2563eb"
              strokeWidth={2.5}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
