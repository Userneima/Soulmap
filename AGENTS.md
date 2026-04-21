# Channel Project Guide

## Project Overview

### Purpose
Channel 是一个社区频道 web app 仓库。

当前正式入口是 `apps/channel-web/`。这个仓库的目标不是继续堆原型，而是维护一个可持续演进的频道产品骨架，让后续的 UI 调整、交互补全、数据接入和权限能力都能在清晰边界内继续推进。

### Current Product Shape
当前实现已经覆盖最小频道互动闭环，重点能力包括：

- 频道列表
- 进入频道
- 发帖
- 评论抽屉
- 频道身份切换与编辑
- 登录门禁
- 加入申请
- 成员审核面板
- 通知中心
- 创建频道

### Core Success Criteria
- 改某个界面区域时，不需要重新吞整页结构和全局脚本
- 模块边界清晰，能快速判断改动应该落在 `blocks`、`features`、`shared/state` 还是 `docs`
- 最小频道互动闭环可以持续演进，而不是再次退回一次性原型

---

## Tech Stack

- Framework: Vite
- Language: JavaScript
- Testing: Vitest + jsdom
- Backend / Data: Supabase
- Deployment baseline: Vercel
- Runtime config: `VITE_*` first, `public/channel-runtime.js` fallback

常用命令：

- `npm run dev:web`
- `npm run build:web`
- `npm run test:web`
- `npm run check`

---

## Project Structure

### Repository

```text
apps/                        当前持续演进的应用代码
apps/channel-web/            当前维护中的社区频道 web app
docs/                        架构说明、设计规则、部署文档
prototypes/                  归档原型和历史探索稿，仅作参考
supabase/                    Supabase 相关文件和说明
```

规则：

- 新功能只加在 `apps/channel-web/`
- `prototypes/` 只用于参考，不作为继续开发入口
- 结构性决策优先写进 `docs/architecture/`

### App Structure

`apps/channel-web/` 当前关键入口：

- `apps/channel-web/index.html`
- `apps/channel-web/src/main.js`

`apps/channel-web/src/` 内部按下面的边界组织：

```text
src/screens/                 页面装配层
src/blocks/                  稳定 UI block
src/features/                用例动作编排
src/entities/                业务配置和稳定常量
src/shared/                  store、data、config、styles、helpers
src/test/                    当前测试
```

补充说明：

- `src/screens/` 负责页面装配和渲染节奏，不承载业务细节
- `src/blocks/` 负责局部 UI、selector、事件出口和局部样式
- `src/features/` 负责行为编排，不直接操作 DOM
- `src/entities/` 放频道、身份、帖子等稳定业务配置
- `src/shared/` 放跨业务复用资源，包括 `config`、`data`、`state`、`styles`、`lib`

当前高优先级参考文档：

- `docs/architecture/repository-structure.md`
- `docs/architecture/channel-web-implementation.md`
- `docs/architecture/channel-web-modules.md`
- `docs/design/quiet-curator.md`

---

## Execution / Collaboration Rules

### Communication
- Lead with conclusion
- Default response language: Chinese
- Code / commands / variables: English
- Do not flatter
- Do not add unnecessary praise or padding
- Point out problems directly
- When the user asks for UI adjustments, do the full adjustment instead of ending with "next step" suggestions
- 默认直接执行你判断为合理的下一步，不要停在“建议用户做什么”
- 如果已经能安全继续，就直接检查、修改、重启、验证并汇报结果
- 只有在高风险、不可逆、涉及权限/费用/删除数据时才停下来确认

### Execution
- Understand the existing structure before editing
- Reuse before rewriting
- Prefer the smallest effective change
- Do not modify unrelated files
- Validate after changes with the relevant build / test commands when applicable
- 当用户目标从 UI 微调切到数据、模型、部署、权限、自动化等另一层级时，先重新锚定“这条消息真正要解决的问题”再执行，禁止沿用上一轮任务惯性
- 回复前必须核对“本轮实际修改/检查的内容”是否对应“用户最后一条消息”，不要复用上一轮的完成话术
- 如果本轮目标和上一轮不是同一个问题，汇报时必须明确说明当前完成的是哪一个目标，避免任务串台

### Editing Path
- 改界面时，先看对应 `src/blocks/<block>/`
- 改行为时，先看 `src/features/`
- 改状态时，先看 `apps/channel-web/src/shared/state/`
- 改运行时配置时，先看 `apps/channel-web/src/shared/config/`
- 改结构决策时，写进 `docs/architecture/`
- 不要把新功能回填到 `prototypes/`

---

## UI / Product Rules

### Product Priority
- User experience is more important than architectural neatness
- Reduce cognitive load
- Let the interface absorb complexity
- Show the core interaction first and hide secondary complexity

### Visual Direction
- 当前产品气质应保持安静、克制、偏编辑感，不做嘈杂的社交产品视觉
- 优先通过 tonal layering 建立层级，不靠高对比硬边框切区
- 浮层、弹窗、抽屉默认做小，避免抢走主内容注意力
- 对齐当前页面整体气质，优先于单个局部组件自嗨

### UI Review Checklist
- When the user provides a reference image, match the overall product style first, not just the local component
- Before considering a UI task done, check these explicitly:
  - size and proportion
  - alignment and vertical centering
  - spacing rhythm
  - whether the new component visually fits the current page
  - whether unnecessary text or decorative elements were introduced
  - whether any browser-default focus ring, white outline, native select style, or system highlight leaked into the UI
- Popovers, dialogs, and floating panels should default to a smaller size; avoid oversized overlays
- Triggered floating panels should anchor to the trigger instead of using guessed fixed offsets; by default, align the panel's top-right corner to the triggering icon's bottom-center unless a reference image specifies another relationship
- Keep layout and component composition close to the existing tuned page unless the user explicitly asks for a redesign
- If a reference only implies structure or spacing, follow the reference for structure, proportion, and placement, while keeping the current page's color language unless asked otherwise
- Do not leave placeholder copy, helper text, or extra labels when the user wants a cleaner UI
- Alignment is critical: text, icons, avatars, buttons, and input content should share clear visual axes
- Form controls must not rely on browser-default focus appearance; always replace native white rings, outlines, and native control leakage with the intended project style, or remove them if no custom focus treatment is desired

---

## Validation / Safety / Git

### Validation
- 文档类改动也要做校对，不要把验证伪装成功能测试
- 至少检查路径、命名、命令、模块名称和当前仓库一致
- 如果改的是功能，不要跳过相关的 build / test / lint

### Safety
- Never place secrets in code
- Never expose credentials or tokens

### Git
- Commit messages in English
- Never run `git push` unless explicitly asked
- Never assume the deployment workflow; check project docs first
