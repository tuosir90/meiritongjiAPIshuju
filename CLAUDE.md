# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

API费用统计系统 - 用于统计每日API接口费用和图片生成数量的Web应用，基于Next.js 15构建的静态导出站点。

**关键特性：**
- 数据存储：浏览器localStorage（主要）+ 服务器JSON文件（初始化/更新）
- 版本控制：自动检测 `public/initial-data.json` 版本并同步更新
- 静态部署：GitHub Pages自动部署，无服务端依赖

## 核心架构

### 数据流架构

采用自定义状态管理方案（无Redux/Zustand），三层架构：

**1. 数据层** (`lib/storage.ts`):
   - 纯函数式API：所有操作返回新对象，不修改原数据
   - localStorage持久化：`loadData()` / `saveData()`
   - 数据操作：`saveRecord()`, `deleteRecord()`, `addApi()`, `removeApi()`
   - 版本管理：`getLocalVersion()`, `saveVersion()`, `isNewerVersion()`

**2. 状态管理** (`hooks/use-app-data.ts`):
   - 自定义Hook封装所有数据操作和版本同步
   - 初始化时从服务器加载预设数据（如果localStorage为空或版本过期）
   - 自动同步：数据变更自动保存到localStorage
   - 手动刷新：`refreshData()` 强制从服务器获取最新数据

**3. 组件层** (`components/dashboard.tsx`):
   - 根组件协调所有子组件和对话框状态
   - 单向数据流：所有变更通过Hook回调触发
   - 日期筛选：`useMemo` 优化的过滤逻辑

### 类型系统 (`lib/types.ts`)

```typescript
AppData = {
  version?: string,       // 数据版本号（用于自动更新）
  lastUpdated?: string,   // 最后更新时间
  apis: ApiConfig[],      // API配置（可动态增删）
  records: DailyRecord[]  // 每日记录
}

DailyRecord = {
  id: string,             // 格式: "YYYY-MM-DD-序号"
  date: string,           // ISO格式 (YYYY-MM-DD)
  apiCosts: ApiCost[],    // 各API费用明细
  imageCount: number,
  totalCost: number,      // 冗余字段（必须等于apiCosts总和）
  notes?: string
}
```

### 版本控制机制

**服务器端数据文件：** `public/initial-data.json`
- 包含 `version` 字段（语义化版本号，如 "1.0.1"）
- 用户访问时自动检测版本，如有新版本则下载并覆盖localStorage
- 更新数据时必须递增版本号，否则用户端不会同步

**更新流程：**
1. 编辑 `public/initial-data.json`，修改 `version` 字段
2. 提交并推送到main分支
3. GitHub Actions自动部署
4. 用户访问时自动检测并加载新版本数据

### 组件结构

- `components/dashboard.tsx`: 根组件，管理状态和日期筛选
- `components/record-form.tsx`: 表单组件，支持新增/编辑
- `components/records-table.tsx`: 表格组件（TanStack Table）
- `components/stats-cards.tsx`: 统计卡片（响应筛选条件）
- `components/cost-chart.tsx`: 费用趋势+图片量双图表（支持按日/按月切换）
- `components/date-filter.tsx`: 日期筛选对话框（快速筛选/按月/自定义范围）
- `components/ui/*`: shadcn/ui基础组件

## 常用命令

```bash
npm run dev          # 启动开发服务器 (localhost:3000)
npm run build        # 构建生产版本（静态导出到 ./out 目录）
npm run lint         # ESLint代码检查
npx serve out        # 本地预览构建结果
```

## 技术约束

### Next.js静态导出限制
- **output: 'export'** - 所有页面在构建时生成HTML，无服务端运行时
- **images.unoptimized: true** - 禁用图片优化（静态部署限制）
- **basePath: '/meiritongjiAPIshuju'** - GitHub Pages子路径部署配置
- **不可用特性**: API Routes、Server Actions、动态路由（getServerSideProps）

### 客户端约束
- 所有数据操作组件必须添加 `"use client"` 指令
- localStorage仅客户端可用，需做SSR检查: `typeof window === "undefined"`
- 版本同步路径需兼容basePath：`use-app-data.ts:26-29` 多路径尝试

### 依赖管理原则
- **无状态管理库**: 不使用Redux/Zustand，自定义Hook足够轻量
- **shadcn/ui**: 组件源码复制到 `components/ui/`，非npm依赖
- **图表库**: Recharts（图表）+ TanStack Table（表格）+ date-fns（日期）

## 部署流程

### GitHub Actions自动部署
配置文件: `.github/workflows/deploy.yml`
- **触发条件**: 推送到main分支 或 手动触发（workflow_dispatch）
- **构建流程**: Node.js 20 → npm ci → npm run build → 上传 ./out
- **部署目标**: GitHub Pages（需在仓库设置中启用）

### 更新服务器数据的步骤
1. 编辑 `public/initial-data.json`，递增 `version` 字段（如 1.0.1 → 1.0.2）
2. 添加或修改 `records` 数组中的数据记录
3. 提交并推送到main分支
4. 等待GitHub Actions部署完成（约1-2分钟）
5. 用户访问时自动检测新版本并同步数据

**重要**: 必须修改版本号，否则用户端不会更新数据

## 数据处理逻辑

### 记录排序与计算
- **自动排序**: 所有记录按日期降序排列（`lib/storage.ts:111`）
- **费用计算**:
  - 单日总费用：表单提交时计算并存储在 `totalCost` 字段
  - 累计统计：`calculateTotalCost()` / `calculateTotalImages()` 遍历所有记录
  - **关键约束**: totalCost 必须等于 apiCosts 数组的总和

### 导出功能 (`lib/export.ts`)
- **Excel**: 使用xlsx库，包含列宽设置和UTF-8 BOM编码
- **CSV**: 手动拼接字符串，添加UTF-8 BOM支持中文

### 主题系统
- 使用 **next-themes** 实现：light / dark / system 三种模式
- CSS变量定义在 `app/globals.css`，组件通过 Tailwind 的 `dark:` 前缀切换样式

## 修改API配置

### 方法1：修改默认配置（需重新部署）
编辑 `lib/storage.ts:11-15` 中的 `DEFAULT_APIS`：
```typescript
const DEFAULT_APIS: ApiConfig[] = [
  { id: "volcengine", name: "火山引擎（字节跳动）", color: "#0052D9" },
  { id: "new-api", name: "新API名称", color: "#hex-color" },
];
```

### 方法2：通过服务器数据更新（推荐）
编辑 `public/initial-data.json` 中的 `apis` 数组，修改版本号并推送部署。用户端自动同步新配置。

## 常见问题

### localStorage限制
- 容量限制: 5-10MB（因浏览器而异）
- 数据持久性: 清除浏览器数据会丢失所有记录
- **解决方案**: 引导用户定期导出Excel/CSV备份

### 日期处理规范
- 存储格式: ISO 8601字符串（YYYY-MM-DD）
- 显示格式: 使用 `date-fns` 格式化
- 时区处理: 统一使用本地时区，不做UTC转换

### 移动端适配
- 使用 `react-responsive` 检测屏幕尺寸
- 表格在小屏幕横向滚动（`overflow-x-auto`）
- 对话框限高: `max-h-[90vh] overflow-y-auto` 防止内容溢出
