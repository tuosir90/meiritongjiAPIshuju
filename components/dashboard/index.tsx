"use client";

import { useMemo, useState } from "react";
import { DashboardHeader } from "./header";
import { RefreshToast } from "./refresh-toast";
import { RecordsSection } from "./records-section";
import { DashboardFooter } from "./footer";
import { filterRecordsByDate } from "./utils";
import { RefreshMessage } from "./types";
import { useAppData } from "@/hooks/use-app-data";
import { exportToCSV, exportToExcel } from "@/lib/export";
import { DateFilter } from "@/components/date-filter";
import { DailyRecord } from "@/lib/types";

export function Dashboard() {
  const { data, isLoading, isRefreshing, saveRecord, deleteRecord, refreshData } = useAppData();
  const [refreshMessage, setRefreshMessage] = useState<RefreshMessage | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilter>({
    startDate: null,
    endDate: null,
    label: "全部",
  });

  const filteredRecords = useMemo(
    () => filterRecordsByDate(data.records, dateFilter),
    [data.records, dateFilter]
  );

  const handleSaveRecord = (record: DailyRecord) => {
    saveRecord(record);
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
      type: result.success ? "success" : "error",
      text: result.message,
    });
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
      <DashboardHeader
        dateFilter={dateFilter}
        onDateFilterChange={setDateFilter}
        onRefresh={handleRefreshData}
        isRefreshing={isRefreshing}
        onExportCSV={handleExportCSV}
        onExportExcel={handleExportExcel}
        canExport={filteredRecords.length > 0}
      />

      <RefreshToast message={refreshMessage} />

      <main className="container mx-auto px-4 py-8">
        <RecordsSection
          apis={data.apis}
          records={filteredRecords}
          totalRecords={data.records.length}
          dateFilter={dateFilter}
          onSaveRecord={handleSaveRecord}
          onDeleteRecord={deleteRecord}
        />
      </main>

      <DashboardFooter />
    </div>
  );
}
