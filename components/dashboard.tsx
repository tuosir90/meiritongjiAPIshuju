"use client";

import { useState, useMemo } from "react";
import { Download, FileSpreadsheet, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import { RecordForm } from "@/components/record-form";
import { RecordsTable } from "@/components/records-table";
import { StatsCards } from "@/components/stats-cards";
import { CostChart } from "@/components/cost-chart";
import { DateFilterComponent, DateFilter } from "@/components/date-filter";
import { useAppData } from "@/hooks/use-app-data";
import { exportToExcel, exportToCSV } from "@/lib/export";
import { DailyRecord } from "@/lib/types";

export function Dashboard() {
  const { data, isLoading, isRefreshing, saveRecord, deleteRecord, refreshData } = useAppData();
  const [editingRecord, setEditingRecord] = useState<DailyRecord | undefined>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilter>({
    startDate: null,
    endDate: null,
    label: "全部"
  });

  // 根据日期筛选过滤数据
  const filteredRecords = useMemo(() => {
    if (!dateFilter.startDate || !dateFilter.endDate) {
      return data.records;
    }

    return data.records.filter(record => {
      const recordDate = new Date(record.date);
      const startDate = new Date(dateFilter.startDate!);
      const endDate = new Date(dateFilter.endDate!);

      return recordDate >= startDate && recordDate <= endDate;
    });
  }, [data.records, dateFilter]);

  const handleSaveRecord = (record: DailyRecord) => {
    saveRecord(record);
    setEditingRecord(undefined);
    setIsDialogOpen(false);
  };

  const handleEditRecord = (record: DailyRecord) => {
    setEditingRecord(record);
    setIsDialogOpen(true);
  };

  const handleExportExcel = () => {
    exportToExcel(filteredRecords, data.apis);
  };

  const handleExportCSV = () => {
    exportToCSV(filteredRecords, data.apis);
  };

  const handleRefreshData = async () => {
    const result = await refreshData();
    setRefreshMessage({
      type: result.success ? 'success' : 'error',
      text: result.message
    });
    // 3秒后自动隐藏消息
    setTimeout(() => setRefreshMessage(null), 3000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg font-medium">加载中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* 头部 */}
      <header className="sticky top-0 z-50 border-b bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                API费用统计系统
              </h1>
              <p className="text-sm text-muted-foreground">
                📊 每日API接口费用和图片生成统计管理
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <DateFilterComponent
                onFilterChange={setDateFilter}
                currentFilter={dateFilter}
              />
              <Button
                variant="outline"
                size="sm"
                className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 dark:hover:bg-blue-950 dark:hover:text-blue-400 transition-all"
                onClick={handleRefreshData}
                disabled={isRefreshing}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? '刷新中...' : '刷新数据'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="hover:bg-green-50 hover:text-green-600 hover:border-green-300 dark:hover:bg-green-950 dark:hover:text-green-400 transition-all"
                onClick={handleExportCSV}
                disabled={filteredRecords.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                导出CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-300 dark:hover:bg-emerald-950 dark:hover:text-emerald-400 transition-all"
                onClick={handleExportExcel}
                disabled={filteredRecords.length === 0}
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                导出Excel
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* 刷新消息提示 */}
      {refreshMessage && (
        <div className={`fixed top-20 right-4 z-50 p-4 rounded-lg shadow-lg animate-in slide-in-from-top-5 ${
          refreshMessage.type === 'success'
            ? 'bg-green-50 text-green-900 border border-green-200 dark:bg-green-950 dark:text-green-100'
            : 'bg-red-50 text-red-900 border border-red-200 dark:bg-red-950 dark:text-red-100'
        }`}>
          <div className="flex items-center gap-2">
            {refreshMessage.type === 'success' ? '✅' : '❌'}
            <span className="font-medium">{refreshMessage.text}</span>
          </div>
        </div>
      )}

      {/* 主体内容 */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* 统计卡片 */}
          <StatsCards records={filteredRecords} />

          {/* 图表 */}
          {filteredRecords.length > 0 && (
            <CostChart records={filteredRecords} apis={data.apis} />
          )}

          {/* 数据表格 */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">费用记录</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {dateFilter.startDate ? (
                    <>显示 {filteredRecords.length} 条记录（共 {data.records.length} 条）</>
                  ) : (
                    <>共 {data.records.length} 条记录</>
                  )}
                </p>
              </div>
              <Dialog
                open={isDialogOpen}
                onOpenChange={(open) => {
                  setIsDialogOpen(open);
                  if (!open) setEditingRecord(undefined);
                }}
              >
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all">
                    <Plus className="mr-2 h-4 w-4" />
                    添加记录
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingRecord ? "编辑记录" : "添加每日记录"}
                    </DialogTitle>
                    <DialogDescription>
                      录入每日API费用和图片生成数量
                    </DialogDescription>
                  </DialogHeader>
                  <RecordForm
                    apis={data.apis}
                    onSave={handleSaveRecord}
                    onClose={() => setIsDialogOpen(false)}
                    editingRecord={editingRecord}
                  />
                </DialogContent>
              </Dialog>
            </div>
            <RecordsTable
              records={filteredRecords}
              apis={data.apis}
              onEdit={handleEditRecord}
              onDelete={deleteRecord}
            />
          </div>
        </div>
      </main>

      {/* 页脚 */}
      <footer className="border-t mt-12 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>API费用统计系统 © {new Date().getFullYear()} · 数据存储在本地浏览器</p>
        </div>
      </footer>
    </div>
  );
}
