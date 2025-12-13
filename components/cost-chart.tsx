"use client";

import { useState, useMemo } from "react";
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
import { Button } from "@/components/ui/button";
import { DailyRecord, ApiConfig } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { TrendingUp, BarChart3, Calendar, CalendarDays } from "lucide-react";

interface CostChartProps {
  records: DailyRecord[];
  apis: ApiConfig[];
}

type ViewMode = "daily" | "monthly";

function formatMonth(monthStr: string) {
  const [year, month] = monthStr.split("-");
  return `${year}年${month}月`;
}

// 按月汇总数据
function aggregateByMonth(records: DailyRecord[], apis: ApiConfig[]) {
  const monthlyData: { [key: string]: any } = {};

  records.forEach((record) => {
    const date = new Date(record.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        month: monthKey,
        总费用: 0,
        图片数: 0,
      };

      // 初始化各API费用
      apis.forEach((api) => {
        monthlyData[monthKey][api.name] = 0;
      });
    }

    // 累加费用和图片数
    monthlyData[monthKey].总费用 += record.totalCost;
    monthlyData[monthKey].图片数 += record.imageCount;

    // 累加各API费用
    record.apiCosts.forEach((apiCost) => {
      const api = apis.find((a) => a.id === apiCost.apiId);
      if (api) {
        monthlyData[monthKey][api.name] += apiCost.cost;
      }
    });
  });

  // 转换为数组并排序
  return Object.values(monthlyData)
    .sort((a: any, b: any) => a.month.localeCompare(b.month))
    .map((item: any) => ({
      ...item,
      // 格式化月份显示
      displayMonth: formatMonth(item.month),
      // 保留两位小数
      总费用: Math.round(item.总费用 * 100) / 100,
      ...apis.reduce(
        (acc, api) => ({
          ...acc,
          [api.name]: Math.round(item[api.name] * 100) / 100,
        }),
        {}
      ),
    }));
}

export function CostChart({ records, apis }: CostChartProps) {
  const [costViewMode, setCostViewMode] = useState<ViewMode>("daily");
  const [imageViewMode, setImageViewMode] = useState<ViewMode>("daily");

  // 准备每日图表数据
  const dailyChartData = useMemo(() => {
    return records
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
  }, [records, apis]);

  // 准备每月图表数据
  const monthlyChartData = useMemo(() => {
    return aggregateByMonth(records, apis);
  }, [records, apis]);

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

  // 颜色配置
  const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* 费用趋势折线图 */}
      <Card className="group border-slate-200 dark:border-slate-800 hover:shadow-xl transition-all duration-300">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                  费用趋势
                </span>
              </CardTitle>
              <CardDescription className="mt-2">
                {costViewMode === "daily" ? "每日API费用变化趋势" : "每月API费用汇总统计"}
              </CardDescription>
            </div>
            <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              <Button
                variant={costViewMode === "daily" ? "default" : "ghost"}
                size="sm"
                onClick={() => setCostViewMode("daily")}
                className="h-8 px-3 text-xs"
              >
                <Calendar className="h-3 w-3 mr-1" />
                按日
              </Button>
              <Button
                variant={costViewMode === "monthly" ? "default" : "ghost"}
                size="sm"
                onClick={() => setCostViewMode("monthly")}
                className="h-8 px-3 text-xs"
              >
                <CalendarDays className="h-3 w-3 mr-1" />
                按月
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={costViewMode === "daily" ? dailyChartData : monthlyChartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
              <XAxis
                dataKey={costViewMode === "daily" ? "date" : "displayMonth"}
                fontSize={12}
                tickMargin={8}
                className="text-slate-600 dark:text-slate-400"
                angle={costViewMode === "monthly" ? -45 : 0}
                textAnchor={costViewMode === "monthly" ? "end" : "middle"}
                height={costViewMode === "monthly" ? 60 : 30}
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
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                  图片生成量
                </span>
              </CardTitle>
              <CardDescription className="mt-2">
                {imageViewMode === "daily" ? "每日图片生成数量统计" : "每月图片生成数量汇总"}
              </CardDescription>
            </div>
            <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              <Button
                variant={imageViewMode === "daily" ? "default" : "ghost"}
                size="sm"
                onClick={() => setImageViewMode("daily")}
                className="h-8 px-3 text-xs"
              >
                <Calendar className="h-3 w-3 mr-1" />
                按日
              </Button>
              <Button
                variant={imageViewMode === "monthly" ? "default" : "ghost"}
                size="sm"
                onClick={() => setImageViewMode("monthly")}
                className="h-8 px-3 text-xs"
              >
                <CalendarDays className="h-3 w-3 mr-1" />
                按月
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={imageViewMode === "daily" ? dailyChartData : monthlyChartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
              <XAxis
                dataKey={imageViewMode === "daily" ? "date" : "displayMonth"}
                fontSize={12}
                tickMargin={8}
                className="text-slate-600 dark:text-slate-400"
                angle={imageViewMode === "monthly" ? -45 : 0}
                textAnchor={imageViewMode === "monthly" ? "end" : "middle"}
                height={imageViewMode === "monthly" ? 60 : 30}
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
