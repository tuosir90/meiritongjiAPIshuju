"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CostChart } from "@/components/cost-chart";
import { RecordForm } from "@/components/record-form";
import { RecordsTable } from "@/components/records-table";
import { StatsCards } from "@/components/stats-cards";
import { DateFilter } from "@/components/date-filter";
import { ApiConfig, DailyRecord } from "@/lib/types";

interface RecordsSectionProps {
  apis: ApiConfig[];
  records: DailyRecord[];
  totalRecords: number;
  dateFilter: DateFilter;
  onSaveRecord: (record: DailyRecord) => void;
  onDeleteRecord: (recordId: string) => void;
}

export function RecordsSection({
  apis,
  records,
  totalRecords,
  dateFilter,
  onSaveRecord,
  onDeleteRecord,
}: RecordsSectionProps) {
  const [editingRecord, setEditingRecord] = useState<DailyRecord | undefined>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSaveRecord = (record: DailyRecord) => {
    onSaveRecord(record);
    setEditingRecord(undefined);
    setIsDialogOpen(false);
  };

  const handleEditRecord = (record: DailyRecord) => {
    setEditingRecord(record);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-8">
      <StatsCards records={records} />

      {records.length > 0 && <CostChart records={records} apis={apis} />}

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">费用记录</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {dateFilter.startDate ? (
                <>显示 {records.length} 条记录（共 {totalRecords} 条）</>
              ) : (
                <>共 {totalRecords} 条记录</>
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
                <DialogTitle>{editingRecord ? "编辑记录" : "添加每日记录"}</DialogTitle>
                <DialogDescription>录入每日API费用和图片生成数量</DialogDescription>
              </DialogHeader>
              <RecordForm
                apis={apis}
                onSave={handleSaveRecord}
                onClose={() => setIsDialogOpen(false)}
                editingRecord={editingRecord}
              />
            </DialogContent>
          </Dialog>
        </div>
        <RecordsTable records={records} apis={apis} onEdit={handleEditRecord} onDelete={onDeleteRecord} />
      </div>
    </div>
  );
}
