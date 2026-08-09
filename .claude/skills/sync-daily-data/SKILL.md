---
name: sync-daily-data
description: 自动读取每日数据整理.xlsx表格中的日期记录，将未来新增数据同步到public/initial-data.json，递增版本号，并提交推送到远程仓库。章鱼哥AI/OtuAI 历史数据保留，但未来新增记录不再生成 otuai 费用项。
---

# 每日数据同步Skill

## 本 Skill 全局文档路径

`F:\tuosir90-claude-code\meiritongjiAPIshuju\.claude\skills\sync-daily-data\SKILL.md`

## 功能说明
自动化处理每日API费用统计数据的同步流程，包括数据读取、解析、更新、提交和推送。章鱼哥AI/OtuAI 已停止未来统计：历史 JSON record 中的 `apiId: "otuai"` 和历史 `totalCost` 保留，不重算；未来新增记录不再包含 `otuai`。

## ⚠️ 关键执行要求

**必须严格按顺序执行以下所有步骤，不得遗漏任何步骤：**

1. 读取 Excel 数据
2. 读取 JSON 数据并对比
3. 更新 JSON 文件
4. **执行 git add**
5. **执行 git commit**
6. **执行 git push（必须执行，不得跳过）**
7. 输出执行结果总结

**禁止行为：**
- ❌ 在更新 JSON 文件后就停止，不执行 git 操作
- ❌ 只执行 commit 不执行 push
- ❌ 在 git push 之前输出"同步完成"的总结
- ❌ 默认覆盖带有历史 `otuai` 的旧记录并改变历史口径

**只有在 git push 成功后，才能输出最终的执行结果总结。**

## 执行步骤

### 1. 读取全部数据
- 读取文件：`F:\tuosir90-claude-code\meiritongjiAPIshuju\每日数据整理.xlsx`
- 使用 xlsx 库解析 Excel 表格
- 表格结构：第一行为标题行，数据从第二行开始
- 当前主表列顺序：日期 | 向量引擎消费 | ZIKL | 糖果姐姐api | APIMart | 馒小白 | 新世界API | 章鱼哥AI（历史保留，未来忽略） | 总生图数
- 脚本优先按表头识别列，兼容旧结构：日期 | 向量引擎消费 | ZIKL | 糖果姐姐api | APIMart | 馒小白 | 章鱼哥AI（历史保留，未来忽略） | 总生图数
- 如果后续主表删除历史列，脚本也兼容7列结构：日期 | 向量引擎消费 | ZIKL | 糖果姐姐api | APIMart | 馒小白 | 总生图数
- 日期格式支持：`2026/1/20` 或 `2026-01-20`（自动转换为ISO格式）

### 2. 提取信息
从每一行提取以下信息：
- 日期（转换为YYYY-MM-DD格式）
- 向量引擎消费金额（数字）
- ZIKL金额（数字）
- 糖果姐姐API消费金额（数字）
- APIMart消费金额（数字，为空时按0处理；该列应保存页面统计额度乘以 `7` 后的真实每日费用）
- 馒小白消费金额（数字，为空时按0处理；该列应保存页面统计额度乘以 `1.1` 后的真实每日费用）
- 新世界API消费金额（数字，为空时按0处理；只采集昨天一天，昨天之前历史日期显示/同步为0）
- 总生图数（整数）

不再读取或同步章鱼哥AI；Excel 第7列如存在，仅作为历史保留字段忽略。

### 3. 更新数据文件
读取并更新`public/initial-data.json`：
- 获取当前版本号（如：1.0.211）
- 顶层 `apis` 删除 `otuai`，网页不再展示章鱼哥AI
- 旧 `yunwu` API ID 会迁移为正式 ID `zikl`，展示名统一为 `ZIKL`
- 缺失日期会新增
- 已有历史记录如果包含 `apiId: "otuai"`，默认保留不覆盖；如确需覆盖历史，必须显式运行 `node sync-daily-data.js --allow-history-overwrite`
- 递增版本号最后一位一次（如：1.0.211 → 1.0.212）
- 更新`lastUpdated`时间戳为当前UTC时间
- 将新记录与现有记录合并并按日期降序排列

