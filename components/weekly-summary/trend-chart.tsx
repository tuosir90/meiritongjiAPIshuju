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
import { WeeklySummary } from "@/lib/types";

interface WeeklyTrendChartProps {
  summaries: WeeklySummary[];
}

export function WeeklyTrendChart({ summaries }: WeeklyTrendChartProps) {
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

  const chartData = summaries
    .slice()
    .reverse()
    .map((summary) => ({
      label: summary.startDate.slice(5).replace("-", "/"),
      周总费用: summary.totalCost,
      周图片数: summary.totalImages,
      日均费用: summary.averageDailyCost,
    }));

  return (
    <Card className="border-white/60 bg-white/80 shadow-lg shadow-emerald-100/50 backdrop-blur dark:border-white/10 dark:bg-white/5 dark:shadow-none">
      <CardHeader>
        <CardTitle className="text-slate-950 dark:text-white">周趋势总览</CardTitle>
        <CardDescription>
          费用用柱图展示，图片产出与日均费用用折线补充，便于同时观察周度波动。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={360}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
            <XAxis dataKey="label" className="text-slate-600 dark:text-slate-400" fontSize={12} />
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
              dataKey="周总费用"
              fill="#0f766e"
              radius={[10, 10, 0, 0]}
              maxBarSize={52}
            />
            <Line
              yAxisId="images"
              type="monotone"
              dataKey="周图片数"
              stroke="#2563eb"
              strokeWidth={2.5}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              yAxisId="cost"
              type="monotone"
              dataKey="日均费用"
              stroke="#f97316"
              strokeWidth={2.5}
              dot={{ r: 3 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
