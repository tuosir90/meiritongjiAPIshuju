---
name: daily-data-crawler
description: |
  每日数据自动抓取工具。按顺序执行五个浏览器自动化脚本（云雾API、糖果姐姐API、123api、阿里云OSS、向量引擎），
  从各平台抓取消费数据和统计信息，自动写入Excel表格。
  **支持批量补采**：自动检测所有缺失日期（从Excel最新日期+1天到昨天），一次性采集所有缺失数据。
  触发场景：用户需要抓取每日API消费数据、运行数据统计脚本、更新每日数据表格。
  This skill should be used when user mentions "每日数据", "抓取数据", "运行爬虫", "数据统计",
  "云雾", "糖果", "阿里云OSS", "向量引擎" or needs to crawl daily API consumption data.

---

# 每日数据自动抓取

## 核心特性：智能补采

脚本会自动检测缺失的日期范围：
1. 获取当前系统时间（今天是几号）
2. 读取Excel中最新日期
3. 计算缺失日期：从"最新日期+1天"到"昨天"
4. 批量采集所有缺失日期的数据

**示例**：
- Excel最新日期：2026-02-01
- 今天：2026-02-04
- 自动采集：2026-02-02、2026-02-03

## CRITICAL: 执行规则

**必须严格按照下方的命令执行，禁止猜测或修改脚本名称！**

- 脚本名称固定为 `run-yunwu.js`、`run-tangguo.js`、`run-api123.js`、`run-oss.js`、`run-vector.js`
- 不要使用 `*-crawler.js`，那些是模块文件，不是入口脚本
- 每个步骤必须等待上一步完成后再执行

## 执行命令（直接复制执行）

### 步骤1：云雾API
```bash
powershell -Command "Set-Location 'F:\tuosir90-claude-code\meiritongjiAPIshuju\scripts'; node run-yunwu.js"
```

### 步骤2：糖果姐姐API
```bash
powershell -Command "Set-Location 'F:\tuosir90-claude-code\meiritongjiAPIshuju\tangguo-api-crawler'; node run-tangguo.js"
```

### 步骤3：123api
```bash
powershell -Command "Set-Location 'F:\tuosir90-claude-code\meiritongjiAPIshuju\api123-crawler'; node run-api123.js"
```

### 步骤4：阿里云OSS
```bash
powershell -Command "Set-Location 'F:\tuosir90-claude-code\meiritongjiAPIshuju\aliyun-oss-crawler'; node run-oss.js"
```

### 步骤5：向量引擎
```bash
powershell -Command "Set-Location 'F:\tuosir90-claude-code\meiritongjiAPIshuju\vectorengine-crawler'; node run-vector.js"
```

## 脚本说明

| 顺序 | 入口脚本 | 数据来源 | 写入列 |
|------|----------|----------|--------|
| 1 | `run-yunwu.js` | yunwu.ai | 第3列（云雾api消费） |
| 2 | `run-tangguo.js` | pockgo.com | 第4列（糖果姐姐api） |
| 3 | `run-api123.js` | 128api.cn | 第5列（123api） |
| 4 | `run-oss.js` | aliyun.com | 第6列（总生图数） |
| 5 | `run-vector.js` | vectorengine.ai | 第2列（向量引擎消费） |

## 注意事项

1. **执行顺序**：必须先运行云雾脚本（步骤1），它负责创建新日期行
2. **首次运行**：需要手动登录，登录状态会自动保存到 `*-auth.json`
3. **123api自动登录**：优先使用已保存的 `api123-auth.json`，也可通过环境变量 `API123_USERNAME` 和 `API123_PASSWORD` 自动登录
4. **超时处理**：登录超时4分钟自动退出
5. **零消费**：向量引擎和123api未提取到数据时自动填写0
6. **阿里云OSS无文件夹**：如果步骤4报错"未找到日期文件夹"，说明当天无生图，需手动写入0
7. **数据已最新**：如果显示"没有需要采集的日期，数据已是最新！"，说明无需采集

## 补救命令

### 阿里云OSS无数据时写入0
当步骤4报错"未找到日期文件夹: YYYY-MM-DD"时，执行以下命令写入0（将日期替换为实际日期）：
```bash
cd "F:\tuosir90-claude-code\meiritongjiAPIshuju\aliyun-oss-crawler" && node -e "const { writeToExcel } = require('./oss-crawler'); writeToExcel('2026/1/31', 0);"
```
**注意**：日期格式必须是 `YYYY/M/D`（如 2026/1/31），与Excel中的格式一致

## 输出文件

`F:\tuosir90-claude-code\meiritongjiAPIshuju\每日数据整理.xlsx`

| 日期 | 向量引擎消费 | 云雾api消费 | 糖果姐姐api | 123api | 总生图数 |
|------|-------------|------------|------------|--------|---------|

## 运行输出示例

```
=== 云雾API 数据抓取脚本 ===

检测到 3 个缺失日期需要采集：
  - 2026/2/2
  - 2026/2/3
  - 2026/2/4

[1/3] 采集日期: 2026/2/2
查询范围: 2026-02-02 00:00:00 ~ 2026-02-03 00:00:00
...
[2/3] 采集日期: 2026/2/3
...
[3/3] 采集日期: 2026/2/4
...
全部完成
```
