---
name: daily-data-crawler
description: |
  每日数据自动抓取工具。按顺序执行七个浏览器自动化脚本（ZIKL、糖果姐姐API、APIMart、阿里云OSS、向量引擎、馒小白、新世界API），
  从各平台抓取消费数据和统计信息，自动写入Excel表格。章鱼哥AI/OtuAI 不再纳入未来流程，历史列和历史数据保留但不再写入。
  **按平台补齐**：APIMart、馒小白和新世界API只查询昨天；这些列中昨天之前的历史空白直接填0，不发起历史网页采集。其他平台继续使用各自既有的缺失日期策略。
  触发场景：用户需要抓取每日API消费数据、运行数据统计脚本、更新每日数据表格。
  This skill should be used when user mentions "每日数据", "抓取数据", "运行爬虫", "数据统计",
  "ZIKL", "糖果", "APIMart", "阿里云OSS", "向量引擎", "馒小白", "新世界" or needs to crawl daily API consumption data.

---

# 每日数据自动抓取

## 本 Skill 全局文档路径

`F:\tuosir90-claude-code\meiritongjiAPIshuju\.claude\skills\daily-data-crawler\SKILL.md`

## 核心特性：按平台补齐

七个入口脚本的补齐范围并不相同，禁止用一个“扫描整列空白并逐日网页补采”的通用规则覆盖所有平台：
1. 获取当前系统时间并确定昨天。
2. APIMart、馒小白：先把昨天之前该平台列中的全部空白直接写为 `0.00`，再且只再查询昨天；不得访问昨天之前的日期。
3. 新世界API：沿用“昨天之前历史空白补0、只查询昨天”的规则。
4. 其他平台继续按各入口脚本已经实现的缺失日期策略执行。

**本轮缺失日期例外（强制，高于历史补0规则）**：如果本轮 `每日数据整理.xlsx` 的待补日期包含昨天之前的真实缺失日期（例如因前一日流程中断导致同时缺 `2026-09-12` 和 `2026-09-13`），APIMart、馒小白、新世界API不得把这些日期按“历史空白”直接写 `0`。必须先按指定日期实际查询页面/API并写入真实值；只有指定日期查询本身返回 0 或无消费时，才允许写 0。

## CRITICAL: 执行规则

**必须严格按照下方的命令执行，禁止猜测或修改脚本名称！**

- 脚本名称固定为 `run-zikl.js`、`run-tangguo.js`、`run-api123.js`、`run-oss.js`、`run-vector.js`、`run-manxiaobai.js`、`run-xinshijie.js`
- 主流程的 `scripts/run-yunwu.js` 是 `run-zikl.js` 的兼容别名，当前两者调用同一 ZIKL 看板链路；确认别名实现后可沿用主流程入口，禁止当成另一个平台再次执行。
- 不要使用 `*-crawler.js`，那些是模块文件，不是入口脚本
- 每个步骤必须等待上一步完成后再执行
- `run-zikl.js` 必须打开 `https://img.zikl.dev/dashboard/overview`，禁止恢复或手动打开其他ZIKL控制台域名
- `run-zikl.js` ZIKL 页面原始消费额度以倍率 `1` 直接写入第3列；数据由已验证的看板接口查询
- `run-tangguo.js` 糖果姐姐API已切换到与 ZIKL 相同的新看板界面，必须打开 `https://newapi.pockgo.com/dashboard/overview`，通过 `/api/user/auth/refresh` 和 `/api/data/self` 接口查询；页面原始消费额度以倍率 `1` 直接写入第4列。
- `run-api123.js` 是历史文件名，当前实际平台是 **APIMart**；执行、汇报和同步口径必须写 APIMart，金额按页面统计额度乘以 `7` 写入第5列。
- `run-api123.js` 不得把整列历史空白作为网页待采日期。运行时先将昨天之前的 APIMart 空白填 `0.00`，只允许网页查询昨天。
- `run-manxiaobai.js` 馒小白已切换到与 ZIKL 相同的新看板界面，必须打开 `https://api.manxiaobai.online/dashboard/overview`，通过 `/api/user/auth/refresh` 和 `/api/data/self` 接口查询；页面原始消费额度按 `1.1` 倍写入第6列（充值 11 元到账 10 元的倍率换算）。
- `run-manxiaobai.js` 同样先将昨天之前的馒小白空白填 `0.00`，只允许网页查询昨天；禁止从最早空白日期开始逐日补采。
- `run-xinshijie.js` 抓取新世界API（New API console 模板，入口 `https://api.novaeworld.top/console`；旧 `otuapi.com` 已迁移且 `/console` 返回 404）；只采集昨天一天，昨天之前历史日期的 `新世界API` 列补 `0`，页面统计额度原值写入 `新世界API` 表头所在列。
- 章鱼哥AI/OtuAI 不再纳入未来流程：旧章鱼哥入口不得执行，禁止补写章鱼哥AI为 `0`，禁止恢复到每日流程。
- 任一脚本即使退出码为 `0`，只要输出包含 `出错:`、`错误:`、`登录超时`，或缺少对应平台的“数据已写入”证据，都不得判定为成功。必须记录错误原文、停止或按明确补救规则处理，并在最后复核 `每日数据整理.xlsx` 对应日期整行。

