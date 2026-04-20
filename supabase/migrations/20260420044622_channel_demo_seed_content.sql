do $$
declare
    target_channel_id uuid;
    target_owner_user_id uuid;
    target_identity_id uuid;
    alias_baiyu_id uuid;
    alias_beiqiao_id uuid;
    alias_haiyu_id uuid;
    alias_yunqi_id uuid;
begin
    select id, created_by
    into target_channel_id, target_owner_user_id
    from public.channels
    where slug = 'pd23856970';

    if target_channel_id is null then
        raise exception 'Channel pd23856970 must exist before seeding demo content.';
    end if;

    insert into public.identities (
        channel_id,
        user_id,
        display_name,
        avatar_url,
        role
    )
    values (
        target_channel_id,
        target_owner_user_id,
        'Yuchao',
        'https://lh3.googleusercontent.com/aida-public/AB6AXuAdn4SXXvi49UKFKBuOYSU69PaV_4engMSiIUkQpcH9Dq-zjinv9rRqNzjFK-_KuzU2Gr6HOfI2OZ-01V7rzVGIWaSyOPbg9Q5rsFMfV-JXcD32yqlps9leknFzregRkqtJVBZWeZ3TJKaExBlvUeO_2F-5IORdrpgxMw4eRaXxtuOmsn0ulMBWYOK6FZtBAis0lvg3BKhmbjcDhTRygvyVEKb6zY2afnZACw8KV6nqOp9MLhO7nLBMaFoVtMhyjFLpOuFQrJB8wuI',
        'owner'
    )
    on conflict (channel_id, user_id) do update
    set display_name = excluded.display_name,
        avatar_url = excluded.avatar_url,
        role = 'owner',
        updated_at = now()
    returning id into target_identity_id;

    insert into public.alias_sessions (channel_id, identity_id, slot_key, display_name, avatar_url, status, last_used_at)
    values
        (
            target_channel_id,
            target_identity_id,
            'slot-baiyu',
            '白榆',
            'https://lh3.googleusercontent.com/aida-public/AB6AXuAAF1xIAURg4pscz_NBpuuG-SxRtXMwz7Bj6kZwsrWNFW-odFm30orXRucNJOPwamQYgZR1TEIhZkL5O10eQJtvrDM8t822PyG2dKeoOvKHYsw6ZeMXaQUv-mcoKFb2ir32XD-DN4ZbVpW9SN4fPdJet1EmrS2L2uG_zqMTRQUXqC6d13nTjeInGSZrwvkq2IMSe99646zSnQdupaTxFNMC0rzDB4UquXVWmFsLO4Ial8RT0DgamryGslxLm-1OIJTEdDTRdHXJjC4',
            'active',
            now() - interval '2 hours'
        ),
        (
            target_channel_id,
            target_identity_id,
            'slot-beiqiao',
            '北桥',
            'https://lh3.googleusercontent.com/aida-public/AB6AXuCcKwUvE26sD93HXFPeaZKG4rcO46TtVUuH82BX4ziwxtQO6LqUqi7htZJg5ldPwrXuMlk-2HE9PBqh4V3ripA5SFIRoJzC1z5TUHOahBodZdJ6nyPtbI3ueAl8kH5khm1HV62UVFoUCxs9G6GCSfF6BwWaSCx8Mo7j_89w8D_bdtvADDehJLb4t9gCgUFtvyQYlkfWhwEvSG3zS91PnAoiMUsN4C6EDpZP2lxYDUwhc8vX9KFUg80eEZgmyLjAUr2k7jQ0cGijT-A',
            'active',
            now() - interval '4 hours'
        ),
        (
            target_channel_id,
            target_identity_id,
            'slot-haiyu',
            '海屿',
            'https://lh3.googleusercontent.com/aida-public/AB6AXuD7dADvgkUZTmxeXdVrXRGz76Ic6R6Wd6I4KZ1sPj4qgDDug3FSXbt2MHfAjLymGrdxs1loOM-lwzNDWfpjTfON7UuMTrWPl053BjvRGm_VZdQLUtD9KvLKwjz03l_X740oiKoRp8XGKaK_swULjXNS4iVPZr2Oult7W_RibE_RDDkx_dg75u32hmhdVNzVPyVRbrBVe9bJt0Utq1RZTnetWnhQFsWzK7GZYVWtLQsMrGURY_piyy7q5wJq2TUz2sc2IWSw6UTn2wE',
            'active',
            now() - interval '1 day'
        ),
        (
            target_channel_id,
            target_identity_id,
            'slot-yunqi',
            '云栖',
            'https://lh3.googleusercontent.com/aida-public/AB6AXuAMEcp_Gb2H95x3OK1WiHC-EzuWE003ywUAtg9SEVazxij0OCuoZ50_DrAn602n1xUaJmFqPITtx0LAknqLJzjQz9eO6w6a9Ak9r77Qp9_EzQPiKdoNVrvoQ1LaimRB6o8UOT5Q_WRzhrKcmgvZYNePZUUiORLaFawGrWHI_8yS8gqV-JuBxX9sDrx2FEr1gcRL1qlAoW9oXheuh309Vm9ygZmwKzVA8_iJS66DcBDj1vo1aetR7EVQKdABFPiEu_vlhKfkrn0ArYk',
            'active',
            now() - interval '3 days'
        )
    on conflict (channel_id, identity_id, slot_key) do update
    set display_name = excluded.display_name,
        avatar_url = excluded.avatar_url,
        status = excluded.status,
        last_used_at = excluded.last_used_at;

    select id into alias_baiyu_id
    from public.alias_sessions
    where channel_id = target_channel_id
      and identity_id = target_identity_id
      and slot_key = 'slot-baiyu';

    select id into alias_beiqiao_id
    from public.alias_sessions
    where channel_id = target_channel_id
      and identity_id = target_identity_id
      and slot_key = 'slot-beiqiao';

    select id into alias_haiyu_id
    from public.alias_sessions
    where channel_id = target_channel_id
      and identity_id = target_identity_id
      and slot_key = 'slot-haiyu';

    select id into alias_yunqi_id
    from public.alias_sessions
    where channel_id = target_channel_id
      and identity_id = target_identity_id
      and slot_key = 'slot-yunqi';

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
            'c0a00001-1111-4111-8111-111111111111',
            target_channel_id,
            null,
            target_identity_id,
            null,
            '这个频道先作为产品内测记录区来用。后面我会把重要决策、实验结果和需要大家投票的内容都放到这里，避免信息只停留在私聊里。',
            '[]'::jsonb,
            'none',
            126,
            18,
            6,
            3,
            now() - interval '3 days',
            now() - interval '3 days'
        ),
        (
            'c0a00002-2222-4222-8222-222222222222',
            target_channel_id,
            '国王天使',
            null,
            alias_baiyu_id,
            '试一下把「表达担心」和「提出建议」放在同一条里，沟通会顺滑很多。比如先说风险，再给一个你愿意一起推进的方案，大家更容易接得住。',
            '[]'::jsonb,
            'none',
            89,
            11,
            2,
            2,
            now() - interval '2 days 4 hours',
            now() - interval '2 days 4 hours'
        ),
        (
            'c0a00003-3333-4333-8333-333333333333',
            target_channel_id,
            null,
            null,
            alias_beiqiao_id,
            '最近在想，频道里是不是可以固定一个节奏：周一同步目标，周三暴露风险，周五只复盘结论。这样大家打开一次就知道该看什么。',
            '[]'::jsonb,
            'none',
            71,
            9,
            1,
            2,
            now() - interval '1 day 9 hours',
            now() - interval '1 day 9 hours'
        ),
        (
            'c0a00004-4444-4444-8444-444444444444',
            target_channel_id,
            '国王天使',
            target_identity_id,
            null,
            '这个频道后面会接入正式账号和审批流，所以现在看到的内容结构，不只是演示，也是在验证后续真实落地时大家会不会愿意持续回来用。',
            '[]'::jsonb,
            'none',
            58,
            7,
            1,
            1,
            now() - interval '18 hours',
            now() - interval '18 hours'
        ),
        (
            'c0a00005-5555-4555-8555-555555555555',
            target_channel_id,
            null,
            null,
            alias_haiyu_id,
            '如果频道里只能保留一个默认动作，我倾向于不是「发帖」，而是「补充上下文」。很多时候大家不是不愿意参与，而是不知道缺哪块信息。',
            '[]'::jsonb,
            'none',
            34,
            5,
            0,
            1,
            now() - interval '8 hours',
            now() - interval '8 hours'
        ),
        (
            'c0a00006-6666-4666-8666-666666666666',
            target_channel_id,
            null,
            null,
            alias_yunqi_id,
            '留一条空白问题给大家：如果这个频道明天真的开始承接真实协作，你最想先让它解决哪一个具体麻烦？',
            '[]'::jsonb,
            'none',
            19,
            3,
            0,
            2,
            now() - interval '2 hours',
            now() - interval '2 hours'
        )
    on conflict (id) do nothing;

    insert into public.comments (
        id,
        post_id,
        channel_id,
        identity_id,
        alias_session_id,
        body,
        created_at,
        updated_at
    )
    values
        (
            'd0b00001-1111-4111-8111-111111111111',
            'c0a00001-1111-4111-8111-111111111111',
            target_channel_id,
            null,
            alias_beiqiao_id,
            '支持，至少先把决策沉淀下来，不然很多讨论一周后就找不到了。',
            now() - interval '2 days 20 hours',
            now() - interval '2 days 20 hours'
        ),
        (
            'd0b00002-2222-4222-8222-222222222222',
            'c0a00001-1111-4111-8111-111111111111',
            target_channel_id,
            null,
            alias_baiyu_id,
            '如果后面能把每次实验结果也顺手挂进来，这里就真的会变成团队记忆。',
            now() - interval '2 days 16 hours',
            now() - interval '2 days 16 hours'
        ),
        (
            'd0b00003-3333-4333-8333-333333333333',
            'c0a00001-1111-4111-8111-111111111111',
            target_channel_id,
            target_identity_id,
            null,
            '对，这里不会替代私聊，但至少让关键上下文不再散掉。',
            now() - interval '2 days 14 hours',
            now() - interval '2 days 14 hours'
        ),
        (
            'd0b00004-4444-4444-8444-444444444444',
            'c0a00002-2222-4222-8222-222222222222',
            target_channel_id,
            target_identity_id,
            null,
            '这个表达方式我认同，后面可以把它沉淀成频道里的默认回复结构。',
            now() - interval '2 days',
            now() - interval '2 days'
        ),
        (
            'd0b00005-5555-4555-8555-555555555555',
            'c0a00002-2222-4222-8222-222222222222',
            target_channel_id,
            null,
            alias_haiyu_id,
            '是的，很多冲突其实不是观点不同，而是缺了一个能一起往前走的提案。',
            now() - interval '1 day 22 hours',
            now() - interval '1 day 22 hours'
        ),
        (
            'd0b00006-6666-4666-8666-666666666666',
            'c0a00003-3333-4333-8333-333333333333',
            target_channel_id,
            null,
            alias_yunqi_id,
            '这个节奏不错，尤其周三暴露风险那一步，很容易让大家早点对齐预期。',
            now() - interval '1 day 5 hours',
            now() - interval '1 day 5 hours'
        ),
        (
            'd0b00007-7777-4777-8777-777777777777',
            'c0a00003-3333-4333-8333-333333333333',
            target_channel_id,
            target_identity_id,
            null,
            '可以，后面我会把界面也朝这个节奏去收，不做一堆空功能入口。',
            now() - interval '1 day 2 hours',
            now() - interval '1 day 2 hours'
        ),
        (
            'd0b00008-8888-4888-8888-888888888888',
            'c0a00004-4444-4444-8444-444444444444',
            target_channel_id,
            null,
            alias_baiyu_id,
            '如果能把审核通过后的第一条引导也做细一点，成员首次进入就更容易开口。',
            now() - interval '14 hours',
            now() - interval '14 hours'
        ),
        (
            'd0b00009-9999-4999-8999-999999999999',
            'c0a00005-5555-4555-8555-555555555555',
            target_channel_id,
            target_identity_id,
            null,
            '这个提醒很关键，频道里最怕的就是大家都知道有问题，但没人知道下一步从哪里补。',
            now() - interval '6 hours',
            now() - interval '6 hours'
        ),
        (
            'd0b00010-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            'c0a00006-6666-4666-8666-666666666666',
            target_channel_id,
            null,
            alias_haiyu_id,
            '我最想先解决的是：一个讨论结束后，下一次打开还能不能立刻接上。',
            now() - interval '90 minutes',
            now() - interval '90 minutes'
        ),
        (
            'd0b00011-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
            'c0a00006-6666-4666-8666-666666666666',
            target_channel_id,
            null,
            alias_beiqiao_id,
            '我更想先解决「谁该回这条」的判断，不然很多内容最后没人接。 ',
            now() - interval '45 minutes',
            now() - interval '45 minutes'
        )
    on conflict (id) do nothing;

    update public.posts
    set comments_count = comment_stats.comment_count,
        updated_at = greatest(public.posts.updated_at, now() - interval '1 minute')
    from (
        select
            post_id,
            count(*)::integer as comment_count
        from public.comments
        where post_id in (
            'c0a00001-1111-4111-8111-111111111111',
            'c0a00002-2222-4222-8222-222222222222',
            'c0a00003-3333-4333-8333-333333333333',
            'c0a00004-4444-4444-8444-444444444444',
            'c0a00005-5555-4555-8555-555555555555',
            'c0a00006-6666-4666-8666-666666666666'
        )
        group by post_id
    ) as comment_stats
    where public.posts.id = comment_stats.post_id;
end
$$;
