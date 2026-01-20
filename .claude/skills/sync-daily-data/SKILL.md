---
name: sync-daily-data
description: 自动读取每日数据整理.md文件中的全部日期记录，补齐缺失数据到public/initial-data.json，递增版本号，并提交推送到远程仓库。适用于每日API费用统计数据的同步更新。
---

# 每日数据同步Skill

## 功能说明
自动化处理每日API费用统计数据的同步流程，包括数据读取、解析、更新、提交和推送。

## 执行步骤

### 1. 读取全部数据
- 读取文件：`F:\tuosir90-claude-code\meiritongjiAPIshuju\每日数据整理.md`
- 扫描全部非空行，解析每一行的日期数据
- 支持日期写法：`2026.1.7` / `2026.01.07`（自动补零）
- 数据格式示例：`日期：2025.12.27  火山引擎消费0.4元  云雾api消费10.06元 糖果姐姐api 消费8.12元 总生图数363张`

### 2. 提取信息
从每一行提取以下信息：
- 日期（格式：YYYY.MM.DD，需转换为YYYY-MM-DD）
- 火山引擎消费金额（数字）
- 云雾API消费金额（数字）
- 糖果姐姐API消费金额（数字）
- 总生图数（整数）
> 若同一天出现多行，以最后一次出现为准；数据不完整的行将跳过并提示。

### 3. 更新数据文件
读取并更新`public/initial-data.json`：
- 获取当前版本号（如：1.0.43）
- 仅补齐缺失日期（已存在的日期不会重复添加）
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
    { "apiId": "tangguo", "cost": 糖果姐姐API金额 }
  ],
  "imageCount": 生图数,
  "totalCost": 三个API费用总和
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
- 推送到远程：`git push`

## 重要约束
- 日期格式转换：2025.12.27 → 2025-12-27
- totalCost必须等于三个API费用之和
- 记录按日期降序排列（最新的在最前面）
- 版本号必须递增一次，否则用户端不会更新
- 不依赖首行顺序，必须补齐所有缺失日期
- 只提交`public/initial-data.json`，不提交其他未跟踪文件

## 使用方法
1. 在`每日数据整理.md`中追加新日期数据（任意位置均可）
2. 运行命令：`/sync-daily-data`
3. 或在仓库根目录手动执行：`.\sync-daily-data.ps1`
4. 等待自动完成所有操作