## 执行命令（直接复制执行）

### 步骤1：ZIKL
```bash
powershell -Command "Set-Location 'F:\tuosir90-claude-code\meiritongjiAPIshuju\scripts'; node run-zikl.js"
```
**打开页面（强制）**：`https://img.zikl.dev/dashboard/overview`。首次没有保存 `scripts\zikl-auth.json` 时，或保存态只匹配其他域名时，脚本会打开浏览器等待用户手动登录；检测到登录成功后会自动保存 cookie/storage state，后续执行复用该登录态。脚本进入侧边栏“数据看板”，随后使用已验证的看板接口按日期查询，不依赖旧控制台的日期弹窗。
**已验证接口（2026-08-09）**：数据看板路径为 `/dashboard/models`。脚本通过 `POST https://img.zikl.dev/api/user/auth/refresh` 使用保存的刷新 Cookie 获取短期 access token，并调用 `GET https://img.zikl.dev/api/data/self?start_timestamp=<Unix秒>&end_timestamp=<Unix秒>&default_time=hour` 查询指定时间段。认证 token 仅在浏览器内存中使用，禁止记录到日志、文档或回复。响应 `data[].quota` 求和后除以 `/api/status` 中的 `quota_per_unit`（当前 `500000`）得到页面原始消费额度，ZIKL倍率为 `1`，直接写入第3列。单日期试运行：`node run-zikl.js --date=YYYY-MM-DD --dry-run`；去掉 `--dry-run` 后写入 Excel。
**ZIKL保存态恢复（2026-08-12）**：`scripts\zikl-auth.json` 存在且包含未过期 `new_api_refresh` 时，页面仍可能落到登录页，原因是前端未自动把 refresh cookie 恢复成可见菜单登录态。此时脚本必须先调用 `/api/user/auth/refresh` 做 API 级脱敏探测；refresh 成功即可继续调用 `api/data/self` 采集并更新 `zikl-auth.json`，禁止仅凭页面没有 `/dashboard/models` 菜单就等待手动登录到超时。refresh 探测不得打印 access token；只有 refresh 失败且页面仍无登录态时，才等待用户手动登录。

### 步骤2：糖果姐姐API
```bash
powershell -Command "Set-Location 'F:\tuosir90-claude-code\meiritongjiAPIshuju\tangguo-api-crawler'; node run-tangguo.js"
```
**打开页面（强制）**：`https://newapi.pockgo.com/dashboard/overview`。脚本复用 ZIKL 数据看板链路：先用保存的 refresh cookie 调用 `POST /api/user/auth/refresh`，再调用 `GET /api/data/self?start_timestamp=<Unix秒>&end_timestamp=<Unix秒>&default_time=hour` 查询指定日期，并通过 `/api/status` 的 `quota_per_unit` 把 `data[].quota` 汇总成页面原始消费额度。认证 token 仅在浏览器内存中使用，禁止记录到日志、文档或回复。糖果姐姐API倍率固定为 `1`，直接写入第4列。单日期试运行：`node run-tangguo.js --date=YYYY-MM-DD --dry-run`；去掉 `--dry-run` 后写入 Excel。

### 步骤3：APIMart
```bash
powershell -Command "Set-Location 'F:\tuosir90-claude-code\meiritongjiAPIshuju\api123-crawler'; node run-api123.js"
```

### 步骤4：阿里云OSS
```bash
powershell -Command "Set-Location 'F:\tuosir90-claude-code\meiritongjiAPIshuju\aliyun-oss-crawler'; node run-oss.js"
```
进程里没有只读 Key 时，`oss-api-counter.js` 会直接读取 Windows 用户级环境变量（`HKCU\Environment`），所以命令里不用先载入变量。在设置变量之前就已打开的会话，以及 bash、cmd、PowerShell 5.1/7、Codex，用这条普通命令都可以。2026-11-04 实测：PowerShell 5.1 进程里没有变量时仍读到 Key，11-02 统计为 1469，一致。不要在命令里套嵌套双引号，因为 PowerShell 5.1 调用外部程序时不转义内层双引号，参数会被拆坏。

