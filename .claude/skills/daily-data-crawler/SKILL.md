---
name: daily-data-crawler
description: |
  每日数据自动抓取工具。按顺序执行七个浏览器自动化脚本（ZIKL、糖果姐姐API、APIMart、阿里云OSS、向量引擎、馒小白、新世界API），
  从各平台抓取消费数据和统计信息，自动写入Excel表格。章鱼哥AI/OtuAI 不再纳入未来流程，历史列和历史数据保留但不再写入。
  **支持批量补采**：自动检测所有缺失日期（从Excel最新日期+1天到昨天），一次性采集所有缺失数据。
  触发场景：用户需要抓取每日API消费数据、运行数据统计脚本、更新每日数据表格。
  This skill should be used when user mentions "每日数据", "抓取数据", "运行爬虫", "数据统计",
  "ZIKL", "糖果", "APIMart", "阿里云OSS", "向量引擎", "馒小白", "新世界" or needs to crawl daily API consumption data.

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

- 脚本名称固定为 `run-zikl.js`、`run-tangguo.js`、`run-api123.js`、`run-oss.js`、`run-vector.js`、`run-manxiaobai.js`、`run-xinshijie.js`
- 不要使用 `*-crawler.js`，那些是模块文件，不是入口脚本
- 每个步骤必须等待上一步完成后再执行
- `run-zikl.js` 必须打开 `https://img.mzfe.de/dashboard/overview`，禁止恢复或手动打开其他ZIKL控制台域名
- `run-zikl.js` ZIKL 页面原始消费额度以倍率 `1` 直接写入第3列；数据由已验证的看板接口查询
- `run-api123.js` 是历史文件名，当前实际平台是 **APIMart**；执行、汇报和同步口径必须写 APIMart，金额按页面统计额度乘以 `7` 写入第5列。
- `run-manxiaobai.js` 抓取馒小白（同向量引擎页面结构）；金额按页面统计额度乘以 `1.1` 写入第6列（充值 11 元到账 10 元的倍率换算）。
- `run-xinshijie.js` 抓取新世界API（New API console 模板，入口 `https://api.novaeworld.top/console`；旧 `otuapi.com` 已迁移且 `/console` 返回 404）；只采集昨天一天，昨天之前历史日期的 `新世界API` 列补 `0`，页面统计额度原值写入 `新世界API` 表头所在列。
- 章鱼哥AI/OtuAI 不再纳入未来流程：旧章鱼哥入口不得执行，禁止补写章鱼哥AI为 `0`，禁止恢复到每日流程。
- 任一脚本即使退出码为 `0`，只要输出包含 `出错:`、`错误:`、`登录超时`，或缺少对应平台的“数据已写入”证据，都不得判定为成功。必须记录错误原文、停止或按明确补救规则处理，并在最后复核 `每日数据整理.xlsx` 对应日期整行。

## 执行命令（直接复制执行）

### 步骤1：ZIKL
```bash
powershell -Command "Set-Location 'F:\tuosir90-claude-code\meiritongjiAPIshuju\scripts'; node run-zikl.js"
```
**打开页面（强制）**：`https://img.mzfe.de/dashboard/overview`。首次没有保存 `scripts\zikl-auth.json` 时，或保存态只匹配其他域名时，脚本会打开浏览器等待用户手动登录；检测到登录成功后会自动保存 cookie/storage state，后续执行复用该登录态。脚本进入侧边栏“数据看板”，随后使用已验证的看板接口按日期查询，不依赖旧控制台的日期弹窗。
**已验证接口（2026-08-09）**：数据看板路径为 `/dashboard/models`。脚本通过 `POST https://img.mzfe.de/api/user/auth/refresh` 使用保存的刷新 Cookie 获取短期 access token，并调用 `GET https://img.mzfe.de/api/data/self?start_timestamp=<Unix秒>&end_timestamp=<Unix秒>&default_time=hour` 查询指定时间段。认证 token 仅在浏览器内存中使用，禁止记录到日志、文档或回复。响应 `data[].quota` 求和后除以 `/api/status` 中的 `quota_per_unit`（当前 `500000`）得到页面原始消费额度，ZIKL倍率为 `1`，直接写入第3列。单日期试运行：`node run-zikl.js --date=YYYY-MM-DD --dry-run`；去掉 `--dry-run` 后写入 Excel。

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

### 步骤7：新世界API
```bash
powershell -Command "Set-Location 'F:\tuosir90-claude-code\meiritongjiAPIshuju\xinshijie-api-crawler'; node run-xinshijie.js"
```

## 脚本说明

