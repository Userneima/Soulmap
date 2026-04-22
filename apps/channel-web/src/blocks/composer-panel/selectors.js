import { channelBoardChoices, gameBoardStages } from "../../entities/channel/config.js";
import { composerIdentityPresets, mentionMembers } from "../../entities/identity/config.js";
import { composerCapabilityRegistry } from "../../features/composer/registry.js";

const aiDisclosureChoices = [
    {
        value: "none",
        label: "不声明"
    },
    {
        value: "ai-generated",
        label: "包含 AI 生成内容"
    }
];

const stageByValue = new Map(gameBoardStages.map((stage) => [stage.value, stage]));

export const selectComposerPanelVM = (state) => {
    const stage = stageByValue.get(state.roundState.activeStage) || gameBoardStages[0];
    const activeAlias = state.runtimeState.anonymousProfiles.find((profile) => profile.key === state.runtimeState.activeAliasKey)
        || state.runtimeState.anonymousProfiles[0];
    const claimSelection = state.roundState.claimSelection;
    const guessSelection = state.roundState.guessSelection;
    const effectiveMentionTarget = stage.requiresMention
        ? (
            state.composerState.mentionTarget
            || (stage.value === "delivery" && claimSelection
                ? {
                    name: claimSelection.authorName,
                    avatar: claimSelection.authorAvatar || ""
                }
                : null)
            || (stage.value === "guess" && guessSelection
                ? {
                    name: guessSelection.name,
                    avatar: guessSelection.avatar || ""
                }
                : null)
        )
        : null;
    const anonymousMode = stage.forceAnonymous ? true : state.composerState.anonymousMode;
    const expanded = state.composerState.expanded;
    const draftText = state.composerState.draftText;
    const images = state.composerState.images;
    const audioDraft = state.composerState.audioDraft;
    const audioRecording = state.composerState.audioRecording;
    const authStatus = state.authState.status;
    const membershipStatus = state.membershipState.status;
    const canCompose = membershipStatus === "approved" && authStatus === "authenticated";
    const gateByState = authStatus === "guest"
        ? {
            accessMode: "guest",
            title: "登录后才能发帖",
            description: "现在可以先公开浏览，登录后再申请加入频道。",
            placeholder: "登录后可申请加入频道，当前无法发内容",
            primaryLabel: "邮箱登录",
            primaryAction: "open-auth-login"
        }
        : membershipStatus === "pending"
                ? {
                    accessMode: "pending",
                    title: "发帖权限等待审核",
                    description: "管理员通过你的加入申请后，这里会自动恢复可编辑状态。",
                    placeholder: "频道申请审核中，当前无法发内容",
                    primaryLabel: "等待审核中",
                    primaryAction: "noop"
                }
                : {
                    accessMode: "unapproved",
                    title: "先申请加入频道",
                    description: membershipStatus === "rejected"
                        ? "上次申请没有通过。你可以在上方补充申请说明后重新提交。"
                        : "只有通过频道审核的成员，才能发帖、评论和使用匿名马甲。",
                    placeholder: membershipStatus === "rejected"
                        ? "申请未通过，当前无法发内容"
                        : "未加入频道，当前无法发内容",
                    primaryLabel: membershipStatus === "rejected" ? "重新申请" : "提交加入申请",
                    primaryAction: "submit-join-request"
                };
    const availableMentionMembers = stage.value === "guess"
        ? mentionMembers.filter((member) => member.name !== state.runtimeState.realIdentity.name)
        : mentionMembers;
    const revealEntry = state.roundState.revealMap?.[state.runtimeState.realIdentity.name] || null;
    const revealResult = revealEntry?.angel
        ? {
            guessedName: guessSelection?.name || "",
            guessedAvatar: guessSelection?.avatar || "",
            actualName: revealEntry.angel.name,
            actualAvatar: revealEntry.angel.avatar || "",
            isCorrect: Boolean(guessSelection?.name) && guessSelection.name === revealEntry.angel.name
        }
        : null;

    return {
        capabilities: composerCapabilityRegistry,
        canCompose,
        stageAllowsPosting: stage.canCompose,
        hideInlineComposer: stage.value === "guess",
        stageInfo: stage,
        expanded,
        gate: canCompose ? null : gateByState,
        draftText,
        images,
        audioDraft,
        audioRecording,
        mentionTarget: effectiveMentionTarget,
        mentionOpen: stage.requiresMention ? state.composerState.mentionOpen : false,
        mentionMembers: availableMentionMembers,
        mentionTitle: stage.value === "guess" ? "你猜的是谁" : "实现谁的愿望",
        charCount: draftText.length,
        aiDisclosure: state.composerState.aiDisclosure,
        aiDisclosureChoices,
        boardChoices: channelBoardChoices,
        selectedBoard: stage.value,
        anonymousMode,
        anonymousLocked: stage.forceAnonymous,
        autoRotate: state.composerState.autoRotate,
        aiImageReshape: state.composerState.aiImageReshape,
        aiDisclosureOpen: stage.forceAnonymous ? false : state.composerState.aiDisclosureOpen,
        submitStatus: state.composerState.submitStatus,
        submitLabel: state.composerState.submitStatus === "submitting"
            ? "提交中"
            : stage.submitLabel,
        canSubmit: stage.canCompose
            && Boolean(draftText.trim() || images.length || audioDraft)
            && (stage.value !== "delivery" || Boolean(claimSelection?.postId))
            && (!stage.requiresMention || Boolean(effectiveMentionTarget))
            && !audioRecording
            && state.composerState.submitStatus !== "submitting",
        identityDisplay: anonymousMode
            ? {
                avatar: activeAlias?.avatar || "",
                name: activeAlias?.name || "匿名用户",
                meta: "系统生成马甲 · 真实身份仅自己可见"
            }
            : {
                avatar: state.runtimeState.realIdentity.avatar,
                name: state.runtimeState.realIdentity.name,
                meta: state.runtimeState.realIdentity.meta
            },
        placeholder: stage.placeholder || (anonymousMode ? composerIdentityPresets.anonymousPlaceholder : composerIdentityPresets.defaultPlaceholder),
        collapsedSummary: draftText.trim()
            ? draftText.trim().slice(0, 72)
            : images.length
                ? `已添加 ${images.length} 张图片`
                : audioDraft
                    ? "已录 1 条语音"
                : stage.taskLabel || (anonymousMode
                    ? "以匿名身份发布想法"
                    : "分享频道里的新动态"),
        hasDraft: Boolean(draftText.trim() || images.length || audioDraft),
        activeAlias,
        claimSelection,
        guessSelection,
        revealResult,
        isClaimStage: stage.value === "claim",
        isDeliveryStage: stage.value === "delivery",
        isGuessStage: stage.value === "guess",
        isRevealStage: stage.value === "reveal"
    };
};