**只读 API 模式（2026-11-03 实现，2026-11-04 启用）**：配置专用只读 AccessKey 后，`run-oss.js` 在打开浏览器前先尝试 API 统计，不需要登录。
- Key 来源：用户级环境变量 `OSS_READONLY_ACCESS_KEY_ID` / `OSS_READONLY_ACCESS_KEY_SECRET`（RAM 子账号，只授予 bucket `meigong-design-system-v2` 前缀 `generated/*` 的 `oss:ListObjects`）。只读这两个专用变量，不使用本机其他项目的 `OSS_ACCESS_KEY_ID` 等变量。
- 读取顺序：先读进程环境变量，没有再读用户级环境变量（`reg query HKCU\Environment`），全程不回显值。测试里必须注入空读取器，不能读到本机真实 Key（断言失败时会打印实际值）。
- 逻辑在 `aliyun-oss-crawler\oss-api-counter.js`（官方 SDK `ali-oss`，V4 签名）：先拿 Excel 最近一个已入库正数做阳性对照，ListObjectsV2 分页统计结果一致才用 API 写入待补日期，不一致或接口报错就退回下面的浏览器流程；统计不计入与前缀同名的目录占位对象。
- 成功证据：`阳性对照通过：...`、`[API] YYYY/M/D 前缀 generated/YYYY-MM-DD/ 对象总数: N`、"数据已写入"。只读核对：`node oss-api-counter.js --date=YYYY-MM-DD[,YYYY-MM-DD]`，输出 `excel=… api=… match=…`。测试：`node --test scripts/oss-api-counter.test.cjs`。
- 2026-11-04 已启用：
  - RAM 子账号 `oss-readonly-counter`（主账号下），只开永久 AccessKey，不开控制台登录。
  - 授权的自定义策略为 `oss-readonly-meigong-generated`：只允许 `oss:ListObjects`，资源 `acs:oss:*:*:meigong-design-system-v2`，条件 `oss:Prefix StringLike generated/*`。
  - Key 已写入两个用户级环境变量。值不在任何文档、日志或记忆里，下载的 CSV 已删除。
  - 核对：2026-11-02 / 11-01 / 10-31 的 API 统计为 1469 / 508 / 739，与已入库值全部一致。
  - 最小权限反向检查：同 bucket 其他前缀、不带前缀、其他 bucket（`shiping-1-2`）都返回 `AccessDenied 403`。
- 若以后返回 `InvalidAccessKeyId` / `AccessDenied`，或阳性对照不一致，脚本会自动退回浏览器流程。此时检查这个子账号的 AccessKey 是否被禁用或删除，以及策略是否被改动；禁止为了让它通过而放宽策略。

### 步骤5：向量引擎
```bash
powershell -Command "Set-Location 'F:\tuosir90-claude-code\meiritongjiAPIshuju\vectorengine-crawler'; node run-vector.js"
```

### 步骤6：馒小白
```bash
powershell -Command "Set-Location 'F:\tuosir90-claude-code\meiritongjiAPIshuju\manxiaobai-crawler'; node run-manxiaobai.js"
```
**打开页面（强制）**：`https://api.manxiaobai.online/dashboard/overview`。脚本复用 ZIKL 数据看板链路：先用保存的 refresh cookie 调用 `POST /api/user/auth/refresh`，再调用 `GET /api/data/self?start_timestamp=<Unix秒>&end_timestamp=<Unix秒>&default_time=hour` 查询指定日期，并通过 `/api/status` 的 `quota_per_unit` 把 `data[].quota` 汇总成页面原始消费额度。认证 token 仅在浏览器内存中使用，禁止记录到日志、文档或回复。馒小白最终写入值为页面原始消费额度乘以 `1.1`。单日期试运行：`node run-manxiaobai.js --date=YYYY-MM-DD --dry-run`；去掉 `--dry-run` 后写入 Excel。

### 步骤7：新世界API
```bash
powershell -Command "Set-Location 'F:\tuosir90-claude-code\meiritongjiAPIshuju\xinshijie-api-crawler'; node run-xinshijie.js"
```

## 脚本说明

