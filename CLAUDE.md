# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

API费用统计系统 - 用于统计每日API接口费用和图片生成数量的Web应用，基于Next.js 15构建的静态导出站点，数据存储在浏览器localStorage中。

## 核心架构

### 数据流架构

项目采用自定义状态管理方案，避免引入额外依赖：

1. **数据层** (`lib/storage.ts`):
   - 纯函数式API：所有数据操作返回新对象，不修改原数据
   - localStorage持久化：`loadData()` / `saveData()`
   - 数据操作函数：`saveRecord()`, `deleteRecord()`, `addApi()`, `removeApi()`

2. **状态管理** (`hooks/use-app-data.ts`):
   - 自定义Hook封装所有数据操作
   - 自动同步：数据变更时自动保存到localStorage
   - 提供统一接口：`{ data, saveRecord, deleteRecord, addApi, removeApi }`

3. **组件层**:
   - Dashboard作为根组件协调所有子组件
   - 单向数据流：所有数据变更通过Hook回调触发

### 类型系统

核心类型定义在 `lib/types.ts`:

```typescript
AppData = {
  apis: ApiConfig[],      // API配置（可动态增删）
  records: DailyRecord[]  // 每日记录
}

DailyRecord = {
  id: string,
  date: string,           // ISO格式
  apiCosts: ApiCost[],    // 各API费用明细
  imageCount: number,
  totalCost: number,      // 冗余字段，便于展示和排序
  notes?: string
}
```

### 组件结构

- `components/dashboard.tsx`: 根组件，管理对话框状态和数据操作
- `components/record-form.tsx`: 表单组件，支持新增/编辑
- `components/records-table.tsx`: 表格组件，使用TanStack Table
- `components/stats-cards.tsx`: 统计卡片（累计费用、图片数等）
- `components/cost-chart.tsx`: 双图表（费用趋势折线图 + 图片量柱状图）
- `components/ui/*`: shadcn/ui基础组件

## 常用命令

### 开发
```bash
npm run dev          # 启动开发服务器 (localhost:3000)
npm run build        # 构建生产版本（输出到./out目录）
npm run lint         # 运行ESLint检查
```

### 测试构建结果
```bash
npm run build
npx serve out        # 本地预览静态输出
```

## 技术约束

### Next.js配置
- **静态导出**: `output: 'export'` - 所有页面在构建时生成HTML
- **图片优化禁用**: `images.unoptimized: true` - 静态站点限制
- **basePath**: 如果部署到子路径（如`/repo-name`），需取消注释并配置

### 客户端限制
- 所有数据操作组件必须添加 `"use client"` 指令
- 不能使用Next.js服务端特性（API Routes、Server Actions等）
- localStorage仅在客户端可用，需做SSR检查（`typeof window === "undefined"`）

### 依赖管理
- React 19 + Next.js 15: 使用最新版本特性
- 不使用Redux/Zustand: 项目规模小，自定义Hook足够
- shadcn/ui组件: 按需复制到`components/ui/`，不作为npm包安装

## 部署流程

### GitHub Actions自动部署
- 触发条件: 推送到main分支或手动触发（workflow_dispatch）
- 构建产物: `./out` 目录
- 部署目标: GitHub Pages

### 手动部署到其他平台
支持任意静态托管平台（Vercel/Netlify/Cloudflare Pages）:
```bash
npm run build
# 上传 ./out 目录内容
```

## 数据处理逻辑

### 记录排序
所有记录自动按日期降序排列（`lib/storage.ts:110`）

### 费用计算
- 单日总费用: 表单提交时计算并存储在`totalCost`字段
- 累计统计: `calculateTotalCost()` / `calculateTotalImages()` 遍历所有记录

### 导出功能
- Excel导出: 使用xlsx库，包含列宽设置和BOM编码
- CSV导出: 手动拼接，添加UTF-8 BOM支持中文

## 主题系统

使用next-themes实现:
- 支持light/dark/system三种模式
- CSS变量定义在`app/globals.css`
- 组件通过Tailwind的`dark:`前缀切换样式

## 添加新API类型

修改 `lib/storage.ts` 中的 `DEFAULT_APIS`:
```typescript
const DEFAULT_APIS: ApiConfig[] = [
  { id: "volcengine", name: "火山引擎（字节跳动）", color: "#0052D9" },
  { id: "new-api", name: "新API名称", color: "#hex-color" },
];
```

注意: 修改后需清空localStorage或通过UI动态添加

## 常见问题

### 数据丢失问题
- localStorage有5-10MB限制
- 清除浏览器数据会丢失记录
- 建议提示用户定期导出备份

### 日期处理
- 统一使用ISO格式字符串存储
- 显示时使用`date-fns`格式化
- 时区问题: 使用本地时区，不做UTC转换

### 移动端适配
- 使用react-responsive检测屏幕尺寸
- 表格在小屏幕可能需要横向滚动
- 对话框内容设置`max-h-[90vh] overflow-y-auto`
