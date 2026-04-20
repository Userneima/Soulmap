# Supabase

当前仓库还没有正式接入数据库和鉴权逻辑，但后端目录已经按落地使用方式预留出来。

建议约定：

- `supabase/migrations/`：数据库结构迁移
- `supabase/seed/`：本地开发种子数据
- `supabase/.temp/`：本地 CLI 临时产物，不入库

当前已经落了第一版 schema 迁移：

- `supabase/migrations/20260420015326_initial_channel_schema.sql`

这版的最小实体包括：

- `channels`
- `identities`
- `alias_sessions`
- `posts`
- `comments`

当前前端初始化规则：

1. 进入频道先确保 Supabase Auth session；没有 session 时自动匿名登录
2. 按 `channel slug` 读取频道，不存在则由首个进入者创建频道
3. 按 `channel_id + user_id` 初始化真实身份；频道创建者默认拿到 `owner` 身份，其余用户默认生成成员身份
4. 按 `slot_key` 初始化匿名马甲；当前固定为 4 个预设马甲位

后续真正接入时，优先补三类内容：

1. 频道、帖子、评论、身份映射的表结构
2. 匿名发布相关的权限与策略
3. 本地开发可复现的 seed 数据
