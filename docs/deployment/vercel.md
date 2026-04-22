# Vercel 部署方案

## 结论

这个项目最稳的部署方式不是加一层 Node server，也不是把 Supabase 再包进 Vercel Functions。

最稳方案是：

1. 继续保持 `Vite + 静态产物 + Supabase 浏览器直连`
2. 用 Vercel 只负责静态托管和环境变量注入
3. 把频道和 Supabase 配置收敛到 `VITE_*` 环境变量
4. 把安装、构建、产物目录固定在 `vercel.json`

这样部署面最小，失败点最少，Preview 和 Production 的行为也最容易保持一致。

## 为什么这是当前仓库的最优解

当前应用只有一个前端入口，数据访问全部走 Supabase JS SDK，仓库里也没有必须放到 Vercel Serverless Functions 的服务端逻辑。

如果为了“更像正式部署”额外引入：

- 自建 API 层
- Vercel Functions
- SSR
- 中间层代理

得到的不是更稳，而是更多环境差异、更多权限点、更多排查路径。

## 当前部署基线

- Node 版本：`20.x`
- 包管理：`npm ci`
- 构建命令：`npm run build:web`
- 输出目录：`apps/channel-web/dist`
- Vercel Framework Preset：`Vite`

这些已经固定在仓库根目录：

- `vercel.json`
- `package.json`
- `.nvmrc`

## 环境变量约定

前端公开配置统一走这 4 个变量：

- `VITE_CHANNEL_SLUG`
- `VITE_CHANNEL_NAME`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

模板文件：

- `.env.example`

注意：

- `VITE_*` 会进入浏览器 bundle，所以这里只能放公开配置
- `supabasePublishableKey` 不是服务端密钥，可以放在前端环境变量里
- `service_role` 之类的真正敏感密钥不能放进这个项目的前端环境变量

## 配置读取顺序

运行时配置现在按这个顺序读取：

1. `import.meta.env.VITE_*`
2. `window.channelRuntimeConfig`

对应实现：

- `apps/channel-web/src/shared/config/runtime-config.js`

这意味着：

- 在 Vercel 上，主路径应当使用环境变量
- `public/channel-runtime.js` 只保留为可选兜底，不再承载生产配置

## Vercel 项目设置

在 Vercel 控制台里按下面配置：

1. Import 当前 Git 仓库
2. Framework Preset 选 `Vite`
3. Root Directory 保持仓库根目录
4. Build Command 使用仓库内配置，不额外覆盖
5. Output Directory 使用仓库内配置，不额外覆盖

环境变量至少填：

- `VITE_CHANNEL_SLUG`
- `VITE_CHANNEL_NAME`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

建议分环境：

- Production：正式频道和正式 Supabase 项目
- Preview：预览频道和预览 Supabase 项目，避免误写生产数据

不要让 Preview 直接连生产库，这不是方便，是制造脏数据。

## 本地与 Vercel 对齐方式

本地开发建议使用：

```bash
cp .env.example .env.local
npm run dev:web
```

如果已经把项目接到 Vercel，建议直接拉环境变量：

```bash
vercel env pull .env.local --yes
```

这样本地和云端不会各配各的。

## 部署前检查

每次上线前至少跑：

```bash
npm run check
```

检查通过再部署。这个项目目前最常见的上线问题不是 Vercel 本身，而是：

- 环境变量缺失
- 环境变量指向了错误的 Supabase 项目
- Preview / Production 混用同一套数据

## 不建议现在做的事

当前阶段不建议为了部署“看起来更完整”去做这些：

- 给前端再包一层自定义后端
- 把 Supabase 请求改成经 Vercel Functions 转发
- 引入 SSR 或 Next.js 迁移
- 把公开运行时配置继续写死在静态文件里

这些都不会让当前仓库更稳，只会让部署面更复杂。
