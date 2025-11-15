"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, Plus, Sparkles, Trash2 } from "lucide-react";
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
import { useAppData } from "@/hooks/use-app-data";
import { exportToExcel, exportToCSV } from "@/lib/export";
import { loadTestDataToBrowser } from "@/lib/generate-test-data";
import { DailyRecord } from "@/lib/types";

export function Dashboard() {
  const { data, isLoading, saveRecord, deleteRecord, clearAllRecords } = useAppData();
  const [editingRecord, setEditingRecord] = useState<DailyRecord | undefined>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
    exportToExcel(data.records, data.apis);
  };

  const handleExportCSV = () => {
    exportToCSV(data.records, data.apis);
  };

  const handleClearAllRecords = () => {
    if (confirm("⚠️ 确定要清除所有记录吗？\n\n此操作不可恢复！建议先导出数据备份。")) {
      clearAllRecords();
    }
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
    <div className="min-h-screen bg-background">
      {/* 头部 */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">API费用统计系统</h1>
              <p className="text-sm text-muted-foreground mt-1">
                每日API接口费用和图片生成统计管理
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (confirm("确定要生成测试数据吗？\n这将覆盖现有数据，生成30天的模拟记录。")) {
                    loadTestDataToBrowser();
                  }
                }}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                生成测试数据
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAllRecords}
                disabled={data.records.length === 0}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                清除所有数据
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                disabled={data.records.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                导出CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportExcel}
                disabled={data.records.length === 0}
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                导出Excel
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* 主体内容 */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* 统计卡片 */}
          <StatsCards records={data.records} />

          {/* 图表 */}
          {data.records.length > 0 && (
            <CostChart records={data.records} apis={data.apis} />
          )}

          {/* 数据表格 */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">费用记录</h2>
              <Dialog
                open={isDialogOpen}
                onOpenChange={(open) => {
                  setIsDialogOpen(open);
                  if (!open) setEditingRecord(undefined);
                }}
              >
                <DialogTrigger asChild>
                  <Button>
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
              records={data.records}
              apis={data.apis}
              onEdit={handleEditRecord}
              onDelete={deleteRecord}
            />
          </div>
        </div>
      </main>

      {/* 页脚 */}
      <footer className="border-t mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>API费用统计系统 © {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}
