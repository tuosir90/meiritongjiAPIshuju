---
name: daily-data-crawler
description: |
  每日数据自动抓取工具。按顺序执行六个浏览器自动化脚本（云雾API、糖果姐姐API、APIMart、阿里云OSS、向量引擎、馒小白），
  从各平台抓取消费数据和统计信息，自动写入Excel表格。章鱼哥AI/OtuAI 不再纳入未来流程，历史列和历史数据保留但不再写入。
  **支持批量补采**：自动检测所有缺失日期（从Excel最新日期+1天到昨天），一次性采集所有缺失数据。
  触发场景：用户需要抓取每日API消费数据、运行数据统计脚本、更新每日数据表格。
  This skill should be used when user mentions "每日数据", "抓取数据", "运行爬虫", "数据统计",
  "云雾", "糖果", "APIMart", "阿里云OSS", "向量引擎", "馒小白" or needs to crawl daily API consumption data.

---

# 每日数据自动抓取

## 本 Skill 全局文档路径

`F:\tuosir90-claude-code\meiritongjiAPIshuju\.claude\skills\daily-data-crawler\SKILL.md`

## 核心特性：智能补采

脚本会自动检测缺失的日期范围：
1. 获取当前系统时间（今天是几号）
2. 读取Excel中最新日期
3. 计算缺失日期：从"最新日期+1天"到"昨天"
4. 批量采集所有缺失日期的数据

## CRITICAL: 执行规则

**必须严格按照下方的命令执行，禁止猜测或修改脚本名称！**

- 脚本名称固定为 `run-yunwu.js`、`run-tangguo.js`、`run-api123.js`、`run-oss.js`、`run-vector.js`、`run-manxiaobai.js`
- 不要使用 `*-crawler.js`，那些是模块文件，不是入口脚本
- 每个步骤必须等待上一步完成后再执行
- `run-api123.js` 是历史文件名，当前实际平台是 **APIMart**；执行、汇报和同步口径必须写 APIMart，金额按页面统计额度乘以 `7` 写入第5列。
- `run-manxiaobai.js` 抓取馒小白（同向量引擎页面结构）；金额按页面统计额度乘以 `1.1` 写入第6列（充值 11 元到账 10 元的倍率换算）。
- 章鱼哥AI/OtuAI 不再纳入未来流程：旧章鱼哥入口不得执行，禁止补写章鱼哥AI为 `0`，禁止恢复到每日流程。
- 任一脚本即使退出码为 `0`，只要输出包含 `出错:`、`错误:`、`登录超时`，或缺少对应平台的“数据已写入”证据，都不得判定为成功。必须记录错误原文、停止或按明确补救规则处理，并在最后复核 `每日数据整理.xlsx` 对应日期整行。

## 执行命令（直接复制执行）

### 步骤1：云雾API
```bash
powershell -Command "Set-Location 'F:\tuosir90-claude-code\meiritongjiAPIshuju\scripts'; node run-yunwu.js"
```

### 步骤2：糖果姐姐API
```bash
powershell -Command "Set-Location 'F:\tuosir90-claude-code\meiritongjiAPIshuju\tangguo-api-crawler'; node run-tangguo.js"
```

### 步骤3：APIMart
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

### 步骤6：馒小白
```bash
powershell -Command "Set-Location 'F:\tuosir90-claude-code\meiritongjiAPIshuju\manxiaobai-crawler'; node run-manxiaobai.js"
```

## 脚本说明

| 顺序 | 入口脚本 | 数据来源 | 写入列 |
|------|----------|----------|--------|
| 1 | `run-yunwu.js` | yunwu.ai | 第3列（云雾api消费） |
| 2 | `run-tangguo.js` | pockgo.com | 第4列（糖果姐姐api） |
| 3 | `run-api123.js` | apimart.ai | 第5列（APIMart，统计额度美元乘以7再写入） |
| 4 | `run-oss.js` | aliyun.com | `总生图数`表头所在列；当前历史主表为第8列 |
| 5 | `run-vector.js` | vectorengine.ai | 第2列（向量引擎消费） |
| 6 | `run-manxiaobai.js` | api.manxiaobai.online | 第6列（馒小白，统计额度乘以1.1） |

## 注意事项

