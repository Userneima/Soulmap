import { createAuthActions } from "./auth/index.js";
import { createChannelCreateActions } from "./channel-create/index.js";
import { createComposerActions } from "./composer/index.js";
import { createFeedActions } from "./feed/index.js";
import { createMembershipActions } from "./membership/index.js";
import { createRuntimeActions } from "./runtime/index.js";
import { createShellActions } from "./shell/index.js";
import { getChannelActionErrorMessage, readBlobAsDataUrl } from "../shared/lib/helpers.js";
import { mentionMembers } from "../entities/identity/config.js";

const extractRevealTargetName = (body) => {
    const firstLine = String(body || "").split(/\r?\n/, 1)[0]?.trim() || "";
    if (!firstLine.startsWith("@")) {
        return "";
    }
    return firstLine.slice(1).trim();
};

const buildRevealAvatarMap = (state) => {
    const avatarByName = new Map(
        mentionMembers.map((member) => [String(member.name || "").trim(), String(member.avatar || "").trim()])
    );
    const realName = String(state.runtimeState.realIdentity.name || "").trim();
    if (realName) {
        avatarByName.set(realName, String(state.runtimeState.realIdentity.avatar || "").trim());
    }
    return avatarByName;
};

const buildRevealMapFromDeliveryPosts = (posts, state) => {
    const avatarByName = buildRevealAvatarMap(state);
    const nextRevealMap = {};
    const orderedPosts = [...(posts || [])]
        .filter((post) => post && !post.isDeleted && post.board === "delivery")
        .sort((left, right) => Date.parse(right.createdAt || 0) - Date.parse(left.createdAt || 0));

    orderedPosts.forEach((post) => {
        const memberName = extractRevealTargetName(post.text);
        const angelName = String(post.adminRevealIdentity?.name || "").trim();
        if (!memberName || !angelName || memberName === angelName || nextRevealMap[memberName]) {
            return;
        }

        nextRevealMap[memberName] = {
            member: {
                name: memberName,
                avatar: avatarByName.get(memberName) || ""
            },
            angel: {
                name: angelName,
                avatar: String(post.adminRevealIdentity?.avatar || avatarByName.get(angelName) || "").trim()
            },
            updatedAt: new Date().toISOString()
        };
    });

    return nextRevealMap;
};

