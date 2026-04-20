# Channel

当前仓库已经从“整理过的原型”升级成“可持续演进的静态 web app 骨架”。继续开发的入口已经不再叫 prototype，而是明确收敛到正式应用目录。

当前主入口：
- `apps/channel-web/index.html`：当前维护中的社区频道 web app
- `docs/architecture/repository-structure.md`：仓库结构与落地规则
- `docs/architecture/channel-web-implementation.md`：当前实现架构
- `docs/architecture/channel-web-modules.md`：模块边界与加载顺序
- `docs/deployment/vercel.md`：Vercel 部署基线方案
- `docs/design/quiet-curator.md`：视觉系统来源文档
- `prototypes/stitch-v1/index.html`：早期导出稿，仅作对照参考

目录约定：
- `apps/`：持续演进的实现代码，只在这里加功能
- `docs/`：设计原则、结构说明、后续决策
- `prototypes/`：归档原型与探索稿，不作为继续开发入口
- `supabase/`：后端与本地 Supabase 相关文件

运行方式：
- `npm run dev:web`：在 `http://localhost:43173` 启动 `apps/channel-web`
- `npm run check`：检查当前 web app 脚本语法
