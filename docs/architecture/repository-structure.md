# 仓库结构

## 目标

这个仓库已经从“高保真原型准备落地”推进成“可持续演进的前端应用骨架”。

真正的问题不再是目录有没有分开，而是：

- 是否有单一入口
- 是否能按界面区域局部修改
- 是否能让业务动作、界面模板、状态流解耦

## 当前分层

### `apps/`

放当前仍在演进的实现代码。

当前主应用：
- `apps/channel-web/`

这里是后续继续加功能、接真实数据、接工程化体系的唯一入口。

### `docs/`

放设计规则和结构性说明。

- `docs/design/quiet-curator.md`
- `docs/architecture/repository-structure.md`
- `docs/architecture/channel-web-implementation.md`
- `docs/architecture/channel-web-modules.md`
- `docs/architecture/ai-friendly-ui-editing-rules.md`
- `docs/product/soulmap-assignment.md`

其中：

- `docs/architecture/` 放结构、边界、实现规则
- `docs/design/` 放视觉和界面原则
- `docs/deployment/` 放部署基线
- `docs/product/` 放产品背景、场景和方案说明
- 产品文档以 Markdown 为源，不把导出 PDF 当作长期维护对象

### `prototypes/`

放归档原型和历史探索稿。

- `prototypes/stitch-v1/`

这些文件只作参考，不再作为继续开发入口。

### `scripts/`

放仓库级辅助脚本，而不是产品代码。

- 这里可以放检查、导入、启动辅助之类的仓库工具
- 个人本地快捷脚本不要长期纳入版本控制
- 如果一个脚本没有被 `package.json`、文档或自动化流程引用，就不应该继续留在仓库里

### `supabase/`

放数据库 schema、迁移和 Supabase 相关说明。

## `apps/channel-web/` 内部约定

- `index.html`：只保留根挂载点和运行时脚本入口
- `public/`：静态资源和可选运行时兜底配置
- `src/main.js`：应用入口
- `src/screens/`：页面装配层
- `src/blocks/`：稳定 UI block
- `src/features/`：用例动作编排
- `src/entities/`：业务配置和稳定常量
- `src/shared/`：store、数据源、样式、工具函数

## 编辑规则

1. 新功能先落在 `apps/channel-web/`，不要回改 `prototypes/`
2. 改某个界面区域时，优先只读对应 `src/blocks/<block>/`
3. 改行为时，优先只读 `src/features/`
4. 改状态时，优先只读 `src/shared/state/store.js`
5. 结构性决策写进 `docs/architecture/`

## 为什么这套结构更适合持续演进

它带来的直接收益不是“更工程化”，而是：

- 任何人都知道应该从哪里继续做
- 未来改界面不需要重新吞整页 HTML 和全局脚本
- block、feature、store 已经形成稳定边界，后续即使迁框架，也是在明确边界上迁移