export const createAppActions = ({ store, dataService }) => {
    let toastTimer = null;

    const canManageRound = (state) => ["owner", "admin"].includes(state.runtimeState.realIdentity.role);
    const canEditRoundTheme = (state) => canManageRound(state)
        || state.runtimeState.realIdentity.name === state.roundState.godProfile?.name;

    const showToast = ({ tone = "info", message }) => {
        store.dispatch({
            type: "toast/show",
            payload: { tone, message }
        });

        if (toastTimer) {
            window.clearTimeout(toastTimer);
        }

        toastTimer = window.setTimeout(() => {
            store.dispatch({ type: "toast/hide" });
        }, 3200);
    };

    const hideToast = () => {
        if (toastTimer) {
            window.clearTimeout(toastTimer);
            toastTimer = null;
        }
        store.dispatch({ type: "toast/hide" });
    };

    const shellActions = createShellActions({ store });
    const feedActions = createFeedActions({ store, dataService, showToast });
    const runtimeActions = createRuntimeActions({ store, dataService, showToast, feedActions });
    const channelCreateActions = createChannelCreateActions({ store, dataService, showToast });
    const composerActions = createComposerActions({ store, dataService, showToast, feedActions });
    const authActions = createAuthActions({ store, dataService, showToast, runtimeActions });
    const membershipActions = createMembershipActions({ store, dataService, showToast, runtimeActions });

    return {
        ...shellActions,
        ...feedActions,
        ...composerActions,
        ...authActions,
        ...membershipActions,
        ...runtimeActions,
        ...channelCreateActions,
        openOverlay(name, payload = {}) {
            if (name === "comments" && payload.postId) {
                this.openComments(payload.postId, payload.source || "comments");
                return;
            }
            if (name === "channel-menu") {
                this.openChannelMenu(payload);
                return;
            }
            if (name === "notification-center") {
                this.openNotificationCenter(payload.tab || "interaction", payload);
                return;
            }
            if (name === "member-list") {
                this.openMemberList();
                return;
            }
            if (name === "channel-intelligence") {
                this.openChannelIntelligence();
                return;
            }
            if (name === "image-lightbox" && payload.image) {
                store.dispatch({
                    type: "image-lightbox/open",
                    payload: {
                        image: payload.image,
                        source: payload.source || ""
                    }
                });
                return;
            }
            if (name === "identity") {
                this.openIdentityDialog();
                return;
            }
            if (name === "channel-settings") {
                this.openChannelSettings();
                return;
            }
            if (name === "auth-gate") {
                this.openAuthGate(payload.mode || "login");
            }
        },
        closeOverlay(name) {
            if (name === "comments") {
                this.closeComments();
                return;
            }
            if (name === "channel-menu") {
                this.closeChannelMenu();
                return;
            }
            if (name === "notification-center") {
                this.closeNotificationCenter();
                return;
            }
            if (name === "member-list") {
                this.closeMemberList();
                return;
            }
            if (name === "channel-intelligence") {
                this.closeChannelIntelligence();
                return;
            }
            if (name === "image-lightbox") {
                this.closeImageLightbox();
                return;
            }
            if (name === "identity") {
                this.closeIdentityDialog();
                return;
            }
            if (name === "channel-settings") {
                this.closeChannelSettings();
                return;
            }
            if (name === "auth-gate") {
                this.closeAuthGate();
            }
        },
        showToast,
        hideToast,
        openChannelIntelligence() {
            store.dispatch({ type: "channel-intelligence/open" });
        },
        closeChannelIntelligence() {
            store.dispatch({ type: "channel-intelligence/close" });
        },
        openMemberList() {
            store.dispatch({ type: "member-list/open" });
        },
        closeMemberList() {
            store.dispatch({ type: "member-list/close" });
        },
        toggleRoundGodPicker() {
            const current = store.getState().overlayState.channelIntelligence.godPickerOpen;
            store.dispatch({
                type: "channel-intelligence/set-field",
                payload: {
                    godPickerOpen: !current,
                    themeEditorOpen: false
                }
            });
        },
        async assignRoundGod(godProfile) {
            const state = store.getState();
            if (!canManageRound(state)) {
                showToast({
                    tone: "info",
                    message: "只有频道管理员才能指定本周上帝。"
                });
                return;
            }

            try {
                const nextChannel = await dataService.updateChannelRoundState({ godProfile });
                store.dispatch({
                    type: "runtime/update-channel",
                    payload: { channel: nextChannel }
                });
                store.dispatch({
                    type: "channel-intelligence/set-field",
                    payload: {
                        godPickerOpen: false,
                        themeEditorOpen: false
                    }
                });
                showToast({
                    tone: "success",
                    message: "本周上帝已更新。"
                });
            } catch (error) {
                showToast({
                    tone: "error",
                    message: getChannelActionErrorMessage("update_round_state", error)
                });
            }
        },
        toggleRoundThemeEditor() {
            const state = store.getState();
            const current = state.overlayState.channelIntelligence.themeEditorOpen;
            store.dispatch({
                type: "channel-intelligence/set-field",
                payload: {
                    godPickerOpen: false,
                    themeEditorOpen: !current,
                    draftTheme: state.roundState.theme || ""
                }
            });
        },
        cancelRoundThemeEditing() {
            store.dispatch({
                type: "channel-intelligence/set-field",
                payload: {
                    themeEditorOpen: false,
                    draftTheme: store.getState().roundState.theme || ""
                }
            });
        },
        setRoundThemeDraft(value) {
            store.dispatch({
                type: "channel-intelligence/set-field",
                payload: { draftTheme: value }
            });
        },
        toggleRoundRevealEditor() {
            const state = store.getState();
            const current = state.overlayState.channelIntelligence.revealEditorOpen;
            store.dispatch({
                type: "channel-intelligence/set-field",
                payload: {
                    godPickerOpen: false,
                    themeEditorOpen: false,
                    revealEditorOpen: !current,
                    revealMemberPickerOpen: false,
                    revealAngelPickerOpen: false,
                    draftRevealMember: current ? null : state.overlayState.channelIntelligence.draftRevealMember,
                    draftRevealAngel: current ? null : state.overlayState.channelIntelligence.draftRevealAngel
                }
            });
        },
        toggleRoundRevealMemberPicker() {
            const current = store.getState().overlayState.channelIntelligence.revealMemberPickerOpen;
            store.dispatch({
                type: "channel-intelligence/set-field",
                payload: {
                    revealMemberPickerOpen: !current,
                    revealAngelPickerOpen: false
                }
            });
        },
        toggleRoundRevealAngelPicker() {
            const current = store.getState().overlayState.channelIntelligence.revealAngelPickerOpen;
            store.dispatch({
                type: "channel-intelligence/set-field",
                payload: {
                    revealAngelPickerOpen: !current,
                    revealMemberPickerOpen: false
                }
            });
        },
        chooseRoundRevealMember(member) {
            store.dispatch({
                type: "channel-intelligence/set-field",
                payload: {
                    draftRevealMember: member ? { ...member } : null,
                    revealMemberPickerOpen: false
                }
            });
        },
        chooseRoundRevealAngel(member) {
            store.dispatch({
                type: "channel-intelligence/set-field",
                payload: {
                    draftRevealAngel: member ? { ...member } : null,
                    revealAngelPickerOpen: false
                }
            });
        },
        async saveRoundRevealPair() {
            const state = store.getState();
            if (!canManageRound(state)) {
                showToast({
                    tone: "info",
                    message: "只有频道管理员才能配置揭晓结果。"
                });
                return;
            }

            const draftMember = state.overlayState.channelIntelligence.draftRevealMember;
            const draftAngel = state.overlayState.channelIntelligence.draftRevealAngel;
            if (!draftMember?.name || !draftAngel?.name) {
                showToast({
                    tone: "info",
                    message: "先选要揭晓的成员，再选他对应的天使。"
                });
                return;
            }

            if (draftMember.name === draftAngel.name) {
                showToast({
                    tone: "info",
                    message: "揭晓对象和天使不能是同一个人。"
                });
                return;
            }

            const nextRevealMap = {
                ...(state.roundState.revealMap || {}),
                [draftMember.name]: {
                    member: {
                        name: draftMember.name,
                        avatar: draftMember.avatar || ""
                    },
                    angel: {
                        name: draftAngel.name,
                        avatar: draftAngel.avatar || ""
                    },
                    updatedAt: new Date().toISOString()
                }
            };

            try {
                const nextChannel = await dataService.updateChannelRoundState({
                    revealMap: nextRevealMap
                });
                store.dispatch({
                    type: "runtime/update-channel",
                    payload: { channel: nextChannel }
                });
                store.dispatch({
                    type: "channel-intelligence/set-field",
                    payload: {
                        revealEditorOpen: false,
                        revealMemberPickerOpen: false,
                        revealAngelPickerOpen: false,
                        draftRevealMember: null,
                        draftRevealAngel: null
                    }
                });
                showToast({
                    tone: "success",
                    message: "揭晓配对已保存。"
                });
            } catch (error) {
                showToast({
                    tone: "error",
                    message: getChannelActionErrorMessage("update_round_state", error)
                });
            }
        },
        async generateRoundRevealResults() {
            const state = store.getState();
            if (!canManageRound(state)) {
                showToast({
                    tone: "info",
                    message: "只有频道管理员才能生成揭晓结果。"
                });
                return;
            }

            try {
                const deliveryPosts = await dataService.listPosts("delivery");
                const nextRevealMap = buildRevealMapFromDeliveryPosts(deliveryPosts, state);
                const pairCount = Object.keys(nextRevealMap).length;

                if (!pairCount) {
                    showToast({
                        tone: "info",
                        message: "还没有足够的交付数据可用于生成揭晓结果。"
                    });
                    return;
                }

                const nextChannel = await dataService.updateChannelRoundState({
                    revealMap: nextRevealMap
                });
                store.dispatch({
                    type: "runtime/update-channel",
                    payload: { channel: nextChannel }
                });
                store.dispatch({
                    type: "channel-intelligence/set-field",
                    payload: {
                        revealEditorOpen: false,
                        revealMemberPickerOpen: false,
                        revealAngelPickerOpen: false,
                        draftRevealMember: null,
                        draftRevealAngel: null
                    }
                });
                showToast({
                    tone: "success",
                    message: `已根据交付内容生成 ${pairCount} 对揭晓结果。`
                });
            } catch (error) {
                showToast({
                    tone: "error",
                    message: getChannelActionErrorMessage("update_round_state", error)
                });
            }
        },
        async saveRoundTheme() {
            const state = store.getState();
            if (!canEditRoundTheme(state)) {
                showToast({
                    tone: "info",
                    message: "只有本周上帝或频道管理员才能设定主题。"
                });
                return;
            }

            const draftTheme = state.overlayState.channelIntelligence.draftTheme.trim();
            if (!draftTheme) {
                showToast({
                    tone: "info",
                    message: "先输入本周主题。"
                });
                return;
            }

            try {
                const nextChannel = await dataService.updateChannelRoundState({ theme: draftTheme });
                store.dispatch({
                    type: "runtime/update-channel",
                    payload: { channel: nextChannel }
                });
                store.dispatch({
                    type: "channel-intelligence/set-field",
                    payload: { themeEditorOpen: false }
                });
                showToast({
                    tone: "success",
                    message: "本周主题已更新。"
                });
            } catch (error) {
                showToast({
                    tone: "error",
                    message: getChannelActionErrorMessage("update_round_state", error)
                });
            }
        },
        openChannelSettings() {
            const role = store.getState().runtimeState.realIdentity.role;
            if (!["owner", "admin"].includes(role)) {
                showToast({
                    tone: "info",
                    message: "只有频道管理员才能编辑频道资料。"
                });
                return;
            }

            store.dispatch({ type: "channel-settings/open" });
        },
        closeChannelSettings() {
            store.dispatch({ type: "channel-settings/close" });
        },
        setChannelSettingsDraft(partial) {
            store.dispatch({
                type: "channel-settings/set-field",
                payload: partial
            });
        },
        async setChannelLogo(file) {
            if (!file) {
                return;
            }

            try {
                const draftLogo = await readBlobAsDataUrl(file);
                this.setChannelSettingsDraft({ draftLogo });
            } catch (error) {
                showToast({
                    tone: "error",
                    message: getChannelActionErrorMessage("read_avatar", error)
                });
            }
        },
        async setChannelBackground(file) {
            if (!file) {
                return;
            }

            try {
                const draftBackground = await readBlobAsDataUrl(file);
                this.setChannelSettingsDraft({ draftBackground });
            } catch (error) {
                showToast({
                    tone: "error",
                    message: getChannelActionErrorMessage("read_media", error)
                });
            }
        },
        async saveChannelSettings() {
            const state = store.getState();
            const draftName = state.overlayState.channelSettings.draftName.trim();
            if (!draftName) {
                return;
            }

            store.dispatch({ type: "channel-settings/save-start" });

            try {
                const nextChannel = await dataService.updateChannel({
                    name: draftName,
                    logoUrl: state.overlayState.channelSettings.draftLogo,
                    backgroundUrl: state.overlayState.channelSettings.draftBackground
                });
                store.dispatch({
                    type: "runtime/update-channel",
                    payload: { channel: nextChannel }
                });
                store.dispatch({ type: "channel-settings/save-finish" });
                showToast({
                    tone: "success",
                    message: "频道资料已更新。"
                });
            } catch (error) {
                store.dispatch({
                    type: "channel-settings/save-error",
                    payload: { error }
                });
                showToast({
                    tone: "error",
                    message: getChannelActionErrorMessage("update_channel", error)
                });
            }
        },
        getDeleteConfirmState() {
            return store.getState().overlayState.deleteConfirm;
        }
    };
};
