import { channelBoardChoices } from "../../entities/channel/config.js";
import { composerIdentityPresets } from "../../entities/identity/config.js";
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

export const selectComposerPanelVM = (state) => {
    const activeAlias = state.runtimeState.anonymousProfiles.find((profile) => profile.key === state.runtimeState.activeAliasKey)
        || state.runtimeState.anonymousProfiles[0];
    const anonymousMode = state.composerState.anonymousMode;
    const draftText = state.composerState.draftText;
    const images = state.composerState.images;
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

    return {
        capabilities: composerCapabilityRegistry,
        canCompose,
        gate: canCompose ? null : gateByState,
        draftText,
        images,
        charCount: draftText.length,
        aiDisclosure: state.composerState.aiDisclosure,
        aiDisclosureChoices,
        boardChoices: channelBoardChoices,
        selectedBoard: state.composerState.board,
        anonymousMode,
        autoRotate: state.composerState.autoRotate,
        aiDisclosureOpen: state.composerState.aiDisclosureOpen,
        submitStatus: state.composerState.submitStatus,
        submitLabel: state.composerState.submitStatus === "submitting"
            ? "发表中"
            : anonymousMode ? "匿名发表" : "发表",
        canSubmit: Boolean(draftText.trim() || images.length) && state.composerState.submitStatus !== "submitting",
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
        placeholder: anonymousMode ? composerIdentityPresets.anonymousPlaceholder : composerIdentityPresets.defaultPlaceholder
    };
};
