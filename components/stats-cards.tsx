"use client";

import { DollarSign, Image, TrendingUp, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DailyRecord } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { calculateTotalCost, calculateTotalImages } from "@/lib/storage";

interface StatsCardsProps {
  records: DailyRecord[];
}

export function StatsCards({ records }: StatsCardsProps) {
  const totalCost = calculateTotalCost(records);
  const totalImages = calculateTotalImages(records);
  const recordCount = records.length;
  const avgDailyCost = recordCount > 0 ? totalCost / recordCount : 0;
  const avgDailyImages = recordCount > 0 ? totalImages / recordCount : 0;

  const stats = [
    {
      title: "累计总费用",
      value: formatCurrency(totalCost),
      icon: DollarSign,
      description: "所有记录的总费用",
      gradient: "from-blue-500 to-cyan-500",
      bgLight: "bg-blue-50 dark:bg-blue-950/30",
      textColor: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "累计图片数",
      value: totalImages.toLocaleString(),
      icon: Image,
      description: "生成的图片总数",
      gradient: "from-purple-500 to-pink-500",
      bgLight: "bg-purple-50 dark:bg-purple-950/30",
      textColor: "text-purple-600 dark:text-purple-400",
    },
    {
      title: "平均每日费用",
      value: formatCurrency(avgDailyCost),
      icon: TrendingUp,
      description: "日均费用统计",
      gradient: "from-emerald-500 to-teal-500",
      bgLight: "bg-emerald-50 dark:bg-emerald-950/30",
      textColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      title: "平均每日生图",
      value: Math.round(avgDailyImages).toLocaleString(),
      icon: Image,
      description: "日均生成图片数",
      gradient: "from-orange-500 to-red-500",
      bgLight: "bg-orange-50 dark:bg-orange-950/30",
      textColor: "text-orange-600 dark:text-orange-400",
    },
    {
      title: "记录天数",
      value: recordCount,
      icon: Calendar,
      description: "已记录的天数",
      gradient: "from-indigo-500 to-purple-500",
      bgLight: "bg-indigo-50 dark:bg-indigo-950/30",
      textColor: "text-indigo-600 dark:text-indigo-400",
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card 
            key={index} 
            className="group relative overflow-hidden border-slate-200 dark:border-slate-800 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {stat.title}
              </CardTitle>
              <div className={`${stat.bgLight} p-2 rounded-lg transition-transform group-hover:scale-110 duration-300`}>
                <Icon className={`h-4 w-4 ${stat.textColor}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
                {stat.value}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
            {/* 装饰性渐变背景 */}
            <div className={`absolute -right-8 -bottom-8 w-24 h-24 bg-gradient-to-r ${stat.gradient} opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity`}></div>
          </Card>
        );
      })}
    </div>
  );
}