| 顺序 | 入口脚本 | 数据来源 | 写入列 |
|------|----------|----------|--------|
| 1 | `run-zikl.js` | `https://img.zikl.dev/dashboard/overview` | 第3列（ZIKL，页面原始额度，倍率1） |
| 2 | `run-tangguo.js` | `https://newapi.pockgo.com/dashboard/overview` | 第4列（糖果姐姐API，页面原始额度，倍率1） |
| 3 | `run-api123.js` | `https://apimart.ai/zh/overview` | 第5列（APIMart，统计额度美元乘以7再写入） |
| 4 | `run-oss.js` | `https://oss.console.aliyun.com/bucket/oss-cn-hangzhou/meigong-design-system-v2/object?path=generated%2F` | `总生图数`表头所在列 |
| 5 | `run-vector.js` | `https://www.openlux.ai/login?redirect=%2Fconsole` | 第2列（向量引擎，原始额度乘以8） |
- 向量引擎已迁移到OpenLux：登录后使用 `/console/dashboard` 的 `/api/data/self` 查询，按 `/api/status` 的 `quota_per_unit` 还原原始金额，再乘8写入第2列。请求需在浏览器内用已保存用户状态设置 `New-Api-User`，不得打印用户状态或Cookie。认证/接口失败或quota无效必须停止，禁止按0写入。
| 6 | `run-manxiaobai.js` | `https://api.manxiaobai.online/dashboard/overview` | 第6列（馒小白，页面原始额度乘以1.1） |
| 7 | `run-xinshijie.js` | `https://api.novaeworld.top/console` | `新世界API`表头所在列；只采集昨天，历史补0 |

## 注意事项

1. **执行顺序**：必须先运行ZIKL脚本（步骤1），它负责创建新日期行
2. **首次运行**：需要手动登录，登录状态会自动保存到 `*-auth.json`；ZIKL对应 `scripts\zikl-auth.json`，首次登录完成后自动保存 cookie/storage state
3. **ZIKL金额与接口查询**：页面展示的原始消费额度以倍率 `1` 直接写入 Excel 第3列；脚本必须完成会话刷新和 `api/data/self` 查询，不依赖旧控制台日期弹窗
4. **糖果姐姐API金额与接口查询**：新界面已与 ZIKL 一致，页面展示的原始消费额度以倍率 `1` 直接写入 Excel 第4列；脚本必须完成会话刷新和 `api/data/self` 查询，不再依赖旧 `/console` 搜索弹窗或 `统计额度` 文本提取
4. **APIMart金额换算**：页面展示的是统计额度，抓取后必须乘以 `7`，再作为真实每日费用写入 Excel
5. **APIMart自动登录**：优先使用已保存的 `api123-auth.json`，也可通过环境变量 `API123_USERNAME` 和 `API123_PASSWORD` 自动登录
   - 如果 APIMart 手动登录验证总失败，但用户提供 Cookie-Editor / 浏览器导出的 APIMart Cookie JSON，可转换后注入 `api123-crawler\api123-auth.json`，不能原样覆盖。转换规则：只保留 `name/value/domain/path/expires/httpOnly/secure/sameSite`；`expirationDate` 转 `expires`；会话 Cookie 用 `expires=-1`；`sameSite=unspecified` 转 `Lax`，`no_restriction` 转 `None`；保留 httpOnly `session` Cookie。写入前备份旧状态，若 `.bak-*` 未被 `.gitignore` 忽略，应移到 `%TEMP%`；日志、记忆和回复只记录 Cookie 数量、字段校验和是否包含 `session`，禁止输出 Cookie 值。
   - Cookie-Editor JSON 通常不包含 Playwright `origins/localStorage`；若转换后可视浏览器仍跳 `/zh/login`，但旧 `api123-auth.json` 备份中存在 `https://apimart.ai` origin 和 localStorage `user` 键，应合并为“新 Cookie + 旧 APIMart origin/localStorage”。合并后必须脱敏验证 `cookieCount`、`hasSessionCookie`、`hasLocalStorageUser`、URL 是否为 `/zh/overview`、`/api/web/user/self` 是否 `200`，再重跑 `node run-api123.js`；禁止输出 Cookie、token 或 localStorage 值。
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
16. **Node Playwright依赖**：如果报缺少 `chromium-1200` 或提示 `npx playwright install`，禁止把安装命令作为每日固定动作；先检查并复用 `%LOCALAPPDATA%\ms-playwright\chromium-*\chrome-win*.exe`、系统 Chrome 或系统 Edge。只有确认没有可用浏览器时，才在 `F:\tuosir90-claude-code\meiritongjiAPIshuju` 执行 `npx playwright install chromium`，并从失败的子步骤重跑
17. **Python Playwright影响**：Node Playwright 安装可能清理 Python Playwright 的旧浏览器目录；后续 Python 步骤若报 `chromium_headless_shell-1155` 缺失，也应先检查并复用已安装 Chromium/Chrome/Edge，只有无可用浏览器时才执行 `python -m playwright install chromium`

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

