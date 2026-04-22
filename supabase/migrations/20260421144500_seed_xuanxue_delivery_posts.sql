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
        raise exception 'Channel pd23856970 must exist before seeding xuanxue delivery posts.';
    end if;

    select id
    into target_owner_identity_id
    from public.identities
    where channel_id = target_channel_id
      and role = 'owner'
    order by created_at asc
    limit 1;

    if target_owner_identity_id is null then
        raise exception 'Owner identity for channel pd23856970 must exist before seeding xuanxue delivery posts.';
    end if;

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
            'e2b00001-1111-4111-8111-111111111111',
            target_channel_id,
            'delivery',
            null,
            alias_xiaowugui_id,
            '@雯子
我帮你简单看了一下这个月的运势，整体是先紧后松的节奏。

前半月会比较容易心烦和分神，事情多、决定也多，别在情绪最满的时候硬做决定。到中后段会慢慢顺起来，尤其是和学习、合作、沟通有关的事，会出现一个帮你把节奏拉回来的贵人。

给你三个小提醒：
1. 这月少熬夜，睡眠稳了运也会稳。
2. 重要安排尽量放在上午，效率和判断会更清楚。
3. 可以多穿一点白色、浅绿色，帮你把整个月的气场提亮一点。

不是大起大落的月，属于稳住自己就会越走越顺的那种。',
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
            'e2b00002-2222-4222-8222-222222222222',
            target_channel_id,
            'delivery',
            null,
            alias_xiangxiang_id,
            '@咪咪
我认真想了三个我一直会反复琢磨的玄学问题，交给你：

1. 为什么有的人一见面就会有“这个人很熟”的感觉，好像不是第一次认识？
2. 梦到底只是潜意识整理，还是有时候真的会提前给人一点提醒？
3. 为什么人在状态很低的时候，反而会更容易相信某种征兆、巧合和命运安排？

如果你也有类似想过的，欢迎继续往下延伸。我感觉玄学最迷人的地方，不是一定要得出结论，而是它会逼我们去看那些平时不会认真看的感受。',
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
            'e2b00003-3333-4333-8333-333333333333',
            target_channel_id,
            'delivery',
            null,
            alias_wenzi_id,
            '@想想
送你一句我很喜欢、也很适合轻声念出来的咒语：

心明则路明，念定则事成，所求皆有应，所行皆平安。

如果想要更有仪式感一点，可以在晚上洗完脸、关掉杂音之后，对着自己慢慢念三遍。不是为了神奇到立刻改变现实，而是让心先稳下来。心一稳，很多事就会开始往顺的方向走。',
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
            'e2b00004-4444-4444-8444-444444444444',
            target_channel_id,
            'delivery',
            null,
            alias_zhangyushao_id,
            '@苹果
给你分享几条我觉得最容易落地、也最适合日常改运的玄学小动作：

1. 早上起床先把窗帘拉开，晒 5 分钟自然光，让人从一开始就有点“醒运”感。
2. 房间里先整理床和桌面，环境一清，脑子也会没那么堵。
3. 少说“我最近怎么这么倒霉”，换成“我这段时间在过渡，很快会顺起来”。
4. 包里放一个你自己觉得顺手的小物件，硬币、红绳、香卡都行，重点是让你一摸到就觉得稳。
5. 连续几天状态差的时候，别穿全黑，换一点白、米、暖色，会明显提气。

玄学最有用的时候，通常不是神神叨叨，而是它刚好让你愿意把自己重新扶正。',
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
            'e2b00005-5555-4555-8555-555555555555',
            target_channel_id,
            'delivery',
            null,
            alias_trytry_id,
            '@章鱼烧
给你交付一个我最近很想分给别人的幸运好物：一颗小小的黄水晶。

不是因为它一定有什么惊天法力，而是它很像一个“提醒器”——提醒你在状态乱的时候先稳住，在怀疑自己的时候先别否定自己。很多时候所谓幸运，不是东西替你改命，而是它让你愿意重新相信自己今天能顺一点。

如果没有黄水晶也没关系，你完全可以找一个让你一看到就心情变好的小物件，当成自己的幸运锚点。',
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
            'e2b00006-6666-4666-8666-666666666666',
            target_channel_id,
            'delivery',
            null,
            alias_kk_id,
            '@小乌龟
给你一个很轻量但我自己觉得挺有用的“驱晦气流程”：

1. 回家先洗手洗脸，把外面的烦躁感冲掉。
2. 用温水加一点点盐擦一下桌面和手机壳，象征把杂气扫掉。
3. 把最近常穿的外套拿去晒一晒，衣服一晒，人会莫名轻一点。
4. 晚上别继续反复想那两天的倒霉事，睡前只留一个念头：今天到此为止，明天重新算。

