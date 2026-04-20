import {
    anonymizeComposerText,
    cloneComposerImageForPost,
    createImageDraftFromFile,
    getChannelActionErrorMessage,
    processAnonymousImageForPost,
    readBlobAsDataUrl,
    revokeImageDrafts
} from "../../shared/lib/helpers.js";

const ensureApprovedMember = (store, onGuest, onUnapproved) => {
    const state = store.getState();
    const authStatus = state.authState.status;
    const membershipStatus = state.membershipState.status;

    if (authStatus === "guest") {
        onGuest?.();
        return false;
    }

    if (authStatus === "upgrading_legacy_anonymous") {
        onGuest?.("upgrade");
        return false;
    }

    if (membershipStatus !== "approved") {
        onUnapproved?.(membershipStatus);
        return false;
    }

    return true;
};

export const createComposerActions = ({ store, dataService, showToast, feedActions }) => ({
    setComposerField(partial) {
        store.dispatch({
            type: "composer/set-field",
            payload: partial
        });
    },
    toggleAiDisclosureMenu() {
        const { anonymousMode, aiDisclosureOpen } = store.getState().composerState;
        if (anonymousMode) {
            return;
        }
        store.dispatch({
            type: "composer/set-field",
            payload: {
                aiDisclosureOpen: !aiDisclosureOpen
            }
        });
    },
    selectAiDisclosure(value) {
        store.dispatch({
            type: "composer/set-field",
            payload: {
                aiDisclosure: value,
                aiDisclosureOpen: false
            }
        });
    },
    closeAiDisclosureMenu() {
        if (!store.getState().composerState.aiDisclosureOpen) {
            return;
        }
        store.dispatch({
            type: "composer/set-field",
            payload: {
                aiDisclosureOpen: false
            }
        });
    },
    toggleAnonymousMode() {
        if (!ensureApprovedMember(
            store,
            (mode) => {
                store.dispatch({
                    type: "auth-gate/open",
                    payload: { mode: mode === "upgrade" ? "upgrade" : "login" }
                });
            },
            () => {
                showToast({
                    tone: "info",
                    message: "先通过频道审核，才能使用匿名发言。"
                });
            }
        )) {
            return;
        }
        store.dispatch({ type: "composer/toggle-anonymous" });
    },
    rotateAliasProfile() {
        if (!ensureApprovedMember(
            store,
            (mode) => {
                store.dispatch({
                    type: "auth-gate/open",
                    payload: { mode: mode === "upgrade" ? "upgrade" : "login" }
                });
            },
            () => {
                showToast({
                    tone: "info",
                    message: "先通过频道审核，才能切换匿名马甲。"
                });
            }
        )) {
            return;
        }
        const { anonymousProfiles, activeAliasKey } = store.getState().runtimeState;
        if (!anonymousProfiles.length) {
            return;
        }
        const currentIndex = anonymousProfiles.findIndex((profile) => profile.key === activeAliasKey);
        const nextProfile = anonymousProfiles[(currentIndex + 1 + anonymousProfiles.length) % anonymousProfiles.length];
        store.dispatch({
            type: "runtime/set-alias-key",
            payload: { key: nextProfile.key }
        });
    },
    async addComposerImages(fileList) {
        const files = Array.from(fileList || []).filter((file) => file.type.startsWith("image/"));
        if (!files.length) {
            return;
        }

        const state = store.getState();
        let nextImageId = state.composerState.nextImageId;
        const images = files.map((file) => {
            const image = createImageDraftFromFile(file, nextImageId);
            nextImageId += 1;
            return image;
        });

        store.dispatch({
            type: "composer/add-images",
            payload: {
                images,
                nextImageId
            }
        });
    },
    removeComposerImage(id) {
        const image = store.getState().composerState.images.find((item) => item.id === id);
        if (image) {
            revokeImageDrafts([image]);
        }
        store.dispatch({
            type: "composer/remove-image",
            payload: { id }
        });
    },
    async submitPost() {
        if (!ensureApprovedMember(
            store,
            (mode) => {
                store.dispatch({
                    type: "auth-gate/open",
                    payload: { mode: mode === "upgrade" ? "upgrade" : "login" }
                });
            },
            () => {
                showToast({
                    tone: "info",
                    message: "当前还没有发帖权限，请先申请加入频道。"
                });
            }
        )) {
            return;
        }

        const state = store.getState();
        const rawText = state.composerState.draftText.trim();
        const images = state.composerState.images;
        if (!rawText && !images.length) {
            return;
        }

        store.dispatch({ type: "composer/submit-start" });

        try {
            const anonymousMode = state.composerState.anonymousMode;
            const publishedImages = await Promise.all(images.map((image) => (
                anonymousMode ? processAnonymousImageForPost(image) : cloneComposerImageForPost(image)
            )));

            const publishedText = anonymousMode ? anonymizeComposerText(rawText) : rawText;
            const activeAliasKey = state.runtimeState.activeAliasKey;
            const post = await dataService.publishPost({
                body: publishedText || "分享一张图片",
                images: publishedImages,
                boardSlug: state.composerState.board === "none" ? null : state.composerState.board,
                aiDisclosure: anonymousMode ? "none" : state.composerState.aiDisclosure,
                author: anonymousMode
                    ? { type: "alias_session", key: activeAliasKey }
                    : { type: "identity" }
            });

            revokeImageDrafts(images);
            store.dispatch({ type: "composer/reset" });
            if (anonymousMode && state.composerState.autoRotate) {
                this.rotateAliasProfile();
            }

            const targetBoard = post.board === "none" ? "all" : post.board;
            await feedActions.loadFeed(targetBoard);
            showToast({
                tone: "success",
                message: anonymousMode ? "匿名帖子已发送。" : "帖子已发送。"
            });
        } catch (error) {
            store.dispatch({
                type: "composer/submit-error",
                payload: { error }
            });
            showToast({
                tone: "error",
                message: getChannelActionErrorMessage("publish_post", error)
            });
        }
    },
    openIdentityDialog() {
        if (!ensureApprovedMember(
            store,
            (mode) => {
                store.dispatch({
                    type: "auth-gate/open",
                    payload: { mode: mode === "upgrade" ? "upgrade" : "login" }
                });
            },
            () => {
                showToast({
                    tone: "info",
                    message: "只有已加入频道的成员才能编辑频道身份。"
                });
            }
        )) {
            return;
        }
        store.dispatch({ type: "identity/open" });
    },
    closeIdentityDialog() {
        store.dispatch({ type: "identity/close" });
    },
    setIdentityDraft(partial) {
        store.dispatch({
            type: "identity/set-field",
            payload: partial
        });
    },
    async setIdentityAvatar(file) {
        if (!file) {
            return;
        }

        try {
            const draftAvatar = await readBlobAsDataUrl(file);
            this.setIdentityDraft({ draftAvatar });
        } catch (error) {
            showToast({
                tone: "error",
                message: getChannelActionErrorMessage("read_avatar", error)
            });
        }
    },
    async saveIdentity() {
        const state = store.getState();
        const draftName = state.overlayState.identity.draftName.trim();
        if (!draftName) {
            return;
        }

        store.dispatch({ type: "identity/save-start" });

        try {
            const nextIdentity = await dataService.updateIdentity({
                displayName: draftName,
                avatarUrl: state.overlayState.identity.draftAvatar,
                meta: state.runtimeState.realIdentity.meta
            });
            store.dispatch({
                type: "runtime/update-identity",
                payload: { identity: nextIdentity }
            });
            store.dispatch({ type: "identity/save-finish" });
            showToast({
                tone: "success",
                message: "频道身份已更新。"
            });
        } catch (error) {
            store.dispatch({
                type: "identity/save-error",
                payload: { error }
            });
            showToast({
                tone: "error",
                message: getChannelActionErrorMessage("update_identity", error)
            });
        }
    }
});
