# Channel Web Modules

## 目标

当前实现不再追求“无需构建即可打开”，而是转成更适合长期迭代的轻量组件化架构。

重点不是追求框架感，而是让未来改某个界面区域时，模型和人都只需要读局部：

- 页面装配层
- 稳定 UI block
- 用例动作
- 统一 store

## 当前加载顺序

`index.html` 只负责：

1. 挂载 `#app`
2. 注入可选的 `public/channel-runtime.js` 兜底配置
3. 加载 `src/main.js`

`src/main.js` 再按固定顺序组装：

1. `shared/styles/*`
2. `shared/state/store.js`
3. `shared/data/channel-data-service.js`
4. `features/app-actions.js`
5. `screens/channel-page/`
6. `blocks/*`

## 模块边界

### `src/screens`

放页面装配，不放业务细节。

- `channel-page/`：拼装 block、订阅 store、驱动全局渲染

### `src/blocks`

放稳定 UI block。

- `template.js`：block 模板
- `selectors.js`：把 store slice 转成 view model
- `events.js`：block 的事件出口
- `styles.css`：block 局部语义样式
- `index.js`：block 入口

### `src/features`

按用户能力组织动作，不直接操作 DOM。

- `runtime/`：频道初始化
- `feed/`：feed 加载、评论抽屉、复制正文
- `composer/`：发帖、匿名、图片、身份编辑
- `shell/`：侧边栏与顶部状态
- `app-actions.js`：动作装配

### `src/shared`

放跨业务复用资源。

- `state/store.js`：统一状态源
- `data/channel-data-service.js`：Supabase data service
- `lib/helpers.js`：工具函数
- `styles/`：tokens、基础样式、页面级样式

## 后续演进规则

1. 新增界面区域，优先加新 block，不要塞进已有大模板
2. 新增展示规则，优先改对应 block selector
3. 新增行为，优先改 `src/features/`
4. 新增状态字段，优先改 `store.js`
5. 新增扩展能力，优先挂到 `feed item extensions / composer capability registry / overlay registry`