| 顺序 | 入口脚本 | 数据来源 | 写入列 |
|------|----------|----------|--------|
| 1 | `run-zikl.js` | `https://img.mzfe.de/dashboard/overview` | 第3列（ZIKL，页面原始额度，倍率1） |
| 2 | `run-tangguo.js` | `https://newapi.pockgo.com/console` | 第4列（糖果姐姐API） |
| 3 | `run-api123.js` | `https://apimart.ai/zh/overview` | 第5列（APIMart，统计额度美元乘以7再写入） |
| 4 | `run-oss.js` | `https://oss.console.aliyun.com/bucket/oss-cn-hangzhou/meigong-design-system-v2/object?path=generated%2F` | `总生图数`表头所在列 |
| 5 | `run-vector.js` | `https://api.vectorengine.ai/console` | 第2列（向量引擎，页面额度除以2） |
| 6 | `run-manxiaobai.js` | `https://api.manxiaobai.online/console` | 第6列（馒小白，统计额度乘以1.1） |
| 7 | `run-xinshijie.js` | `https://api.novaeworld.top/console` | `新世界API`表头所在列；只采集昨天，历史补0 |

## 注意事项

1. **执行顺序**：必须先运行ZIKL脚本（步骤1），它负责创建新日期行
2. **首次运行**：需要手动登录，登录状态会自动保存到 `*-auth.json`；ZIKL对应 `scripts\zikl-auth.json`，首次登录完成后自动保存 cookie/storage state
3. **ZIKL金额与接口查询**：页面展示的原始消费额度以倍率 `1` 直接写入 Excel 第3列；脚本必须完成会话刷新和 `api/data/self` 查询，不依赖旧控制台日期弹窗
4. **APIMart金额换算**：页面展示的是统计额度，抓取后必须乘以 `7`，再作为真实每日费用写入 Excel
5. **APIMart自动登录**：优先使用已保存的 `api123-auth.json`，也可通过环境变量 `API123_USERNAME` 和 `API123_PASSWORD` 自动登录
6. **超时处理**：登录超时4分钟自动退出
7. **零消费**：向量引擎和APIMart未提取到数据时自动填写0
8. **阿里云OSS弹窗校验**：步骤4必须校验目录统计弹窗的"当前目录"等于目标日期（如 `generated/2026-05-09/`）后才能写入"对象总数"，每个日期完成后必须关闭"取消/关闭"弹窗，禁止读取残留弹窗数据
9. **阿里云OSS无文件夹**：如果步骤4报错"未找到日期文件夹"，不能直接判定当天无生图，也不能立即写入0。必须先证明 OSS 文件列表已加载完成、页面正文包含 `generated/`，且不包含目标目录 `YYYY-MM-DD/`；如果页面仍有 `正在加载`、`加载中`、转圈截图，或没有 `generated/` 列表证据，必须停止并重跑/诊断，禁止写入0
10. **阿里云OSS虚拟列表防误判**：OSS 文件列表是虚拟列表，当前页面正文只包含可见行；只看到 `generated/` 和旧日期列表，不能证明目标日期不存在。查找目标日期必须先使用文件列表中的“前缀匹配”输入框搜索 `YYYY-MM-DD`，再确认目标行是否存在。只有完成前缀搜索后仍无目标行，且页面无加载态，才允许按“无文件夹”规则写入0。
11. **阿里云OSS统计按钮选择器**：当前 OSS UI 的统计入口可能是目标行“未统计”后面的刷新图标按钮 `button.statistics-balloon__refresh` / `button[spm="未统计"]`，不一定有“统计”文字。脚本必须优先点击该刷新图标，并等待弹窗中 `当前目录=generated/YYYY-MM-DD/` 与 `对象总数` 同时匹配；禁止用 `text=统计` 误匹配行内“未统计”文本。
12. **阿里云OSS登录超时**：如果输出包含 `登录超时`，即使命令退出码为 `0` 也必须按失败处理；重跑 `run-oss.js` 并等待手动登录，只有出现目标目录匹配、对象总数和写入 Excel 才算成功
13. **新世界API采集范围**：新世界API只采集昨天一天；昨天之前所有历史日期的 `新世界API` 列补 `0`，不得对历史日期发起网页补采。账号密码不得写入源码、文档或日志，应通过浏览器登录态/环境变量处理。
14. **章鱼哥AI历史保留**：Excel 历史主表可继续保留 `章鱼哥AI` 列和历史值，但未来新增行不再写入该列。不要删除该列导致 `总生图数` 列位移，除非另行执行历史迁移方案
15. **数据已最新**：如果显示"没有需要采集的日期，数据已是最新！"，说明无需采集
16. **Node Playwright依赖**：如果报缺少 `chromium-1200` 或提示 `npx playwright install`，必须在 `F:\tuosir90-claude-code\meiritongjiAPIshuju` 执行 `npx playwright install chromium` 后，从失败的子步骤重跑
17. **Python Playwright影响**：Node Playwright 安装可能清理 Python Playwright 的旧浏览器目录；后续 Python 步骤若报 `chromium_headless_shell-1155` 缺失，应执行 `python -m playwright install chromium`

## 每日全流程记忆回写

被 `daily-workflow-executor` 调用时，必须记录：

