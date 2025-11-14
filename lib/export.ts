"use client";

import * as XLSX from "xlsx";
import { DailyRecord, ApiConfig } from "./types";
import { formatDate } from "./utils";

/**
 * 导出数据为Excel文件
 */
export function exportToExcel(records: DailyRecord[], apis: ApiConfig[]) {
  // 准备数据
  const data = records.map((record) => {
    const row: any = {
      日期: formatDate(record.date),
    };

    // 添加各API的费用列
    apis.forEach((api) => {
      const apiCost = record.apiCosts.find((ac) => ac.apiId === api.id);
      row[`${api.name}费用`] = apiCost ? apiCost.cost : 0;
    });

    row["图片数量"] = record.imageCount;
    row["当日总费用"] = record.totalCost;
    row["备注"] = record.notes || "";

    return row;
  });

  // 创建工作簿
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);

  // 设置列宽
  const colWidths = [
    { wch: 12 }, // 日期
    ...apis.map(() => ({ wch: 12 })), // API费用列
    { wch: 10 }, // 图片数量
    { wch: 12 }, // 当日总费用
    { wch: 30 }, // 备注
  ];
  ws["!cols"] = colWidths;

  // 添加工作表
  XLSX.utils.book_append_sheet(wb, ws, "API费用统计");

  // 生成文件名
  const fileName = `API费用统计_${new Date().toISOString().split("T")[0]}.xlsx`;

  // 导出文件
  XLSX.writeFile(wb, fileName);
}

/**
 * 导出数据为CSV文件
 */
export function exportToCSV(records: DailyRecord[], apis: ApiConfig[]) {
  // 准备表头
  const headers = [
    "日期",
    ...apis.map((api) => `${api.name}费用`),
    "图片数量",
    "当日总费用",
    "备注",
  ];

  // 准备数据行
  const rows = records.map((record) => {
    const row = [
      formatDate(record.date),
      ...apis.map((api) => {
        const apiCost = record.apiCosts.find((ac) => ac.apiId === api.id);
        return apiCost ? apiCost.cost : 0;
      }),
      record.imageCount,
      record.totalCost,
      record.notes || "",
    ];
    return row;
  });

  // 组合CSV内容
  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  // 添加BOM以支持中文
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });

  // 生成下载链接
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `API费用统计_${new Date().toISOString().split("T")[0]}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
