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
    },
    {
      title: "累计图片数",
      value: totalImages.toLocaleString(),
      icon: Image,
      description: "生成的图片总数",
    },
    {
      title: "平均每日费用",
      value: formatCurrency(avgDailyCost),
      icon: TrendingUp,
      description: "日均费用统计",
    },
    {
      title: "平均每日生图",
      value: Math.round(avgDailyImages).toLocaleString(),
      icon: Image,
      description: "日均生成图片数",
    },
    {
      title: "记录天数",
      value: recordCount,
      icon: Calendar,
      description: "已记录的天数",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
