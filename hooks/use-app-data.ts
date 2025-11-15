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
  getLocalVersion,
  saveVersion,
  isNewerVersion,
} from "@/lib/storage";

export function useAppData() {
  const [data, setData] = useState<AppData>(() => loadData());
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 从服务器加载数据的通用函数
  const loadFromServer = async (forceUpdate = false): Promise<AppData | null> => {
    try {
      const paths = [
        '/meiritongjiAPIshuju/initial-data.json',
        './initial-data.json',
        '/initial-data.json'
      ];

      for (const path of paths) {
        try {
          const response = await fetch(path, { cache: 'no-store' }); // 禁用缓存
          if (response.ok) {
            const serverData = await response.json() as AppData;
            const localVersion = getLocalVersion();
            const serverVersion = serverData.version || '0.0.0';

            console.log('本地版本:', localVersion);
            console.log('服务器版本:', serverVersion);

            // 检查是否需要更新
            if (forceUpdate || isNewerVersion(localVersion, serverVersion)) {
              console.log('✅ 检测到新版本，从', path, '加载数据');
              saveVersion(serverVersion);
              return serverData;
            } else {
              console.log('ℹ️ 本地数据已是最新版本');
              return null;
            }
          }
        } catch (e) {
          // 继续尝试下一个路径
        }
      }
    } catch (error) {
      console.log('加载服务器数据失败', error);
    }
    return null;
  };

  // 初始化时加载数据
  useEffect(() => {
    const initData = async () => {
      const localData = loadData();

      // 如果localStorage为空，或者检测到新版本，加载服务器数据
      if (localData.records.length === 0) {
        const serverData = await loadFromServer(true);
        if (serverData) {
          setData(serverData);
          saveData(serverData);
          setIsLoading(false);
          return;
        }
      } else {
        // 自动检查版本更新
        const serverData = await loadFromServer(false);
        if (serverData) {
          setData(serverData);
          saveData(serverData);
          setIsLoading(false);
          return;
        }
      }

      setData(localData);
      setIsLoading(false);
    };

    initData();
  }, []);

  // 手动刷新数据
  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      const serverData = await loadFromServer(true);
      if (serverData) {
        setData(serverData);
        saveData(serverData);
        return { success: true, message: '数据刷新成功！' };
      } else {
        return { success: false, message: '无法连接到服务器' };
      }
    } catch (error) {
      console.error('刷新数据失败:', error);
      return { success: false, message: '刷新失败：' + (error as Error).message };
    } finally {
      setIsRefreshing(false);
    }
  };

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
    isRefreshing,
    addApi,
    removeApi,
    saveRecord,
    deleteRecord,
    refreshData,
  };
}
