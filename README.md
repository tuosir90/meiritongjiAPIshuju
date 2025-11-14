# API费用统计系统

一个用于统计每日API接口费用和图片生成数量的Web应用。

## ✨ 功能特性

- 📝 **数据录入** - 手动录入每日各API接口费用和图片生成数量
- 📊 **数据展示** - 使用表格展示所有历史记录
- 📈 **统计分析** - 自动计算当日总费用和累计总费用
- 📉 **图表可视化** - 费用趋势图和图片生成量柱状图
- 💾 **数据导出** - 支持导出为Excel和CSV格式
- ✏️ **数据编辑** - 支持修改和删除历史记录
- 🌓 **深色模式** - 支持亮色/暗色主题切换
- 📱 **响应式设计** - 完美适配桌面端和移动端

## 🛠️ 技术栈

- **框架**: Next.js 15 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **UI组件**: shadcn/ui
- **图标**: Lucide React
- **表格**: TanStack Table (React Table)
- **图表**: Recharts
- **主题**: next-themes
- **数据导出**: xlsx
- **响应式**: react-responsive

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 本地开发

```bash
npm run dev
```

打开浏览器访问 [http://localhost:3000](http://localhost:3000)

### 构建生产版本

```bash
npm run build
```

## 📦 部署

### GitHub Pages

1. 将代码推送到GitHub仓库
2. 在仓库设置中启用GitHub Pages
3. 选择GitHub Actions作为部署源
4. 推送到main分支会自动触发部署

### 其他平台

项目已配置为静态导出，可以部署到任何支持静态网站的平台：

- Vercel
- Netlify
- Cloudflare Pages
- 等等

## 💡 使用说明

### 添加记录

1. 选择日期
2. 输入各API的费用（元）
3. 输入生成的图片总数
4. 可选：添加备注信息
5. 点击"添加记录"按钮

### 查看统计

- **统计卡片**: 显示累计总费用、累计图片数、平均每日费用、记录天数
- **费用趋势图**: 折线图展示各API费用变化趋势
- **图片生成量**: 柱状图展示每日图片生成数量

### 管理记录

- **编辑**: 点击记录行的编辑按钮，修改后保存
- **删除**: 点击删除按钮，确认后删除记录
- **排序**: 点击表头可以按日期、费用等排序

### 导出数据

- **导出Excel**: 点击"导出Excel"按钮，下载.xlsx格式文件
- **导出CSV**: 点击"导出CSV"按钮，下载.csv格式文件

### 主题切换

点击右上角的主题切换按钮，在亮色和暗色模式之间切换。

## 📁 项目结构

```
├── app/                    # Next.js App Router
│   ├── layout.tsx         # 根布局
│   ├── page.tsx           # 首页
│   └── globals.css        # 全局样式
├── components/            # React组件
│   ├── ui/               # shadcn/ui基础组件
│   ├── dashboard.tsx     # 主仪表板
│   ├── record-form.tsx   # 数据录入表单
│   ├── records-table.tsx # 数据表格
│   ├── stats-cards.tsx   # 统计卡片
│   ├── cost-chart.tsx    # 图表组件
│   └── theme-toggle.tsx  # 主题切换
├── hooks/                 # 自定义Hooks
│   └── use-app-data.ts   # 数据管理Hook
├── lib/                   # 工具库
│   ├── types.ts          # TypeScript类型定义
│   ├── storage.ts        # 本地存储
│   ├── export.ts         # 数据导出
│   └── utils.ts          # 工具函数
└── public/                # 静态资源
```

## 🎨 自定义配置

### 修改默认API列表

编辑 `lib/storage.ts` 文件中的 `DEFAULT_APIS` 常量：

```typescript
const DEFAULT_APIS: ApiConfig[] = [
  { id: "openai", name: "OpenAI", color: "#10a37f" },
  { id: "claude", name: "Claude", color: "#d4a574" },
  { id: "your-api", name: "Your API", color: "#your-color" },
];
```

### 修改主题颜色

编辑 `app/globals.css` 文件中的CSS变量。

## 📄 数据存储

数据使用浏览器的 `localStorage` 存储，仅保存在本地，不会上传到服务器。

- **优点**: 简单、快速、隐私
- **注意**: 清除浏览器数据会丢失记录，建议定期导出备份

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📝 许可证

MIT License