### 新世界 Cookie 保存与下次登录复用

- 用户提供新世界 Cookie-Editor JSON 时，先确认旧 `run-xinshijie.js` 实例已退出；旧 `xinshijie-api-crawler\xinshijie-auth.json` 备份到 `%TEMP%`，不要把备份放到可提交目录。
- 将 Cookie 转为 Playwright storage state：只保留 `name/value/domain/path/expires/httpOnly/secure/sameSite`；`expirationDate` 转 `expires`，会话 Cookie 使用 `-1`，`strict/lax/no_restriction` 分别转 `Strict/Lax/None`。不得记录 Cookie 值。
- 合并保留旧状态中 `https://api.novaeworld.top` 的 `origins/localStorage`，保存到既有 `xinshijie-api-crawler\xinshijie-auth.json`；先用 `git check-ignore` 确认该文件不会提交。
- 每次运行优先通过该文件的 `storageState` 直接打开 `https://api.novaeworld.top/console`。只有复用后确实跳到登录页才等待人工登录；成功证据为“已登录状态”、目标日期额度及“数据已写入”。用户本轮真实待补日期继续使用 `--date=YYYY-MM-DD`，不恢复历史补0。

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

- 新世界 API 的 `xinshijie-auth.json` 存在不代表登录态仍有效。若 `run-xinshijie.js` 输出“等待手动登录”后出现 `出错: 登录超时（4分钟）`，必须停在第7子步骤（2026-11-03 核实：`console-cost-runner.js` 出错时已设退出码1，但仍以输出证据为准）；等待用户在新窗口完成登录后，只重跑 `node run-xinshijie.js`，禁止重复执行前6项。只有日志同时出现“检测到登录成功”、目标日期统计额度和“数据已写入”才算补救成功。

### 每日全流程防错补充（2026-07-26）

- APIMart 可能因临时网络波动出现 `page.goto: net::ERR_CONNECTION_TIMED_OUT` 或 `net::ERR_NETWORK_CHANGED`，且进程退出码仍为 0。只要输出包含 `出错:` 就不得判成功；先用 `curl.exe -I --max-time 30 https://apimart.ai/zh/overview` 验证网络，若返回 HTTP 200，再只重跑 `node run-api123.js`。成功必须出现 APIMart 页面额度、按 7 倍换算结果和“数据已写入”。

### 每日全流程防错补充（2026-08-04）

- ZIKL API 当前通过数据看板接口查询，脚本不得依赖旧控制台日期弹窗或 `Confirm` 按钮；必须验证会话刷新和 `api/data/self` 响应成功。
- ZIKL API 页面统计额度就是原始消费额度，倍率固定为 `1`，直接写入 `每日数据整理.xlsx` 第3列；执行记忆和汇报需同时记录页面原值、倍率和最终写入值。
- `run-zikl.js` 即使退出码为 `0`，只要输出包含 `出错:`（例如等待确认按钮超时）或缺少“数据已写入”证据，都必须按ZIKL子步骤失败处理；只修复/重跑 `node run-zikl.js`，通过后再继续后续平台。

### 每日全流程防错补充（2026-08-12）

- ZIKL 的 `zikl-auth.json` 保存功能已存在，但页面级登录态判断可能失败：保存文件内有未过期 `new_api_refresh`，浏览器仍显示登录页。每日流程中遇到这种情况时，不要直接认定 cookie 未保存；应先用 `/api/user/auth/refresh` 做 API 级恢复探测，refresh 成功后继续采集并更新 `zikl-auth.json`。只有 refresh 失败或响应无 access token 时，才停在 ZIKL 子步骤等待人工登录；日志、记忆和回复均不得输出 access token。
- 若 `run-zikl.js` 输出 `保存态 refresh 校验失败 (HTTP 401): Unauthorized` 并最终 `登录超时（4分钟）`，必须判定为 ZIKL 登录态失效并停止步骤5；此时 ZIKL 负责创建的新日期行可能尚不存在，需复核 `每日数据整理.xlsx` 目标日期行是否缺失或第3列未写入，并记录为等待人工登录。用户完成 ZIKL 手动登录后，只重跑 `node run-zikl.js`，成功后再顺序执行糖果姐姐API、APIMart、OSS、向量引擎、馒小白和新世界API。

### 每日全流程防错补充（2026-08-10）

