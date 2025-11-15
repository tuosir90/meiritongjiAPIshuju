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
import { TrendingUp, BarChart3 } from "lucide-react";

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
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle>费用趋势图</CardTitle>
          <CardDescription>暂无数据可展示</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // 颜色配置 - 更鲜艳的配色
  const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* 费用趋势折线图 */}
      <Card className="group border-slate-200 dark:border-slate-800 hover:shadow-xl transition-all duration-300">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                  费用趋势
                </span>
              </CardTitle>
              <CardDescription className="mt-2">每日API费用变化趋势</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
              <XAxis
                dataKey="date"
                fontSize={12}
                tickMargin={8}
                className="text-slate-600 dark:text-slate-400"
              />
              <YAxis fontSize={12} className="text-slate-600 dark:text-slate-400" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
                labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              {apis.map((api, index) => (
                <Line
                  key={api.id}
                  type="monotone"
                  dataKey={api.name}
                  stroke={api.color || colors[index % colors.length]}
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
              <Line
                type="monotone"
                dataKey="总费用"
                stroke="#1e293b"
                strokeWidth={3}
                strokeDasharray="5 5"
                dot={{ r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 图片生成量柱状图 */}
      <Card className="group border-slate-200 dark:border-slate-800 hover:shadow-xl transition-all duration-300">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                  图片生成量
                </span>
              </CardTitle>
              <CardDescription className="mt-2">每日图片生成数量统计</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
              <XAxis
                dataKey="date"
                fontSize={12}
                tickMargin={8}
                className="text-slate-600 dark:text-slate-400"
              />
              <YAxis fontSize={12} className="text-slate-600 dark:text-slate-400" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
                labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                cursor={{ fill: 'rgba(139, 92, 246, 0.1)' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar 
                dataKey="图片数" 
                fill="url(#colorGradient)" 
                radius={[8, 8, 0, 0]}
              />
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1} />
                  <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.8} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
