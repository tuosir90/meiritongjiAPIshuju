"use client";

import { useState, useEffect } from "react";
import { AppData, ApiConfig, DailyRecord } from "@/lib/types";
import {
  loadData,
  saveData,
  addApi as addApiToData,
  removeApi as removeApiFromData,
  saveRecord as saveRecordToData,
  deleteRecord as deleteRecordFromData,
  clearAllRecords as clearAllRecordsFromData,
} from "@/lib/storage";

export function useAppData() {
  const [data, setData] = useState<AppData>(() => loadData());
  const [isLoading, setIsLoading] = useState(true);

  // 初始化时加载数据
  useEffect(() => {
    setData(loadData());
    setIsLoading(false);
  }, []);

  // 数据变化时自动保存
  useEffect(() => {
    if (!isLoading) {
      saveData(data);
    }
  }, [data, isLoading]);

  // 添加API
  const addApi = (api: ApiConfig) => {
    setData((prev) => addApiToData(prev, api));
  };

  // 删除API
  const removeApi = (apiId: string) => {
    setData((prev) => removeApiFromData(prev, apiId));
  };

  // 保存记录
  const saveRecord = (record: DailyRecord) => {
    setData((prev) => saveRecordToData(prev, record));
  };

  // 删除记录
  const deleteRecord = (recordId: string) => {
    setData((prev) => deleteRecordFromData(prev, recordId));
  };

  // 清除所有记录
  const clearAllRecords = () => {
    setData((prev) => clearAllRecordsFromData(prev));
  };

  return {
    data,
    isLoading,
    addApi,
    removeApi,
    saveRecord,
    deleteRecord,
    clearAllRecords,
  };
}