- APIMart 与馒小白的平台启用前日期可能长期保持空白，这些空白不是网页补采任务。两个入口都必须先把“昨天之前”的空白批量写为 `0.00`，随后只查询昨天；即使发现几十个历史空白，也禁止从最早日期打开网页逐日查询。
- 如果日志出现正在查询昨天之前的日期，立即停止该子步骤并按失败处理。修复或确认补零逻辑后只重跑对应入口，前序成功平台不得重复执行。
- 完成后必须分别记录 APIMart/馒小白历史补零数量、实际网页查询日期，并复核两列昨天之前的空白计数均为 `0`。

### 每日全流程防错补充（2026-08-11）

- APIMart / 馒小白入口如果没有单独打印“本轮历史补零数量”，但日志只查询昨天，且最终复核 `每日数据整理.xlsx` 中昨天之前对应列空白计数均为 `0`，可用“脚本未输出补零数量，已用最终空白数=0兜底核对”作为成功证据；不得为补齐该计数字段而重新逐日访问历史网页。

### 每日全流程防错补充（2026-08-13）

- APIMart 出现 `net::ERR_CONNECTION_TIMED_OUT` 时，如果系统 DNS 解析出的地址连接超时，但独立公共 DNS 返回不同的候选地址，先逐个使用 `curl.exe --resolve apimart.ai:443:<候选IP> https://apimart.ai/zh/overview` 做只读 HTTPS 验证。只有候选地址返回 HTTP 200，才允许使用已测试的进程级 Chromium host resolver 兜底；禁止修改系统 DNS 或 hosts。
- 进程级兜底必须保持显式、临时和可回退：仅在本次命令设置 `APIMART_HOST_RESOLVER_IP=<已验证IP>` 后运行 `node run-api123.js`，默认未设置时行为不变。成功标准仍是目标日期页面额度、7 倍换算值和“数据已写入”同时出现；成功后只继续后续平台，不重复前序成功子步骤。
- 修改 APIMart 网络兜底代码后必须运行 `node --test scripts/daily-pipeline-apimart-crawler.test.cjs`，确认无效 IP 被拒绝、未设置变量时不注入规则、有效 IP 只影响 `apimart.ai`。日志和记忆只记录候选 IP 与连通结果，不记录账号、Cookie 或 token。

### 每日全流程防错补充（2026-08-21）

- APIMart 超时补救必须有成功连通证据才可继续：若 `run-api123.js` 输出 `出错: page.goto: net::ERR_CONNECTION_TIMED_OUT`，直连 `curl.exe -I --max-time 30 https://apimart.ai/zh/overview` 失败，且系统 DNS / `1.1.1.1` / `8.8.8.8` 候选 IP 经 `curl.exe -I --max-time 30 --resolve apimart.ai:443:<候选IP> https://apimart.ai/zh/overview` 全部失败，则不得设置 `APIMART_HOST_RESOLVER_IP`、不得写入 APIMart 为 `0`、不得继续 OSS/向量引擎/馒小白/新世界API。此时步骤5必须停止在 APIMart，并记录候选 IP、curl 退出码、重跑输出以及 `每日数据整理.xlsx` 目标日期行中 APIMart 和后续列仍为空的证据。
- 如果每日全流程已经成功执行 ZIKL 和糖果姐姐API，并在 APIMart 连通性安全门失败后停止，网络或代理恢复后应进入 `api123-crawler` 目录执行 `node run-api123.js` 续跑，再顺序执行 OSS、向量引擎、馒小白、新世界API；不要重复执行已成功的 ZIKL / 糖果姐姐API，避免重复写入或覆盖已验证值。
- 馒小白前端已切换为 ZIKL 同款数据看板，不得继续使用向量引擎 console 弹窗搜索逻辑。`run-manxiaobai.js` 必须使用 `runZiklDashboardCrawler`，打开 `/dashboard/overview`，经 `/api/user/auth/refresh` 和 `/api/data/self` 查询目标日期，输出接口记录数、原始 quota、quota_per_unit、页面原始金额、`1.1` 倍率和最终写入值。若只看到旧 console 搜索按钮、弹窗日期或 `统计额度` 文本提取日志，应停止并修正脚本后重跑。

### 每日全流程防错补充（2026-08-28）

