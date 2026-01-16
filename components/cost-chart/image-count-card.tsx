"use client";

import {
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
import { BarChart3, Calendar, CalendarDays } from "lucide-react";
import { ChartDataPoint, ViewMode } from "./types";

interface ImageCountCardProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  dailyData: ChartDataPoint[];
  monthlyData: ChartDataPoint[];
}

export function ImageCountCard({
  viewMode,
  onViewModeChange,
  dailyData,
  monthlyData,
}: ImageCountCardProps) {
  const chartData = viewMode === "daily" ? dailyData : monthlyData;

  return (
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
              {viewMode === "daily" ? "每日图片生成数量统计" : "每月图片生成数量汇总"}
            </CardDescription>
          </div>
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            <Button
              variant={viewMode === "daily" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange("daily")}
              className="h-8 px-3 text-xs"
            >
              <Calendar className="h-3 w-3 mr-1" />
              按日
            </Button>
            <Button
              variant={viewMode === "monthly" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange("monthly")}
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
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
            <XAxis
              dataKey={viewMode === "daily" ? "date" : "displayMonth"}
              fontSize={12}
              tickMargin={8}
              className="text-slate-600 dark:text-slate-400"
              angle={viewMode === "monthly" ? -45 : 0}
              textAnchor={viewMode === "monthly" ? "end" : "middle"}
              height={viewMode === "monthly" ? 60 : 30}
            />
            <YAxis fontSize={12} className="text-slate-600 dark:text-slate-400" />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
              labelStyle={{ fontWeight: "bold", color: "#1e293b" }}
              cursor={{ fill: "rgba(139, 92, 246, 0.1)" }}
            />
            <Legend wrapperStyle={{ paddingTop: "20px" }} />
            <Bar dataKey="图片数" fill="url(#colorGradient)" radius={[8, 8, 0, 0]} />
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
  );
}
