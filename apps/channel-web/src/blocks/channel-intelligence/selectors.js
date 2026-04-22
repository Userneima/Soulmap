import { gameBoardStages } from "../../entities/channel/config.js";
import { mentionMembers } from "../../entities/identity/config.js";
import { buildWeeklyDigest } from "../../shared/lib/channel-intelligence.js";

const stageByValue = new Map(gameBoardStages.map((stage) => [stage.value, stage]));

const buildRoundMemberOptions = (state) => {
    const memberMap = new Map();
    const addMember = (member) => {
        const name = String(member?.name || member?.authorName || "").trim();
        if (!name || memberMap.has(name)) {
            return;
        }

        memberMap.set(name, {
            name,
            avatar: String(member?.avatar || member?.authorAvatar || "").trim()
        });
    };

    addMember({
        name: state.runtimeState.realIdentity.name,
        avatar: state.runtimeState.realIdentity.avatar
    });
    mentionMembers.forEach(addMember);
    (state.feedState.items || []).forEach((post) => {
        if (!post?.isAnonymous) {
            addMember({
                name: post.authorName,
                avatar: post.authorAvatar
            });
        }
        (post.comments || []).forEach((comment) => {
            if (!comment?.isAnonymous) {
                addMember({
                    name: comment.authorName,
                    avatar: comment.authorAvatar
                });
            }
        });
    });

    Object.values(state.roundState.revealMap || {}).forEach((entry) => {
        addMember(entry?.member);
        addMember(entry?.angel);
    });

    return [...memberMap.values()];
};

const buildRevealPairs = (revealMap) => Object.values(revealMap || {})
    .filter((entry) => entry?.member?.name && entry?.angel?.name)
    .sort((left, right) => left.member.name.localeCompare(right.member.name, "zh-Hans-CN"));

const hasAuthoredBoardPost = (state, boardValue) => {
    const currentUserId = state.authState.user?.id || null;
    if (!currentUserId) {
        return false;
    }

    return (state.feedState.items || []).some((post) => (
        !post?.isDeleted
        && post.board === boardValue
        && post.authorUserId === currentUserId
    ));
};

export const selectChannelIntelligenceVM = (state) => {
    const digest = buildWeeklyDigest(state.feedState.items || []);
    const currentStage = stageByValue.get(state.roundState.activeStage) || gameBoardStages[0];
    const progress = state.roundState.progress || {};
    const godProfile = state.roundState.godProfile;
    const currentTheme = String(state.roundState.theme || "").trim();
    const role = state.runtimeState.realIdentity.role;
    const canManageRound = ["owner", "admin"].includes(role);
    const canEditTheme = canManageRound || state.runtimeState.realIdentity.name === godProfile?.name;
    const godOptions = buildRoundMemberOptions(state);
    const revealPairs = buildRevealPairs(state.roundState.revealMap);
    const revealResult = state.roundState.revealMap?.[state.runtimeState.realIdentity.name] || null;
    const currentGuess = state.roundState.guessSelection;
    const wishSubmitted = progress.wishSubmitted || hasAuthoredBoardPost(state, "wish");
    const deliverySubmitted = progress.deliverySubmitted || hasAuthoredBoardPost(state, "delivery");
    const guessSubmitted = progress.guessSubmitted || Boolean(currentGuess?.name);
    const currentStageDone = currentStage.value === "wish"
        ? wishSubmitted
        : currentStage.value === "claim"
            ? progress.claimSelected
            : currentStage.value === "delivery"
                ? deliverySubmitted
                : currentStage.value === "guess"
                    ? guessSubmitted
                    : Boolean((state.roundState.revealMap || {})[state.runtimeState.realIdentity.name]);

    return {
        open: state.overlayState.channelIntelligence.open,
        godPickerOpen: state.overlayState.channelIntelligence.godPickerOpen,
        themeEditorOpen: state.overlayState.channelIntelligence.themeEditorOpen,
        revealEditorOpen: state.overlayState.channelIntelligence.revealEditorOpen,
        revealMemberPickerOpen: state.overlayState.channelIntelligence.revealMemberPickerOpen,
        revealAngelPickerOpen: state.overlayState.channelIntelligence.revealAngelPickerOpen,
        draftRevealMember: state.overlayState.channelIntelligence.draftRevealMember,
        draftRevealAngel: state.overlayState.channelIntelligence.draftRevealAngel,
        draftTheme: state.overlayState.channelIntelligence.draftTheme || currentTheme,
        status: digest.status,
        title: "频道周报",
        subtitle: "最近 7 天",
        metricsLine: digest.status === "ready"
            ? `${digest.totalPosts} 条帖子 · ${digest.totalComments} 条评论`
            : "本周还没有足够内容生成周报",
        godProfile,
        godOptions,
        revealMemberOptions: godOptions,
        revealAngelOptions: godOptions,
        revealPairs,
        revealResult: revealResult?.angel
            ? {
                guessedName: currentGuess?.name || "",
                actualName: revealResult.angel.name,
                actualAvatar: revealResult.angel.avatar || "",
                isCorrect: Boolean(currentGuess?.name) && currentGuess.name === revealResult.angel.name
            }
            : null,
        currentTheme: currentTheme || "待本周上帝发布主题",
        hasTheme: Boolean(currentTheme),
        canManageRound,
        canEditTheme,
        currentStageLabel: currentStage.label,
        currentTaskLabel: currentStage.taskLabel,
        currentDeadlineLabel: currentStage.deadlineLabel,
        currentTaskStatus: currentStageDone ? "已完成" : (currentStage.canCompose ? "待完成" : "待开放"),
        currentTaskHint: currentStage.value === "reveal"
            ? (
                revealResult?.angel
                    ? `你猜的是 ${currentGuess?.name || "未提交猜测"}，实际天使是 ${revealResult.angel.name}。`
                    : "管理员一键生成揭晓结果后，这里会直接显示你的结果。"
            )
            : currentStage.canCompose
                ? currentStage.helperText
                : "这个阶段先不发帖，等后续对应能力补上。",
        compactHint: digest.status === "ready"
            ? "点击查看本周高频议题、代表帖子和未解决问题"
            : "当前先保留一个轻量入口，等内容积累后再展开查看",
        topThemes: digest.topThemes,
        representativePosts: digest.representativePosts,
        openQuestions: digest.openQuestions
    };
};