1. **执行顺序**：必须先运行云雾脚本（步骤1），它负责创建新日期行
2. **首次运行**：需要手动登录，登录状态会自动保存到 `*-auth.json`
3. **APIMart金额换算**：页面展示的是统计额度，抓取后必须乘以 `7`，再作为真实每日费用写入 Excel
4. **APIMart自动登录**：优先使用已保存的 `api123-auth.json`，也可通过环境变量 `API123_USERNAME` 和 `API123_PASSWORD` 自动登录
5. **超时处理**：登录超时4分钟自动退出
6. **零消费**：向量引擎和APIMart未提取到数据时自动填写0
7. **阿里云OSS弹窗校验**：步骤4必须校验目录统计弹窗的"当前目录"等于目标日期（如 `generated/2026-05-09/`）后才能写入"对象总数"，每个日期完成后必须关闭"取消/关闭"弹窗，禁止读取残留弹窗数据
8. **阿里云OSS无文件夹**：如果步骤4报错"未找到日期文件夹"，不能直接判定当天无生图，也不能立即写入0。必须先证明 OSS 文件列表已加载完成、页面正文包含 `generated/`，且不包含目标目录 `YYYY-MM-DD/`；如果页面仍有 `正在加载`、`加载中`、转圈截图，或没有 `generated/` 列表证据，必须停止并重跑/诊断，禁止写入0
9. **阿里云OSS虚拟列表防误判**：OSS 文件列表是虚拟列表，当前页面正文只包含可见行；只看到 `generated/` 和旧日期列表，不能证明目标日期不存在。查找目标日期必须先使用文件列表中的“前缀匹配”输入框搜索 `YYYY-MM-DD`，再确认目标行是否存在。只有完成前缀搜索后仍无目标行，且页面无加载态，才允许按“无文件夹”规则写入0。
10. **阿里云OSS统计按钮选择器**：当前 OSS UI 的统计入口可能是目标行“未统计”后面的刷新图标按钮 `button.statistics-balloon__refresh` / `button[spm="未统计"]`，不一定有“统计”文字。脚本必须优先点击该刷新图标，并等待弹窗中 `当前目录=generated/YYYY-MM-DD/` 与 `对象总数` 同时匹配；禁止用 `text=统计` 误匹配行内“未统计”文本。
11. **阿里云OSS登录超时**：如果输出包含 `登录超时`，即使命令退出码为 `0` 也必须按失败处理；重跑 `run-oss.js` 并等待手动登录，只有出现目标目录匹配、对象总数和写入 Excel 才算成功
12. **章鱼哥AI历史保留**：Excel 历史主表可继续保留 `章鱼哥AI` 列和历史值，但未来新增行不再写入该列。不要删除该列导致 `总生图数` 列位移，除非另行执行历史迁移方案
13. **数据已最新**：如果显示"没有需要采集的日期，数据已是最新！"，说明无需采集
14. **Node Playwright依赖**：如果报缺少 `chromium-1200` 或提示 `npx playwright install`，必须在 `F:\tuosir90-claude-code\meiritongjiAPIshuju` 执行 `npx playwright install chromium` 后，从失败的子步骤重跑
15. **Python Playwright影响**：Node Playwright 安装可能清理 Python Playwright 的旧浏览器目录；后续 Python 步骤若报 `chromium_headless_shell-1155` 缺失，应执行 `python -m playwright install chromium`

## 每日全流程记忆回写

被 `daily-workflow-executor` 调用时，必须记录：

- 六个脚本的执行顺序与每个脚本的退出状态
- 自动检测到的缺失日期列表
- 每个平台每个日期的原始页面额度、换算倍率和写入 Excel 值
- OSS 弹窗的“当前目录”和“对象总数”，确认目录等于目标日期
- 最后读取 `每日数据整理.xlsx` 复核补采日期整行数据，确认章鱼哥AI列未被写入新值
- 如果某脚本退出码为 `0` 但输出包含 `出错:` / `错误:`，必须记录为失败或部分完成
- 如执行过 `npx playwright install chromium`，在记忆文档标记“后续 Python Playwright 可能需要恢复”

## 补救命令

### 阿里云OSS无数据时写入0
只有当步骤4报错"未找到日期文件夹: YYYY-MM-DD"，并且已保存证据证明 OSS 文件列表加载完成、页面正文包含 `generated/` 且不包含目标目录 `YYYY-MM-DD/` 时，才允许执行以下命令写入0（将日期替换为实际日期）：
```bash
cd "F:\tuosir90-claude-code\meiritongjiAPIshuju\aliyun-oss-crawler" && node -e "const { writeToExcel } = require('./oss-crawler'); writeToExcel('2026/1/31', 0);"
```
**注意**：日期格式必须是 `YYYY/M/D`（如 2026/1/31），与Excel中的格式一致

## 输出文件

`F:\tuosir90-claude-code\meiritongjiAPIshuju\每日数据整理.xlsx`

| 日期 | 向量引擎消费 | 云雾api消费 | 糖果姐姐api | APIMart（真实费用） | 馒小白 | 章鱼哥AI（历史保留，不再写入） | 总生图数 |
|------|-------------|------------|------------|-------------------|--------|----------------------------|---------|
