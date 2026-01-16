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
import { DateFilter } from "./types";
import { createEmptyFilter, getMonthOptions, getMonthRange, getQuickDateRange } from "./utils";

interface DateFilterProps {
  onFilterChange: (filter: DateFilter) => void;
  currentFilter: DateFilter;
}

export function DateFilterComponent({ onFilterChange, currentFilter }: DateFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const handleQuickSelect = (type: string) => {
    const filter = getQuickDateRange(type);
    onFilterChange(filter);
    setIsOpen(false);
  };

  const handleCustomApply = () => {
    if (startDate && endDate) {
      onFilterChange({
        startDate,
        endDate,
        label: `自定义 (${startDate} ~ ${endDate})`,
      });
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    onFilterChange(createEmptyFilter());
    setStartDate("");
    setEndDate("");
    setIsOpen(false);
  };

  const handleMonthSelect = (monthStr: string) => {
    onFilterChange(getMonthRange(monthStr));
    setIsOpen(false);
  };

  const monthOptions = getMonthOptions();

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

          <div>
            <Label className="text-sm font-semibold mb-3 block">按月选择</Label>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
              {monthOptions.map((month) => (
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
              <Button onClick={handleClear} variant="outline" className="flex-1">
                清除筛选
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export type { DateFilter } from "./types";