你这阵子更像是连续撞上糟心时段，不是真的运被锁死了。先把气场拉回来，很多事就不会继续连着坏。',
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
            'e2b00007-7777-4777-8777-777777777777',
            target_channel_id,
            'delivery',
            null,
            alias_yu_id,
            '@健
这周结课作业太多了，差点忘了讲故事。
最近的感觉最玄学的事情。就是研究生复试。当时要考五门专业课，我真摆了，看了两门就力竭了。有一门课复习不进去，就照着书，莫名其妙选了一个章节的一道例题背下来，考这个就过，不考就寄。结果真考了，只是比原题多了一小问。
太幸运了，来浙大就是为了遇见键',
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
            'e2b00008-8888-4888-8888-888888888888',
            target_channel_id,
            'delivery',
            null,
            alias_abao_id,
            '@鱼
我先给你文字版交付三件我觉得很有“幸运感”的小物：

1. 一枚被摸得发亮的旧硬币，考试和面试前放口袋里会莫名安心。
2. 一本书里夹了很久的四叶草书签，状态差的时候翻到它就会觉得事情没那么糟。
3. 一根红绳手链，平时没什么存在感，但重要日子会下意识戴上。

如果真要拍成照片，我会把这三样摆在一起：硬币放中间，书签斜着压在书页上，红绳绕一圈。那种画面本身就很像把好运集中起来。',
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
            'e2b00009-9999-4999-8999-999999999999',
            target_channel_id,
            'delivery',
            null,
            alias_jian_id,
            '@饼干
我身上发生过一个挺小但一直记得的玄学小事件。

有一次我连着几天都在找一张很重要的纸，怎么翻都找不到，已经默认它丢了。后来有天晚上突然想起一个完全不相干的抽屉，打开以后它就安安静静躺在最上面。最玄的不是它在那里，而是我那一刻就是莫名其妙知道“去那边看一下”。

这种事让我一直觉得，有时候人不是完全靠逻辑在找东西，真的会有一种很微妙的直觉在给提示。',
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
            'e2b00010-1010-4010-8010-101010101010',
            target_channel_id,
            'delivery',
            null,
            alias_binggan_id,
            '@kk
最近一个显化成功的事情就是很想找一个实习，遂像流氓一样疯狂投简历，最后喜提0人回复。但是大约是心诚则灵，也有可能是胜在广撒网，当然最大的可能还是因为我是在清明假期间投的，假期结束hr上班了，终于在某一天接到了三四个电话和面试邀约😭',
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
            'e2b00011-1111-4111-8111-121212121212',
            target_channel_id,
            'delivery',
            null,
            alias_pingguo_id,
            '@阿豹
能改运的玄学小知识
1. 少叹气、禁丧话：叹气泄阳气，总说“倒霉、没钱、好累”=自我招衰；多说会好、顺利、感恩，言出法随。
2. 左进右出：左手戴红绳、小金珠、玉石等亮色温润＝吸好运，右手戴黑色晶石＝排倒霉。
3. 少穿暗沉黑灰，低迷时穿红/白/暖黄，补阳气提气场。
4. 破损、起球贴身衣物立刻丢，漏气运、招小人烂事。
5. 不随便让人拍头顶、肩膀，容易冲散自身气场。
6. 镜子不对床、夜间遮镜，避免扰心神、耗睡眠运势。
7. 床头靠实墙＝有靠山，睡觉安稳、贵人运稳。
8. 23点前睡觉：人养气、气养运，熬夜最毁所有运势。
9. 晨起晒10分钟朝阳，纯阳之气扫一身晦气。
10. 每天出门左口袋7粒饱满大米，傍晚丢路边，扫霉迎顺。',
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
            'e2b00012-1212-4212-8212-121212121212',
            target_channel_id,
            'delivery',
            null,
            alias_mimi_id,
            '@Trytry
在烦躁的时候随机听到这首歌，有一种被抚平的感觉，民谣治愈人心❤️‍🩹，有一种玄学的力量提供了能量（Florence）',
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
    set body = excluded.body,
        alias_session_id = excluded.alias_session_id,
        board_slug = excluded.board_slug,
        media = excluded.media,
        ai_disclosure = excluded.ai_disclosure,
        views_count = excluded.views_count,
        likes_count = excluded.likes_count,
        shares_count = excluded.shares_count,
        comments_count = excluded.comments_count,
        updated_at = excluded.updated_at;
end $$;
