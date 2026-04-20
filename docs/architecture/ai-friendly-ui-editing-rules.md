# AI-Friendly UI Editing Rules

目标：让未来改界面时，模型尽量只读局部，不重新吞整页。

## 入口规则

1. 页面入口只从 `apps/channel-web/src/main.js` 和 `src/screens/channel-page/` 开始看
2. 不再从 `index.html` 里找页面结构
3. 不再从旧的全局 DOM 文件找元素引用

## 改 UI 时先判断变更落点

1. 纯展示改动：优先只改对应 `src/blocks/<block>/template.js` 和 `styles.css`
2. 展示规则改动：优先改对应 `src/blocks/<block>/selectors.js`
3. 用户行为改动：优先改 `src/features/`
4. 数据字段变动：优先改 `src/shared/state/store.js` 和 `src/shared/data/channel-data-service.js`

## 禁止事项

1. 不要把新功能直接塞回整页模板
2. 不要让 block 直接读 Supabase
3. 不要让 feature 直接操作 DOM
4. 不要在模板里重新堆大量 utility class

## 推荐工作流

1. 先定位 block
2. 再看对应 selector
3. 最后看相关 feature action

如果一个改动需要同时读 4 个以上 block，通常说明边界需要重新拆分。
