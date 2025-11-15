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
} from "@/lib/storage";

export function useAppData() {
  const [data, setData] = useState<AppData>(() => loadData());
  const [isLoading, setIsLoading] = useState(true);

  // 初始化时加载数据
  useEffect(() => {
    const initData = async () => {
      const localData = loadData();

      // 如果localStorage为空，尝试加载预设数据
      if (localData.records.length === 0) {
        try {
          const paths = [
            '/meiritongjiAPIshuju/initial-data.json',
            './initial-data.json',
            '/initial-data.json'
          ];

          for (const path of paths) {
            try {
              const response = await fetch(path);
              if (response.ok) {
                const initialData = await response.json() as AppData;
                console.log('✅ 成功从', path, '加载预设数据');
                setData(initialData);
                saveData(initialData);
                setIsLoading(false);
                return;
              }
            } catch (e) {
              // 继续尝试下一个路径
            }
          }
        } catch (error) {
          console.log('加载预设数据失败', error);
        }
      }

      setData(localData);
      setIsLoading(false);
    };

    initData();
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

  return {
    data,
    isLoading,
    addApi,
    removeApi,
    saveRecord,
    deleteRecord,
  };
}
