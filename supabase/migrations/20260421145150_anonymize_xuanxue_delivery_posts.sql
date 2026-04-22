do $$
declare
    target_channel_id uuid;
    target_owner_identity_id uuid;
    alias_baiyu_id uuid;
    alias_beiqiao_id uuid;
    alias_haiyu_id uuid;
    alias_yunqi_id uuid;
    alias_nanxu_id uuid;
    alias_songtan_id uuid;
    alias_shuying_id uuid;
    alias_xingye_id uuid;
    alias_wudeng_id uuid;
    alias_qinglan_id uuid;
    alias_zhinan_id uuid;
    alias_yaochuan_id uuid;
begin
    select id
    into target_channel_id
    from public.channels
    where slug = 'pd23856970';

    if target_channel_id is null then
        raise exception 'Channel pd23856970 must exist before anonymizing xuanxue delivery posts.';
    end if;

    select id
    into target_owner_identity_id
    from public.identities
    where channel_id = target_channel_id
      and role = 'owner'
    order by created_at asc
    limit 1;

    if target_owner_identity_id is null then
        raise exception 'Owner identity for channel pd23856970 must exist before anonymizing xuanxue delivery posts.';
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
        (target_channel_id, target_owner_identity_id, 'delivery-baiyu', '白榆', 'https://api.dicebear.com/9.x/thumbs/svg?seed=baiyu', 'active', now()),
        (target_channel_id, target_owner_identity_id, 'delivery-beiqiao', '北桥', 'https://api.dicebear.com/9.x/thumbs/svg?seed=beiqiao', 'active', now()),
        (target_channel_id, target_owner_identity_id, 'delivery-haiyu', '海屿', 'https://api.dicebear.com/9.x/thumbs/svg?seed=haiyu', 'active', now()),
        (target_channel_id, target_owner_identity_id, 'delivery-yunqi', '云栖', 'https://api.dicebear.com/9.x/thumbs/svg?seed=yunqi', 'active', now()),
        (target_channel_id, target_owner_identity_id, 'delivery-nanxu', '南序', 'https://api.dicebear.com/9.x/thumbs/svg?seed=nanxu', 'active', now()),
        (target_channel_id, target_owner_identity_id, 'delivery-songtan', '松潭', 'https://api.dicebear.com/9.x/thumbs/svg?seed=songtan', 'active', now()),
        (target_channel_id, target_owner_identity_id, 'delivery-shuying', '疏影', 'https://api.dicebear.com/9.x/thumbs/svg?seed=shuying', 'active', now()),
        (target_channel_id, target_owner_identity_id, 'delivery-xingye', '星野', 'https://api.dicebear.com/9.x/thumbs/svg?seed=xingye', 'active', now()),
        (target_channel_id, target_owner_identity_id, 'delivery-wudeng', '雾灯', 'https://api.dicebear.com/9.x/thumbs/svg?seed=wudeng', 'active', now()),
        (target_channel_id, target_owner_identity_id, 'delivery-qinglan', '清岚', 'https://api.dicebear.com/9.x/thumbs/svg?seed=qinglan', 'active', now()),
        (target_channel_id, target_owner_identity_id, 'delivery-zhinan', '枝南', 'https://api.dicebear.com/9.x/thumbs/svg?seed=zhinan', 'active', now()),
        (target_channel_id, target_owner_identity_id, 'delivery-yaochuan', '遥川', 'https://api.dicebear.com/9.x/thumbs/svg?seed=yaochuan', 'active', now())
    on conflict (channel_id, identity_id, slot_key) do update
    set display_name = excluded.display_name,
        avatar_url = excluded.avatar_url,
        status = excluded.status,
        last_used_at = excluded.last_used_at;

    select id into alias_baiyu_id from public.alias_sessions where channel_id = target_channel_id and identity_id = target_owner_identity_id and slot_key = 'delivery-baiyu';
    select id into alias_beiqiao_id from public.alias_sessions where channel_id = target_channel_id and identity_id = target_owner_identity_id and slot_key = 'delivery-beiqiao';
    select id into alias_haiyu_id from public.alias_sessions where channel_id = target_channel_id and identity_id = target_owner_identity_id and slot_key = 'delivery-haiyu';
    select id into alias_yunqi_id from public.alias_sessions where channel_id = target_channel_id and identity_id = target_owner_identity_id and slot_key = 'delivery-yunqi';
    select id into alias_nanxu_id from public.alias_sessions where channel_id = target_channel_id and identity_id = target_owner_identity_id and slot_key = 'delivery-nanxu';
    select id into alias_songtan_id from public.alias_sessions where channel_id = target_channel_id and identity_id = target_owner_identity_id and slot_key = 'delivery-songtan';
    select id into alias_shuying_id from public.alias_sessions where channel_id = target_channel_id and identity_id = target_owner_identity_id and slot_key = 'delivery-shuying';
    select id into alias_xingye_id from public.alias_sessions where channel_id = target_channel_id and identity_id = target_owner_identity_id and slot_key = 'delivery-xingye';
    select id into alias_wudeng_id from public.alias_sessions where channel_id = target_channel_id and identity_id = target_owner_identity_id and slot_key = 'delivery-wudeng';
    select id into alias_qinglan_id from public.alias_sessions where channel_id = target_channel_id and identity_id = target_owner_identity_id and slot_key = 'delivery-qinglan';
    select id into alias_zhinan_id from public.alias_sessions where channel_id = target_channel_id and identity_id = target_owner_identity_id and slot_key = 'delivery-zhinan';
    select id into alias_yaochuan_id from public.alias_sessions where channel_id = target_channel_id and identity_id = target_owner_identity_id and slot_key = 'delivery-yaochuan';

    update public.posts
    set alias_session_id = alias_baiyu_id,
        media = '[{"kind":"reveal_meta","realName":"小乌龟"}]'::jsonb
    where id = 'e2b00001-1111-4111-8111-111111111111';

    update public.posts
    set alias_session_id = alias_beiqiao_id,
        media = '[{"kind":"reveal_meta","realName":"想想"}]'::jsonb
    where id = 'e2b00002-2222-4222-8222-222222222222';

    update public.posts
    set alias_session_id = alias_haiyu_id,
        media = '[{"kind":"reveal_meta","realName":"雯子"}]'::jsonb
    where id = 'e2b00003-3333-4333-8333-333333333333';

    update public.posts
    set alias_session_id = alias_yunqi_id,
        media = '[{"kind":"reveal_meta","realName":"章鱼烧"}]'::jsonb
    where id = 'e2b00004-4444-4444-8444-444444444444';

    update public.posts
    set alias_session_id = alias_nanxu_id,
        media = '[{"kind":"reveal_meta","realName":"Trytry"}]'::jsonb
    where id = 'e2b00005-5555-4555-8555-555555555555';

    update public.posts
    set alias_session_id = alias_songtan_id,
        media = '[{"kind":"reveal_meta","realName":"kk"}]'::jsonb
    where id = 'e2b00006-6666-4666-8666-666666666666';

    update public.posts
    set alias_session_id = alias_shuying_id,
        media = '[{"kind":"reveal_meta","realName":"鱼"}]'::jsonb
    where id = 'e2b00007-7777-4777-8777-777777777777';

    update public.posts
    set alias_session_id = alias_xingye_id,
        media = '[{"kind":"reveal_meta","realName":"阿豹"}]'::jsonb
    where id = 'e2b00008-8888-4888-8888-888888888888';

    update public.posts
    set alias_session_id = alias_wudeng_id,
        media = '[{"kind":"reveal_meta","realName":"健"}]'::jsonb
    where id = 'e2b00009-9999-4999-8999-999999999999';

    update public.posts
    set alias_session_id = alias_qinglan_id,
        media = '[{"kind":"reveal_meta","realName":"饼干"}]'::jsonb
    where id = 'e2b00010-1010-4010-8010-101010101010';

    update public.posts
    set alias_session_id = alias_zhinan_id,
        media = '[{"kind":"reveal_meta","realName":"苹果"}]'::jsonb
    where id = 'e2b00011-1111-4111-8111-121212121212';

    update public.posts
    set alias_session_id = alias_yaochuan_id,
        media = '[{"kind":"reveal_meta","realName":"咪咪"}]'::jsonb
    where id = 'e2b00012-1212-4212-8212-121212121212';
end $$;