- 新世界API 复用 New API console 模板，登录后可能先出现 Semi UI `系统公告` / 通知类 `.semi-modal-wrap`。如果公告遮罩拦截搜索按钮，`run-xinshijie.js` 可能在 `locator.click` 时报超时；不得把它误判为登录态失效或查询按钮选择器失效。
- `scripts\console-cost-runner.js` 必须在点击搜索前关闭所有阻塞性公告/通知弹窗（包括标题或按钮为“系统公告”“我知道了”“确定”“关闭”等常见形态），再继续日期筛选和额度读取。修复后必须运行 `node --test scripts/console-cost-runner.test.cjs`，确认公告关闭逻辑不会破坏无公告页面。
- 若步骤5前序平台已经成功，只能从 `xinshijie-api-crawler` 目录重跑 `node run-xinshijie.js`，禁止重复执行 APIMart、OSS、向量引擎或馒小白。成功标准仍是目标日期统计额度、写入 `新世界API` 列和“数据已写入”三项同时出现。

### 每日全流程防错补充（2026-09-02）

- 阿里云 OSS 控制台初始导航不要等待 `networkidle`：OSS 页面可能持续保持控制台轮询或资源请求，导致 `page.goto(... waitUntil: 'networkidle')` 超时，但这不等同于登录失效或目标日期无文件夹。`aliyun-oss-crawler/run-oss.js` 应使用 `waitUntil: 'domcontentloaded'` 完成初始进入，再用前缀搜索、统计弹窗中的 `当前目录=generated/YYYY-MM-DD/` 和 `对象总数` 作为成功标准。
- 若 OSS 子步骤首次失败点是 `networkidle` 超时，且尚未统计目录或写入 Excel，只允许修复/重跑 `node run-oss.js`；不要重复执行前序已成功的 ZIKL、糖果姐姐API、APIMart，也不要把 `总生图数` 补写为 `0`。成功证据仍必须包含目标日期前缀搜索、目录精确匹配、对象总数和“数据已写入”。

### 每日全流程防错补充（2026-09-14）

- APIMart、馒小白、新世界API的“昨天之前历史空白补0”只适用于平台启用前或明确不属于本轮待补范围的历史空白。若本轮缺失日期列表包含昨天之前的日期，必须把这些日期作为真实待采日期处理，禁止直接补0。
- 对昨天之前的本轮待补日期，进入对应目录后优先使用指定日期入口逐日采集：`node run-api123.js --date=YYYY-MM-DD`、`node run-manxiaobai.js --date=YYYY-MM-DD`、`node run-xinshijie.js --date=YYYY-MM-DD`。指定日期模式必须关闭历史补0副作用，只写当前目标日期。
- 如果任一入口尚不支持 `--date=YYYY-MM-DD` 或指定日期模式仍会顺带补0其他历史日期，必须先修复入口脚本并通过 `node --check`，再执行采集；禁止为了推进流程把真实待补日期写成 0。
- 记忆和汇报必须逐日期记录页面原始额度/API quota、倍率、最终写入值和 Excel 行复核。实际查询返回 0 时，也要写明“已按目标日期查询后为 0”，不能写成“历史补0”。

### 每日全流程防错补充（2026-09-18）

- 最终复核 `每日数据整理.xlsx` 时必须先读取第一行实际表头再定位列。文档示例可能使用 `APIMart（真实费用）`，当前主表实际表头可能是 `APIMart`；遇到名称差异只修正只读复核脚本，不重跑已成功的API采集，也不得因此改写历史列。

### 每日全流程防错补充（2026-09-22）

- 阿里云 OSS 页面可能在固定等待时间内仍未完成渲染。`run-oss.js` 必须等待前缀匹配输入框可见（条件等待，超时保存页面摘要和截图）后再执行目标日期搜索；只有前缀搜索完成、正文包含 `generated/`、无加载态且目标日期确实不存在时，才允许写入 0。

### 每日全流程防错补充（2026-10-13）

- 登录等待期间出现 `Target page, context or browser has been closed` 时，先记录浏览器关闭和退出码；错误处理中的截图也可能因同一原因失败，末尾“全部完成”不能替代写入证据。确认旧入口已退出后，可按既有 Cookie 转换/同域 origin 保留规则恢复登录态；新世界仅重跑 `node run-xinshijie.js --date=YYYY-MM-DD`，验证直接进入“已登录状态”、目标日期统计额度和“数据已写入”，不重复前六项。

### 每日全流程防错补充（2026-10-14）

- 新世界保存态加载后仍等待登录，先查上次记忆和既有 `xinshijie-auth.json`，脱敏核对修改时间、session Cookie 元信息、同域 `user` localStorage 与 Git 忽略状态，再用同一保存态只读验证重定向。Cookie 本地未到期不保证服务器接受；若跳转 `/login?expired=true`，应明确“已保存，但旧会话被网站拒绝”。用户提供新 Cookie 时按既有规则备份、转换并保留 origins，仅恢复本轮指定日期，不能重复前六项或把等待登录误报为 Cookie 未保存。

