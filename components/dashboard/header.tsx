"use client";

import { Download, FileSpreadsheet, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { DateFilter, DateFilterComponent } from "@/components/date-filter";

interface DashboardHeaderProps {
  dateFilter: DateFilter;
  onDateFilterChange: (filter: DateFilter) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onExportCSV: () => void;
  onExportExcel: () => void;
  canExport: boolean;
}

export function DashboardHeader({
  dateFilter,
  onDateFilterChange,
  onRefresh,
  isRefreshing,
  onExportCSV,
  onExportExcel,
  canExport,
}: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl shadow-sm">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
              API费用统计系统
            </h1>
            <p className="text-sm text-muted-foreground">?? 每日API接口费用和图片生成统计管理</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <DateFilterComponent onFilterChange={onDateFilterChange} currentFilter={dateFilter} />
            <Button
              variant="outline"
              size="sm"
              className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 dark:hover:bg-blue-950 dark:hover:text-blue-400 transition-all"
              onClick={onRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "刷新中..." : "刷新数据"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="hover:bg-green-50 hover:text-green-600 hover:border-green-300 dark:hover:bg-green-950 dark:hover:text-green-400 transition-all"
              onClick={onExportCSV}
              disabled={!canExport}
            >
              <Download className="mr-2 h-4 w-4" />
              导出CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-300 dark:hover:bg-emerald-950 dark:hover:text-emerald-400 transition-all"
              onClick={onExportExcel}
              disabled={!canExport}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              导出Excel
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
