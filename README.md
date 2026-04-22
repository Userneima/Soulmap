# Soulmap

当前仓库已经从“整理过的原型”升级成“可持续演进的社区产品骨架”。产品名是 `Soulmap`，当前正式 web 实现仍落在 `apps/channel-web/`。

当前主入口：
- `apps/channel-web/index.html`：当前维护中的社区频道 web app
- `docs/architecture/repository-structure.md`：仓库结构与落地规则
- `docs/architecture/channel-web-implementation.md`：当前实现架构
- `docs/architecture/channel-web-modules.md`：模块边界与加载顺序
- `docs/deployment/vercel.md`：Vercel 部署基线方案
- `docs/design/quiet-curator.md`：视觉系统来源文档
- `docs/product/soulmap-assignment.md`：当前产品作业与场景说明
- `prototypes/stitch-v1/index.html`：早期导出稿，仅作对照参考

目录约定：
- `apps/`：持续演进的实现代码，只在这里加功能
- `docs/`：设计原则、结构说明、后续决策
- `prototypes/`：归档原型与探索稿，不作为继续开发入口
- `scripts/`：仓库级辅助脚本；个人本地快捷方式不要纳入版本控制
- `supabase/`：后端与本地 Supabase 相关文件

文档规则：
- `docs/product/` 保留 Markdown 源文档，不提交导出 PDF
- `prototypes/` 只保留仍有参考价值的历史稿，不堆临时截图和导出物

运行方式：
- `npm run dev:web`：在 `http://localhost:43173` 启动 `apps/channel-web`
- `npm run build:web`：构建生产产物到 `apps/channel-web/dist`
- `npm run check`：运行测试并执行生产构建
