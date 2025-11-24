# Repository Guidelines

## 项目结构与模块组织
本项目使用 Next.js App Router，界面入口位于 `app/`（`layout.tsx`、`page.tsx` 及 `globals.css`）。复用 UI 组件放在 `components/`，其中 `components/ui/` 内的 shadcn/ui 封装负责基础交互，`dashboard.tsx`、`cost-chart.tsx` 等业务模块以 200 行为上限拆分。`hooks/use-app-data.ts` 负责状态管理与本地存储同步，`lib/` 内的 `types.ts`、`storage.ts`、`export.ts` 封装类型、持久化与导出逻辑；静态资源放 `public/`。新增功能请优先在对应目录中新建文件，保持顶层目录 <8 个子项、单文件 <200 行。

## 构建、测试与开发命令
- `npm install`：安装依赖，也可双击 `start.bat` 选择 [4]。
- `npm run dev`：启动本地开发服务器（`http://localhost:3000`），等价 `dev.bat` 菜单 [1]。
- `npm run build`：生成 `.next/` 构建结果，配合 `npm run start` 进行生产预览或 `npm run export` 输出静态站点到 `out/` 供 GitHub Pages。
- `npm run lint`：执行 ESLint，并在 CI 前确保通过；`start.bat` 菜单 [5] 会运行同命令。
- `npx serve out`：本地查看 `npm run export` 的静态产物。

## 编码风格与命名约定
统一使用 TypeScript + React 函数组件，缩进 2 空格，组件使用 PascalCase，hooks 使用 `useXxx`，工具函数使用 camelCase。Tailwind CSS 类集中写在 `className` 中，避免动态字符串难以维护。跨文件共享类型统一添加到 `lib/types.ts`，若逻辑超过 150 行请提取新模块并在文件首行注明职责。提交前必须运行 `npm run lint`，确保 ESLint 与 TypeScript 检查零警告。

## 测试指引
当前尚未集成自动化测试，最基本的质量闸是 `npm run lint` 通过，并完成手工回归：验证 Dashboard 卡片、图表视图切换、数据导出及本地存储持久化。若引入单元测试，请放在 `__tests__/` 或模块旁的 `*.test.tsx`，推荐 Testing Library 断言渲染，测试名称遵循 `should_doSomething_whenCondition`，并保持语句覆盖率 ≥80%。

## 提交与 Pull Request 规范
沿用 Conventional Commits，使用 `feat|fix|chore|docs` 等前缀，例如 `chore: 更新数据到 v1.0.7 - 添加2025-11-21记录`。单次提交聚焦单一议题，必要时拆分为多提交并保持可回滚。PR 描述需包含变更摘要、手动或自动测试结果（附截图或日志）、关联 issue（`Closes #123`）以及对数据脚本或部署的影响说明。提交 PR 前确保 `npm run build && npm run export` 成功，并勾选检查清单。
