"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ApiConfig } from "@/lib/types";
import { Calendar, CalendarDays, TrendingUp } from "lucide-react";
import { ChartDataPoint, ViewMode } from "./types";

interface CostTrendCardProps {
  apis: ApiConfig[];
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  dailyData: ChartDataPoint[];
  monthlyData: ChartDataPoint[];
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export function CostTrendCard({
  apis,
  viewMode,
  onViewModeChange,
  dailyData,
  monthlyData,
}: CostTrendCardProps) {
  const chartData = viewMode === "daily" ? dailyData : monthlyData;

  return (
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
              {viewMode === "daily" ? "每日API费用变化趋势" : "每月API费用汇总统计"}
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
          <LineChart data={chartData}>
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
            />
            <Legend wrapperStyle={{ paddingTop: "20px" }} />
            {apis.map((api, index) => (
              <Line
                key={api.id}
                type="monotone"
                dataKey={api.name}
                stroke={api.color || COLORS[index % COLORS.length]}
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
  );
}
