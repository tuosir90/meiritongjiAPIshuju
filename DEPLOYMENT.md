# 部署指南

## GitHub Pages 部署步骤

### 1. 创建GitHub仓库

1. 登录GitHub，创建新仓库
2. 仓库名称建议：`api-cost-tracker`
3. 可选择公开或私有仓库

### 2. 初始化Git并推送代码

在项目根目录执行以下命令：

```bash
# 初始化Git仓库
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit: API费用统计系统"

# 添加远程仓库（替换为你的仓库地址）
git remote add origin https://github.com/your-username/api-cost-tracker.git

# 推送到main分支
git push -u origin main
```

### 3. 配置GitHub Pages

1. 进入仓库的 **Settings** 页面
2. 在左侧菜单找到 **Pages**
3. 在 **Build and deployment** 部分：
   - Source: 选择 **GitHub Actions**
4. 保存设置

### 4. 触发部署

推送代码到main分支后，GitHub Actions会自动：
1. 安装依赖
2. 构建项目
3. 部署到GitHub Pages

查看部署进度：
- 进入仓库的 **Actions** 标签页
- 查看最新的workflow运行状态

### 5. 访问网站

部署成功后，可以通过以下URL访问：
- `https://your-username.github.io/api-cost-tracker/`

如果仓库名就是 `your-username.github.io`，则直接访问：
- `https://your-username.github.io/`

### 6. 自定义域名（可选）

1. 在仓库 **Settings** > **Pages** 中
2. 找到 **Custom domain** 部分
3. 输入你的域名，如 `api-tracker.yourdomain.com`
4. 在域名DNS设置中添加CNAME记录，指向 `your-username.github.io`

## 其他部署选项

### Vercel部署（推荐）

1. 访问 [vercel.com](https://vercel.com)
2. 使用GitHub账号登录
3. 点击 **New Project**
4. 导入你的GitHub仓库
5. Vercel会自动检测Next.js项目并配置
6. 点击 **Deploy**
7. 部署完成后会得到一个 `.vercel.app` 域名

**优势**:
- 自动HTTPS
- 全球CDN加速
- 自动预览部署
- 零配置

### Netlify部署

1. 访问 [netlify.com](https://netlify.com)
2. 使用GitHub账号登录
3. 点击 **Add new site** > **Import an existing project**
4. 选择GitHub仓库
5. 构建设置：
   - Build command: `npm run build`
   - Publish directory: `out`
6. 点击 **Deploy site**

### Cloudflare Pages部署

1. 登录 [Cloudflare](https://dash.cloudflare.com)
2. 进入 **Pages** 部分
3. 点击 **Create a project**
4. 连接GitHub仓库
5. 构建设置：
   - Build command: `npm run build`
   - Build output directory: `out`
6. 点击 **Save and Deploy**

## 本地测试

在部署前，建议先在本地测试：

```bash
# 构建项目
npm run build

# 预览构建结果（需要安装serve）
npx serve out
```

## 故障排查

### 部署失败

1. 检查GitHub Actions日志
2. 确认所有依赖已正确安装
3. 验证构建命令是否成功

### 页面空白

1. 检查浏览器控制台是否有错误
2. 确认 `next.config.ts` 中的 `basePath` 配置
3. 清除浏览器缓存重试

### 样式丢失

1. 确认Tailwind CSS配置正确
2. 检查 `globals.css` 是否正确导入
3. 验证构建输出包含CSS文件

## 环境变量配置

如果需要配置环境变量：

1. 在GitHub仓库 **Settings** > **Secrets and variables** > **Actions**
2. 添加需要的环境变量
3. 在 `.github/workflows/deploy.yml` 中引用

## 更新部署

每次推送到main分支时，会自动触发重新部署：

```bash
git add .
git commit -m "更新说明"
git push
```

## 注意事项

- 数据存储在浏览器localStorage中，不会上传到服务器
- 建议定期导出数据备份
- 更换设备或浏览器需要重新录入数据
- 可以通过导入功能恢复备份数据
