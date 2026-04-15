---
name: sync-daily-data
description: 自动读取每日数据整理.xlsx表格中的全部日期记录，补齐缺失数据并覆盖已有日期的变化到public/initial-data.json，递增版本号，并提交推送到远程仓库。适用于每日API费用统计数据的同步更新。
---

# 每日数据同步Skill

## 功能说明
自动化处理每日API费用统计数据的同步流程，包括数据读取、解析、更新、提交和推送。

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

**只有在 git push 成功后，才能输出最终的执行结果总结。**

## 执行步骤

### 1. 读取全部数据
- 读取文件：`F:\tuosir90-claude-code\meiritongjiAPIshuju\每日数据整理.xlsx`
- 使用 xlsx 库解析 Excel 表格
- 表格结构：第一行为标题行，数据从第二行开始
- 列顺序：日期 | 火山引擎消费 | 云雾api消费 | 糖果姐姐api | 123api | 总生图数
- 日期格式支持：`2026/1/20` 或 `2026-01-20`（自动转换为ISO格式）

### 2. 提取信息
从每一行提取以下信息：
- 日期（转换为YYYY-MM-DD格式）
- 火山引擎消费金额（数字）
- 云雾API消费金额（数字）
- 糖果姐姐API消费金额（数字）
- 123api消费金额（数字，为空时按0处理）
- 总生图数（整数）
> 若同一天出现多行，以最后一次出现为准；数据不完整的行将跳过并提示。

### 3. 更新数据文件
读取并更新`public/initial-data.json`：
- 获取当前版本号（如：1.0.43）
- 以 Excel 为准同步数据：缺失日期会新增，已存在日期若数值变化也会覆盖更新
- 递增版本号最后一位一次（如：1.0.43 → 1.0.44）
- 更新`lastUpdated`时间戳为当前UTC时间
- 将新记录与现有记录合并并按日期降序排列

### 4. 新记录格式
```json
{
  "id": "YYYY-MM-DD-1",
  "date": "YYYY-MM-DD",
  "apiCosts": [
    { "apiId": "volcengine", "cost": 火山引擎金额 },
    { "apiId": "yunwu", "cost": 云雾API金额 },
    { "apiId": "tangguo", "cost": 糖果姐姐API金额 },
    { "apiId": "123api", "cost": 123api金额 }
  ],
  "imageCount": 生图数,
  "totalCost": 四个API费用总和
}
```

### 5. Git提交推送
- 添加文件：`git add public/initial-data.json`
- 提交信息格式：
```
chore: 更新数据到 v版本号 - 添加YYYY-MM-DD记录

或

chore: 更新数据到 v版本号 - 添加YYYY-MM-DD等N条记录

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```
- 推送到远程：`git push "https://tuosir90@github.com/tuosir90/meiritongjiAPIshuju.git" main`
- **提醒**：不要直接使用裸 `git push`。这台机器可能命中错误的默认 GitHub 凭据，导致推送到 `tuosir90/meiritongjiAPIshuju` 时失败。

## 重要约束
- 日期格式转换：2026/1/20 → 2026-01-20
- totalCost必须等于四个API费用之和
- 记录按日期降序排列（最新的在最前面）
- 版本号必须递增一次，否则用户端不会更新
- 必须补齐所有缺失日期，并覆盖 Excel 中已有日期的最新值
- 只提交`public/initial-data.json`，不提交其他未跟踪文件

## 使用方法
1. 在`每日数据整理.xlsx`表格中追加新日期数据
2. 运行命令：`/sync-daily-data`
3. 或在仓库根目录手动执行：`node sync-daily-data.js`
4. 等待自动完成所有操作

## 🚨 最终强制要求

**一定要推送到远程仓库！**

完成所有步骤后，必须执行 `git push "https://tuosir90@github.com/tuosir90/meiritongjiAPIshuju.git" main` 将更改推送到远程仓库。这是本 Skill 的最终必要步骤，绝对不能省略。
