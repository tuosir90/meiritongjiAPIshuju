"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DailyRecord, ApiConfig } from "@/lib/types";
import { formatDate } from "@/lib/utils";

interface CostChartProps {
  records: DailyRecord[];
  apis: ApiConfig[];
}

export function CostChart({ records, apis }: CostChartProps) {
  // 准备图表数据
  const chartData = records
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((record) => {
      const dataPoint: any = {
        date: formatDate(record.date),
        总费用: record.totalCost,
        图片数: record.imageCount,
      };

      // 添加各API的费用
      record.apiCosts.forEach((apiCost) => {
        const api = apis.find((a) => a.id === apiCost.apiId);
        if (api) {
          dataPoint[api.name] = apiCost.cost;
        }
      });

      return dataPoint;
    });

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>费用趋势图</CardTitle>
          <CardDescription>暂无数据可展示</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // 颜色配置
  const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* 费用趋势折线图 */}
      <Card>
        <CardHeader>
          <CardTitle>费用趋势</CardTitle>
          <CardDescription>每日API费用变化趋势</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                fontSize={12}
                tickMargin={8}
              />
              <YAxis fontSize={12} />
              <Tooltip />
              <Legend />
              {apis.map((api, index) => (
                <Line
                  key={api.id}
                  type="monotone"
                  dataKey={api.name}
                  stroke={api.color || colors[index % colors.length]}
                  strokeWidth={2}
                />
              ))}
              <Line
                type="monotone"
                dataKey="总费用"
                stroke="#000000"
                strokeWidth={3}
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 图片生成量柱状图 */}
      <Card>
        <CardHeader>
          <CardTitle>图片生成量</CardTitle>
          <CardDescription>每日图片生成数量统计</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                fontSize={12}
                tickMargin={8}
              />
              <YAxis fontSize={12} />
              <Tooltip />
              <Legend />
              <Bar dataKey="图片数" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
