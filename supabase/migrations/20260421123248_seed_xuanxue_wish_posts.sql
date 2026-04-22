do $$
declare
    target_channel_id uuid;
    target_owner_identity_id uuid;
    alias_wenzi_id uuid;
    alias_mimi_id uuid;
    alias_xiangxiang_id uuid;
    alias_pingguo_id uuid;
    alias_zhangyushao_id uuid;
    alias_xiaowugui_id uuid;
    alias_jian_id uuid;
    alias_yu_id uuid;
    alias_binggan_id uuid;
    alias_kk_id uuid;
    alias_abao_id uuid;
    alias_trytry_id uuid;
begin
    select id
    into target_channel_id
    from public.channels
    where slug = 'pd23856970';

    if target_channel_id is null then
        raise exception 'Channel pd23856970 must exist before seeding xuanxue wish posts.';
    end if;

    select id
    into target_owner_identity_id
    from public.identities
    where channel_id = target_channel_id
      and role = 'owner'
    order by created_at asc
    limit 1;

    if target_owner_identity_id is null then
        raise exception 'Owner identity for channel pd23856970 must exist before seeding xuanxue wish posts.';
    end if;

    insert into public.alias_sessions (
        channel_id,
        identity_id,
        slot_key,
        display_name,
        avatar_url,
        status,
        last_used_at
    )
    values
        (target_channel_id, target_owner_identity_id, 'wish-wenzi', '雯子', 'https://api.dicebear.com/9.x/thumbs/svg?seed=wenzi', 'active', now()),
        (target_channel_id, target_owner_identity_id, 'wish-mimi', '咪咪', 'https://api.dicebear.com/9.x/thumbs/svg?seed=mimi', 'active', now()),
        (target_channel_id, target_owner_identity_id, 'wish-xiangxiang', '想想', 'https://api.dicebear.com/9.x/thumbs/svg?seed=xiangxiang', 'active', now()),
        (target_channel_id, target_owner_identity_id, 'wish-pingguo', '苹果', 'https://api.dicebear.com/9.x/thumbs/svg?seed=pingguo', 'active', now()),
        (target_channel_id, target_owner_identity_id, 'wish-zhangyushao', '章鱼烧', 'https://api.dicebear.com/9.x/thumbs/svg?seed=zhangyushao', 'active', now()),
        (target_channel_id, target_owner_identity_id, 'wish-xiaowugui', '小乌龟', 'https://api.dicebear.com/9.x/thumbs/svg?seed=xiaowugui', 'active', now()),
        (target_channel_id, target_owner_identity_id, 'wish-jian', '健', 'https://api.dicebear.com/9.x/thumbs/svg?seed=jian', 'active', now()),
        (target_channel_id, target_owner_identity_id, 'wish-yu', '鱼', 'https://api.dicebear.com/9.x/thumbs/svg?seed=yu', 'active', now()),
        (target_channel_id, target_owner_identity_id, 'wish-binggan', '饼干', 'https://api.dicebear.com/9.x/thumbs/svg?seed=binggan', 'active', now()),
        (target_channel_id, target_owner_identity_id, 'wish-kk', 'kk', 'https://api.dicebear.com/9.x/thumbs/svg?seed=kk', 'active', now()),
        (target_channel_id, target_owner_identity_id, 'wish-abao', '阿豹', 'https://api.dicebear.com/9.x/thumbs/svg?seed=abao', 'active', now()),
        (target_channel_id, target_owner_identity_id, 'wish-trytry', 'Trytry', 'https://api.dicebear.com/9.x/thumbs/svg?seed=trytry', 'active', now())
    on conflict (channel_id, identity_id, slot_key) do update
    set display_name = excluded.display_name,
        avatar_url = excluded.avatar_url,
        status = excluded.status,
        last_used_at = excluded.last_used_at;

    select id into alias_wenzi_id from public.alias_sessions where channel_id = target_channel_id and identity_id = target_owner_identity_id and slot_key = 'wish-wenzi';
    select id into alias_mimi_id from public.alias_sessions where channel_id = target_channel_id and identity_id = target_owner_identity_id and slot_key = 'wish-mimi';
    select id into alias_xiangxiang_id from public.alias_sessions where channel_id = target_channel_id and identity_id = target_owner_identity_id and slot_key = 'wish-xiangxiang';
    select id into alias_pingguo_id from public.alias_sessions where channel_id = target_channel_id and identity_id = target_owner_identity_id and slot_key = 'wish-pingguo';
    select id into alias_zhangyushao_id from public.alias_sessions where channel_id = target_channel_id and identity_id = target_owner_identity_id and slot_key = 'wish-zhangyushao';
    select id into alias_xiaowugui_id from public.alias_sessions where channel_id = target_channel_id and identity_id = target_owner_identity_id and slot_key = 'wish-xiaowugui';
    select id into alias_jian_id from public.alias_sessions where channel_id = target_channel_id and identity_id = target_owner_identity_id and slot_key = 'wish-jian';
    select id into alias_yu_id from public.alias_sessions where channel_id = target_channel_id and identity_id = target_owner_identity_id and slot_key = 'wish-yu';
    select id into alias_binggan_id from public.alias_sessions where channel_id = target_channel_id and identity_id = target_owner_identity_id and slot_key = 'wish-binggan';
    select id into alias_kk_id from public.alias_sessions where channel_id = target_channel_id and identity_id = target_owner_identity_id and slot_key = 'wish-kk';
    select id into alias_abao_id from public.alias_sessions where channel_id = target_channel_id and identity_id = target_owner_identity_id and slot_key = 'wish-abao';
    select id into alias_trytry_id from public.alias_sessions where channel_id = target_channel_id and identity_id = target_owner_identity_id and slot_key = 'wish-trytry';

    insert into public.posts (
        id,
        channel_id,
        board_slug,
        identity_id,
        alias_session_id,
        body,
        media,
        ai_disclosure,
        views_count,
        likes_count,
        shares_count,
        comments_count,
        created_at,
        updated_at
    )
    values
        (
            'e1a00001-1111-4111-8111-111111111111',
            target_channel_id,
            'wish',
            null,
            alias_wenzi_id,
            '有没有懂塔罗或者周易的家人帮我测测这个月的运势',
            '[]'::jsonb,
            'none',
            0,
            0,
            0,
            0,
            now(),
            now()
        ),
        (
            'e1a00002-2222-4222-8222-222222222222',
            target_channel_id,
            'wish',
            null,
            alias_mimi_id,
            '有考虑过什么玄学问题吗?',
            '[]'::jsonb,
            'none',
            0,
            0,
            0,
            0,
            now() - interval '1 minute',
            now() - interval '1 minute'
        ),
        (
            'e1a00003-3333-4333-8333-333333333333',
            target_channel_id,
            'wish',
            null,
            alias_xiangxiang_id,
            '想听你念一句咒语',
            '[]'::jsonb,
            'none',
            0,
            0,
            0,
            0,
            now() - interval '2 minutes',
            now() - interval '2 minutes'
        ),
        (
            'e1a00004-4444-4444-8444-444444444444',
            target_channel_id,
            'wish',
            null,
            alias_pingguo_id,
            '天使给我分享几条可以改运的玄学🙌',
            '[]'::jsonb,
            'none',
            0,
            0,
            0,
            0,
            now() - interval '3 minutes',
            now() - interval '3 minutes'
        ),
        (
            'e1a00005-5555-4555-8555-555555555555',
            target_channel_id,
            'wish',
            null,
            alias_zhangyushao_id,
            '希望收到天使的一个幸运好物',
            '[]'::jsonb,
            'none',
            0,
            0,
            0,
            0,
            now() - interval '4 minutes',
            now() - interval '4 minutes'
        ),
        (
            'e1a00006-6666-4666-8666-666666666666',
            target_channel_id,
            'wish',
            null,
            alias_xiaowugui_id,
            '连着两天被交警抓，实验不顺利，天使帮我驱一下邪',
            '[]'::jsonb,
            'none',
            0,
            0,
            0,
            0,
            now() - interval '5 minutes',
            now() - interval '5 minutes'
        ),
        (
            'e1a00007-7777-4777-8777-777777777777',
            target_channel_id,
            'wish',
            null,
            alias_jian_id,
            '分享一下听说过/发生在自己身上的最玄学的事情~（想听故事了嘿嘿）',
            '[]'::jsonb,
            'none',
            0,
            0,
            0,
            0,
            now() - interval '6 minutes',
            now() - interval '6 minutes'
        ),
        (
            'e1a00008-8888-4888-8888-888888888888',
            target_channel_id,
            'wish',
            null,
            alias_yu_id,
            '希望天使收集自己或者朋友的三件玄学幸运小物品，拍张照片',
            '[]'::jsonb,
            'none',
            0,
            0,
            0,
            0,
            now() - interval '7 minutes',
            now() - interval '7 minutes'
        ),
        (
            'e1a00009-9999-4999-8999-999999999999',
            target_channel_id,
            'wish',
            null,
            alias_binggan_id,
            '分享一个你身上发生的玄学小事件',
            '[]'::jsonb,
            'none',
            0,
            0,
            0,
            0,
            now() - interval '8 minutes',
            now() - interval '8 minutes'
        ),
        (
            'e1a00010-1010-4010-8010-101010101010',
            target_channel_id,
            'wish',
            null,
            alias_kk_id,
            '听一个显化成功故事',
            '[]'::jsonb,
            'none',
            0,
            0,
            0,
            0,
            now() - interval '9 minutes',
            now() - interval '9 minutes'
        ),
        (
            'e1a00011-1111-4111-8111-111111111112',
            target_channel_id,
            'wish',
            null,
            alias_abao_id,
            '想要一些平日能改变运势的玄学小知识',
            '[]'::jsonb,
            'none',
            0,
            0,
            0,
            0,
            now() - interval '10 minutes',
            now() - interval '10 minutes'
        ),
        (
            'e1a00012-1212-4212-8212-121212121212',
            target_channel_id,
            'wish',
            null,
            alias_trytry_id,
            '点一首充满能量和玄学的歌',
            '[]'::jsonb,
            'none',
            0,
            0,
            0,
            0,
            now() - interval '11 minutes',
            now() - interval '11 minutes'
        )
    on conflict (id) do update
    set board_slug = excluded.board_slug,
        alias_session_id = excluded.alias_session_id,
        body = excluded.body,
        media = excluded.media,
        ai_disclosure = excluded.ai_disclosure,
        views_count = excluded.views_count,
        likes_count = excluded.likes_count,
        shares_count = excluded.shares_count,
        comments_count = excluded.comments_count,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at;
end
$$;