- 七个脚本的执行顺序与每个脚本的退出状态
- 自动检测到的缺失日期列表
- 每个平台每个日期的原始页面额度、换算倍率和写入 Excel 值；新世界API只记录昨天的页面额度和历史补0结果
- OSS 弹窗的“当前目录”和“对象总数”，确认目录等于目标日期
- 最后读取 `每日数据整理.xlsx` 复核补采日期整行数据，确认章鱼哥AI列未被写入新值
- 复核第2列时必须按 Excel 实际表头读取；当前主表使用历史表头 `向量引擎消费`，不要把缺少 `向量引擎消费` 表头误判为失败
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

| 日期 | 向量引擎消费（向量引擎业务口径） | ZIKL | 糖果姐姐api | APIMart（真实费用） | 馒小白 | 新世界API | 章鱼哥AI（历史保留，不再写入） | 总生图数 |
|------|-------------|------------|------------|-------------------|--------|-----------|----------------------------|---------|

### 每日全流程防错补充（2026-07-06）

- 本项目不存在 `python run_all.py` 聚合入口；每日全流程必须按顺序执行 `run-zikl.js`、`run-tangguo.js`、`run-api123.js`、`run-oss.js`、`run-vector.js`、`run-manxiaobai.js`、`run-xinshijie.js`。
- 用 PowerShell 包装 7 个子步骤时，输出日志不要写 `$code:` / `$status:` 这类变量后紧跟冒号的字符串；应使用 `("===STEP_EXIT==={0}:{1}:{2}" -f $name,$code,$status)`，避免 ParserError 导致一个子步骤都未执行。
- 旧的 `*-crawler.js` 文件是模块或历史文件，不是每日全流程入口。若误执行 `node zikl-api-crawler.js` 等命令并出现 `MODULE_NOT_FOUND`，说明尚未进入业务采集；必须立即改用本文“执行命令”中的 7 个 `run-*.js` 入口从失败步骤重跑，并记录初次失败未写入业务数据。

### 每日全流程防错补充（2026-07-12）

- 复核 `每日数据整理.xlsx` 最新数据时，不要按原始日期字符串排序；`2026/7/10` / `2026/7/11` 会被错误排在 `2026/7/9` 前。必须把日期解析成日期对象排序，或直接按本轮缺失日期列表精确查找目标行，并确认向量引擎/ZIKL/糖果/APIMart/馒小白/新世界API/总生图数均已填入且章鱼哥AI列未写入新值。

### 每日全流程防错补充（2026-07-14）

- 阿里云 OSS 如果输出 `未找到 OSS 文件名前缀匹配输入框`，即使进程退出码为 `0` 也必须按失败处理。先检查 `debug-page.png`：若账号已登录但 OSS 主内容区仍为空白，说明固定等待时间早于页面完成加载，不是目标日期不存在；禁止写入 `0`，停止后续平台并原命令重试一次。
- 重试只有在日志依次出现 `已按前缀搜索: YYYY-MM-DD`、`当前目录=generated/YYYY-MM-DD/`、有效 `对象总数` 和 `数据已写入` 时才算成功。若再次找不到输入框，应停止步骤5并改造脚本为条件等待，不能继续用退出码 `0` 掩盖业务失败。

### 每日全流程防错补充（2026-07-17）

- 新世界 API 的 `xinshijie-auth.json` 存在不代表登录态仍有效。若 `run-xinshijie.js` 输出“等待手动登录”后出现 `出错: 登录超时（4分钟）`，即使退出码为0也必须停在第7子步骤；等待用户在新窗口完成登录后，只重跑 `node run-xinshijie.js`，禁止重复执行前6项。只有日志同时出现“检测到登录成功”、目标日期统计额度和“数据已写入”才算补救成功。

### 每日全流程防错补充（2026-07-26）

- APIMart 可能因临时网络波动出现 `page.goto: net::ERR_CONNECTION_TIMED_OUT` 或 `net::ERR_NETWORK_CHANGED`，且进程退出码仍为 0。只要输出包含 `出错:` 就不得判成功；先用 `curl.exe -I --max-time 30 https://apimart.ai/zh/overview` 验证网络，若返回 HTTP 200，再只重跑 `node run-api123.js`。成功必须出现 APIMart 页面额度、按 7 倍换算结果和“数据已写入”。

### 每日全流程防错补充（2026-08-04）

- ZIKL API 当前通过数据看板接口查询，脚本不得依赖旧控制台日期弹窗或 `Confirm` 按钮；必须验证会话刷新和 `api/data/self` 响应成功。
- ZIKL API 页面统计额度就是原始消费额度，倍率固定为 `1`，直接写入 `每日数据整理.xlsx` 第3列；执行记忆和汇报需同时记录页面原值、倍率和最终写入值。
- `run-zikl.js` 即使退出码为 `0`，只要输出包含 `出错:`（例如等待确认按钮超时）或缺少“数据已写入”证据，都必须按ZIKL子步骤失败处理；只修复/重跑 `node run-zikl.js`，通过后再继续后续平台。