### 每日全流程防错补充（2026-10-19）

- 糖果姐姐API `run-tangguo.js` 若 `page.goto(..., waitUntil: 'domcontentloaded')` 超时，即使直连 HTTPS 探测返回 HTTP 200，也不得判定成功。先确认旧入口已退出并保存本轮错误截图，执行一次只读连通性探测后，仅重跑糖果姐姐入口一次；若再次在同一导航阶段超时，停止步骤5，不得跳过该平台、继续后续入口或将目标日期补0。记忆中核对并记录目标日期行的已写/空白列。
- 已确认的最小兼容方式：共享数据看板运行器接受平台配置的 `waitUntil`，默认仍为 `domcontentloaded`；糖果姐姐若响应已提交但不会触发该事件，可在其 `CONFIG` 使用 `waitUntil: 'commit'`。登录检测及采集仍须通过保存态 refresh、`/api/data/self` 和逐日期写入证据验收。
- APIMart 在本轮真实待补日期包含昨天之前的日期时，必须用 `node run-api123.js --date=YYYY-MM-DD` 逐日采集；若普通入口先把该日期历史补0后又因导航/网络失败，需先恢复该日期单元格为空，再按指定日期实际查询。APIMart 若响应可达但 `domcontentloaded` 不触发，可在 `goto` 使用 `waitUntil: 'commit'`，仍须有页面额度、7倍换算和“数据已写入”证据。

### 每日全流程防错补充（2026-11-03）

- APIMart 总览页可能弹出站内模态公告，例如「API Key 安全更新提醒」，按钮为"我已知晓 / 前往 API Key 管理"。base-ui 遮罩 `data-slot="dialog-overlay"` 会拦截对 `button:has-text("自定义")` 的点击，表现为 `locator.click: Timeout 30000ms exceeded`、退出码1，此时不会写入 Excel。`api123-crawler\apimart-date-filter.js` 已新增 `dismissBlockingNoticeDialogs`，在 `applyCustomDateRange` 点击"自定义"之前运行：只处理文本含 公告/提醒/通知/Notice/Announcement 的可见 `[role="dialog"]` / `[role="alertdialog"]`，只点击确认或关闭类白名单按钮（我已知晓、知道了、关闭公告、aria-label Close），禁止点击跳转类按钮。遇到新的按钮文案时，只扩充确认/关闭类白名单，运行 `node --test scripts/daily-pipeline-apimart-crawler.test.cjs`，然后只重跑 `node run-api123.js`。成功证据仍须包含页面额度、7倍换算和"数据已写入"。
- 某平台前几日都有消费、目标日期却返回0条记录或额度为0时，先用同一入口 `--date=<最近已入库日期> --dry-run` 做只读复查。复查返回值与已入库值一致，才把目标日期判为"实际查询为0"，并在记忆中写明复查证据；不一致则停止该平台，排查会话或接口问题。
- 7个入口的主流程出错时都会设退出码1（2026-11-03 核实：ZIKL/糖果/馒小白的 `main()`、`run-api123.js`、`run-oss.js`、`run-vector.js`、`console-cost-runner.js`）。例外：`run-oss.js` 浏览器流程中单个日期失败（输出 `日期 YYYY/M/D 采集失败: ...`，且不是"未找到日期文件夹"）只记日志并继续下一个日期，进程仍可能退出0。所以成败必须同时看输出里有没有 `出错:` / `采集失败`，以及每个目标日期的"数据已写入"。
- 每日全流程开始前由 `F:\baech0485-code\yciixingzhixingsuoyou-skill\.claude\skills\daily-workflow-executor\scripts\login_health_check.js` 统一探测这7个平台的登录态，失效的集中提醒用户、用 `--login --only <id>` 打开登录窗口。体检复用各平台 `*-crawler.js` 的 URL 和登录态文件：ZIKL/糖果/馒小白看 refresh 接口，APIMart 看 `/api/web/user/self`，向量/新世界看 `/api/user/self`，OSS 看文件列表是否加载。
- 新世界站点的两个主 JS 包各3MB以上，2026-11-03 实测下载只有50—85KB/s，60秒内页面都加载不完，`run-xinshijie.js` 的30秒 `page.goto` 会超时。这时 `curl` 拿首页 HTML 仍是200，登录态接口也正常，属于站点慢、不是登录失效。先等一会儿只重跑新世界；`page.goto` 超时上限尚未调整，需用户确认后再改。
