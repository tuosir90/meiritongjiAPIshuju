"use client";

import { useState } from "react";
import { Calendar, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface DateFilter {
  startDate: string | null;
  endDate: string | null;
  label: string;
}

interface DateFilterProps {
  onFilterChange: (filter: DateFilter) => void;
  currentFilter: DateFilter;
}

export function DateFilterComponent({ onFilterChange, currentFilter }: DateFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const getDateRange = (type: string): DateFilter => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    switch (type) {
      case "last7days":
        const last7 = new Date(today);
        last7.setDate(last7.getDate() - 6);
        return {
          startDate: last7.toISOString().split("T")[0],
          endDate: today.toISOString().split("T")[0],
          label: "最近7天"
        };

      case "last30days":
        const last30 = new Date(today);
        last30.setDate(last30.getDate() - 29);
        return {
          startDate: last30.toISOString().split("T")[0],
          endDate: today.toISOString().split("T")[0],
          label: "最近30天"
        };

      case "thisMonth":
        const monthStart = new Date(year, month, 1);
        return {
          startDate: monthStart.toISOString().split("T")[0],
          endDate: today.toISOString().split("T")[0],
          label: "本月"
        };

      case "lastMonth":
        const lastMonthStart = new Date(year, month - 1, 1);
        const lastMonthEnd = new Date(year, month, 0);
        return {
          startDate: lastMonthStart.toISOString().split("T")[0],
          endDate: lastMonthEnd.toISOString().split("T")[0],
          label: "上月"
        };

      default:
        return {
          startDate: null,
          endDate: null,
          label: "全部"
        };
    }
  };

  const handleQuickSelect = (type: string) => {
    const filter = getDateRange(type);
    onFilterChange(filter);
    setIsOpen(false);
  };

  const handleCustomApply = () => {
    if (startDate && endDate) {
      onFilterChange({
        startDate,
        endDate,
        label: `自定义 (${startDate} ~ ${endDate})`
      });
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    onFilterChange({
      startDate: null,
      endDate: null,
      label: "全部"
    });
    setStartDate("");
    setEndDate("");
    setIsOpen(false);
  };

  // 生成最近12个月的选项
  const getMonthOptions = () => {
    const months = [];
    const today = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const monthStr = `${year}-${month.toString().padStart(2, "0")}`;
      months.push({
        value: monthStr,
        label: `${year}年${month}月`
      });
    }
    return months;
  };

  const handleMonthSelect = (monthStr: string) => {
    const [year, month] = monthStr.split("-").map(Number);
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0);

    onFilterChange({
      startDate: monthStart.toISOString().split("T")[0],
      endDate: monthEnd.toISOString().split("T")[0],
      label: `${year}年${month}月`
    });
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 dark:hover:bg-blue-950 dark:hover:text-blue-400 transition-all"
        >
          <Calendar className="mr-2 h-4 w-4" />
          {currentFilter.label}
          {currentFilter.startDate && (
            <X
              className="ml-2 h-3 w-3"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
            />
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>日期筛选</DialogTitle>
          <DialogDescription>选择日期范围来筛选数据</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 快速选择 */}
          <div>
            <Label className="text-sm font-semibold mb-3 block">快速选择</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickSelect("last7days")}
                className="hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-950"
              >
                最近7天
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickSelect("last30days")}
                className="hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-950"
              >
                最近30天
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickSelect("thisMonth")}
                className="hover:bg-green-50 hover:border-green-300 dark:hover:bg-green-950"
              >
                本月
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickSelect("lastMonth")}
                className="hover:bg-green-50 hover:border-green-300 dark:hover:bg-green-950"
              >
                上月
              </Button>
            </div>
          </div>

          {/* 按月选择 */}
          <div>
            <Label className="text-sm font-semibold mb-3 block">按月选择</Label>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
              {getMonthOptions().map((month) => (
                <Button
                  key={month.value}
                  variant="outline"
                  size="sm"
                  onClick={() => handleMonthSelect(month.value)}
                  className="hover:bg-purple-50 hover:border-purple-300 dark:hover:bg-purple-950"
                >
                  {month.label}
                </Button>
              ))}
            </div>
          </div>

          {/* 自定义日期范围 */}
          <div>
            <Label className="text-sm font-semibold mb-3 block">自定义日期范围</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate" className="text-xs text-muted-foreground mb-1 block">
                  开始日期
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <Label htmlFor="endDate" className="text-xs text-muted-foreground mb-1 block">
                  结束日期
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button
                onClick={handleCustomApply}
                disabled={!startDate || !endDate}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                应用自定义范围
              </Button>
              <Button
                onClick={handleClear}
                variant="outline"
                className="flex-1"
              >
                清除筛选
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
