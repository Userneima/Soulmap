# Channel Web Implementation

## 目标

当前实现的目标不再是“把原型脚本整理得稍微好看一点”，而是把界面修改成本真正降下来。

这次架构收敛遵循三条原则：

- 页面只做装配，不直接写死整页结构
- block 只负责自己的视图和事件出口，不直接碰 Supabase
- feature 只负责用例编排和状态变更，不直接操作 DOM

## 当前实现入口

- `apps/channel-web/index.html`
- `apps/channel-web/src/main.js`
- `apps/channel-web/src/screens/channel-page/`

## 目录边界

### `src/screens`

页面装配层。

- `channel-page/`：主页面装配、block 挂载、全局渲染节奏

### `src/blocks`

稳定 UI block。

- `sidebar-nav/`
- `channel-hero/`
- `board-tabs/`
- `composer-panel/`
- `feed-list/`
- `comment-drawer/`
- `identity-dialog/`
- `system-feedback/`

### `src/features`

真正的用例动作，按用户能力组织。

- `runtime/`
- `feed/`
- `composer/`
- `shell/`
- `app-actions.js`

### `src/entities`

业务实体配置和稳定业务常量。

- `channel/config.js`
- `identity/config.js`
- `post/config.js`

### `src/shared`

跨业务复用内容和基础设施。

- `data/channel-data-service.js`
- `lib/helpers.js`
- `state/store.js`
- `styles/tokens.css`
- `styles/foundations.css`
- `styles/app.css`

### `public`

浏览器静态资源和可选运行时兜底配置。

- `public/channel-runtime.js`

### `src/shared/config`

运行时配置归一入口。

- `runtime-config.js`

## 为什么这次改造能减少未来改界面 token

之前的主要问题不是“功能放错目录”，而是任何界面改动都要同时重新读：

- 大号 `index.html`
- 大号 feature 文件
- 全局 DOM 和全局状态

现在新的边界是：

1. `screen` 只负责装配 block
2. `block` 只负责自己的视图和事件
3. `feature` 只负责动作编排
4. `store` 只负责统一状态
5. 样式从 utility 串转成 token + 语义类

这样后续改“评论抽屉”时，通常只需要读：

- `src/blocks/comment-drawer/`
- 相关 `feature` 动作
- 对应 selector

而不需要再把整页骨架、全局 DOM 和其他功能区一起读进上下文。

## 当前数据落点

1. `src/shared/config/runtime-config.js` 优先读取 `VITE_*`，并兼容 `public/channel-runtime.js` 兜底
2. `channel-data-service.js` 负责频道初始化、身份初始化、匿名马甲初始化，以及 feed / composer 数据读写
3. `store.js` 作为唯一前端状态源
4. `blocks/*/selectors.js` 负责把 store slice 转成页面 view model

## 下一步建议

1. 把 `comment-drawer` 和 `identity-dialog` 再细化成更稳定的局部 DOM 同步
2. 把图片从 data URL 过渡到 Supabase Storage
3. 给 `feed item extensions / composer capability registry / overlay registry` 接上真实扩展能力
4. 如果 block 数量继续增长，再评估是否迁到更完整的组件框架