### 4. 未来新增记录格式
```json
{
  "id": "YYYY-MM-DD-1",
  "date": "YYYY-MM-DD",
  "apiCosts": [
    { "apiId": "volcengine", "cost": 向量引擎金额 },
    { "apiId": "zikl", "cost": ZIKL金额 },
    { "apiId": "tangguo", "cost": 糖果姐姐API金额 },
    { "apiId": "123api", "cost": APIMart金额 },
    { "apiId": "manxiaobai", "cost": 馒小白金额 },
    { "apiId": "xinshijie", "cost": 新世界API金额 }
  ],
  "imageCount": 生图数,
  "totalCost": 六个API费用总和
}
```

> 注：JSON 内部 `apiId` 仍保留 `123api` 以兼容历史记录；对外列名和执行口径统一为 `APIMart`。

### 5. Git提交推送
- 添加文件：`git add public/initial-data.json`
- 提交信息格式：
```
chore: 更新数据到 v版本号 - 添加YYYY-MM-DD记录

或

chore: 更新数据到 v版本号 - 更新API配置

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```
- 推送到远程：`git push "https://tuosir90@github.com/tuosir90/meiritongjiAPIshuju.git" main`
- **提醒**：不要直接使用裸 `git push`。这台机器可能命中错误的默认 GitHub 凭据，导致推送到 `tuosir90/meiritongjiAPIshuju` 时失败。

## 重要约束
- 日期格式转换：2026/1/20 → 2026-01-20
- 未来新增记录的 totalCost 必须等于六个API费用之和（向量引擎、ZIKL、糖果姐姐API、APIMart、馒小白、新世界API）
- 历史记录的 `otuai` 和 `totalCost` 保留，不重算；如果历史记录缺少 `apiId: "xinshijie"`，同步时只追加 `{ "apiId": "xinshijie", "cost": 0 }` 用于显示，不改变历史总费用
- 记录按日期降序排列（最新的在最前面）
- 版本号必须递增一次，否则用户端不会更新
- 必须补齐所有缺失日期
- 只提交`public/initial-data.json`，不提交其他未跟踪文件

## 使用方法
1. 在`每日数据整理.xlsx`表格中追加新日期数据
2. 运行命令：`/sync-daily-data`
3. 或在仓库根目录手动执行：`node sync-daily-data.js`
4. 等待自动完成所有操作

## 🚨 最终强制要求

**一定要推送到远程仓库！**

完成所有步骤后，必须执行 `git push "https://tuosir90@github.com/tuosir90/meiritongjiAPIshuju.git" main` 将更改推送到远程仓库。这是本 Skill 的最终必要步骤，绝对不能省略。

## 每日全流程记忆回写

被 `daily-workflow-executor` 调用时，必须记录：

- Excel 解析到的总记录数
- 本次新增或覆盖的日期列表
- 因历史 `otuai` 被保护而跳过覆盖的日期列表
- 版本号变化
- `git commit` 输出摘要、commit hash、显式远程 URL 的 `git push` 输出
- 工作区如存在既有未提交/未跟踪文件，只记录并跳过，不要清理或纳入本次提交
- 如果 `git status` 显示 ahead，但显式 URL push 已有 `main -> main` 输出，不得仅凭 ahead 判定推送失败；以本次 push 输出为准
- 当前 `node sync-daily-data.js` 会在脚本内部执行 `git add/commit/push`。每日全流程包装脚本如果随后再次执行 `git add public/initial-data.json && git commit`，可能因为没有新的 `public/initial-data.json` 变更而退出码为 `1`；只要同步脚本输出了本次 commit、显式 URL push 成功，且 `git ls-remote "https://tuosir90@github.com/tuosir90/meiritongjiAPIshuju.git" refs/heads/main` 等于本次 `HEAD`，不得把后续“nothing to commit/no changes added”判为失败。
- 复核 `public/initial-data.json` 中指定日期记录时，实际顶层数据字段为 `records`，不是 `data`；使用 `const rec = d.records.find(x => x.date === 'YYYY-MM-DD')` 验证版本号、API费用、`imageCount` 和 `totalCost`
