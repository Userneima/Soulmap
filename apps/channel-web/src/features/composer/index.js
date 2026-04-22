import {
    anonymizeComposerText,
    cloneComposerAudioForPost,
    cloneComposerImageForPost,
    createImageDraftFromFile,
    generateAnonymousPersona,
    getChannelActionErrorMessage,
    processAnonymousImageForPost,
    readBlobAsDataUrl,
    revokeComposerAudioDraft,
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
    expandComposer() {
        store.dispatch({ type: "composer/expand" });
    },
    collapseComposer() {
        store.dispatch({ type: "composer/collapse" });
    },
    setComposerField(partial) {
        store.dispatch({
            type: "composer/set-field",
            payload: partial
        });
    },
    toggleMentionMenu() {
        const { mentionOpen } = store.getState().composerState;
        store.dispatch({
            type: "composer/set-field",
            payload: {
                mentionOpen: !mentionOpen
            }
        });
    },
    closeMentionMenu() {
        if (!store.getState().composerState.mentionOpen) {
            return;
        }
        store.dispatch({
            type: "composer/set-field",
            payload: {
                mentionOpen: false
            }
        });
    },
    selectMentionTarget(member) {
        const state = store.getState();
        if (state.roundState.activeStage === "guess" && member?.name && state.roundState.guessExcludedNames?.includes(member.name)) {
            store.dispatch({
                type: "round/toggle-guess-exclusion",
                payload: { name: member.name }
            });
        }
        store.dispatch({
            type: "composer/set-field",
            payload: {
                mentionTarget: member ? {
                    name: member.name,
                    avatar: member.avatar || ""
                } : null,
                mentionOpen: false
            }
        });
    },
    setGuessDraftText(value) {
        if (store.getState().roundState.activeStage !== "guess") {
            return;
        }
        store.dispatch({
            type: "composer/set-field",
            payload: {
                draftText: String(value || "")
            }
        });
    },
    toggleGuessExcludedMember(name) {
        const normalizedName = String(name || "").trim();
        if (!normalizedName || store.getState().roundState.activeStage !== "guess") {
            return;
        }
        store.dispatch({
            type: "round/toggle-guess-exclusion",
            payload: { name: normalizedName }
        });
    },
    async submitGuessStage() {
        if (store.getState().roundState.activeStage !== "guess") {
            return;
        }
        await this.submitPost();
    },
    clearMentionTarget() {
        store.dispatch({
            type: "composer/set-field",
            payload: {
                mentionTarget: null,
                mentionOpen: false
            }
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
        store.dispatch({ type: "composer/expand" });
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
    async regenerateAliasProfile() {
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
                    message: "先通过频道审核，才能生成匿名马甲。"
                });
            }
        )) {
            return;
        }

        const { activeAliasKey } = store.getState().runtimeState;
        if (!activeAliasKey) {
            return;
        }

        try {
            const nextProfile = generateAnonymousPersona(`${activeAliasKey}-${Date.now()}`);
            const nextAliasState = await dataService.createAliasProfile(activeAliasKey, nextProfile);
            store.dispatch({
                type: "runtime/set-alias-profiles",
                payload: { profiles: nextAliasState.profiles }
            });
            store.dispatch({
                type: "runtime/set-alias-key",
                payload: { key: nextAliasState.activeAliasKey }
            });
            showToast({
                tone: "success",
                message: "新马甲已生成。"
            });
        } catch (error) {
            showToast({
                tone: "error",
                message: getChannelActionErrorMessage("update_identity", error)
            });
        }
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
        const activeStage = state.roundState.activeStage;
        const rawText = state.composerState.draftText.trim();
        const images = state.composerState.images;
        const audioDraft = state.composerState.audioDraft;
        if (activeStage !== "guess" && !rawText && !images.length && !audioDraft) {
            return;
        }

        store.dispatch({ type: "composer/submit-start" });

        try {
            const anonymousMode = ["wish", "delivery"].includes(activeStage) ? true : state.composerState.anonymousMode;
            const claimSelection = state.roundState.claimSelection;
            const mentionTarget = state.composerState.mentionTarget || (claimSelection
                ? {
                    name: claimSelection.authorName,
                    avatar: claimSelection.authorAvatar || ""
                }
                : null);
            if (activeStage === "delivery" && !claimSelection?.postId) {
                store.dispatch({
                    type: "composer/submit-error",
                    payload: { error: new Error("请先在选愿望阶段锁定目标。") }
                });
                showToast({
                    tone: "info",
                    message: "先在选愿望阶段锁定 1 条愿望，再回来交付。"
                });
                return;
            }
            if (activeStage === "delivery" && !mentionTarget) {
                store.dispatch({
                    type: "composer/submit-error",
                    payload: { error: new Error("当前交付目标还没有同步完成。") }
                });
                showToast({
                    tone: "info",
                    message: "当前交付目标还没同步出来，刷新后再试。"
                });
                return;
            }
            if (activeStage === "guess" && !mentionTarget) {
                store.dispatch({
                    type: "composer/submit-error",
                    payload: { error: new Error("请先选择你猜的是谁。") }
                });
                showToast({
                    tone: "info",
                    message: "先选你猜的是谁，再提交判断依据。"
                });
                return;
            }
            const shouldAiReshapeImages = anonymousMode && state.composerState.aiImageReshape && images.length > 0;
            const sourceImages = shouldAiReshapeImages
                ? await Promise.all(images.map((image) => cloneComposerImageForPost(image)))
                : null;

            const anonymizedDraft = anonymousMode && (rawText || shouldAiReshapeImages)
                ? await dataService.anonymizeAnonymousDraft?.({
                    text: rawText,
                    purpose: "post",
                    channelId: state.runtimeState.channel?.id || null,
                    images: shouldAiReshapeImages ? sourceImages : [],
                    reshapeImages: shouldAiReshapeImages
                })
                : null;
            const publishedText = anonymousMode
                ? (anonymizedDraft?.text || anonymizeComposerText(rawText))
                : rawText;
            const publishedBody = mentionTarget
                ? `@${mentionTarget.name}\n${publishedText || ""}`.trim()
                : (publishedText || "");
            const publishedImages = anonymousMode
                ? (
                    shouldAiReshapeImages && anonymizedDraft?.images?.length === images.length
                        ? anonymizedDraft.images
                        : await Promise.all(images.map((image) => processAnonymousImageForPost(image)))
                )
                : await Promise.all(images.map((image) => cloneComposerImageForPost(image)));
            const publishedAudio = audioDraft
                ? await cloneComposerAudioForPost(audioDraft)
                : null;
            const activeAliasKey = state.runtimeState.activeAliasKey;
            const post = await dataService.publishPost({
                body: publishedBody || (publishedAudio ? "分享一段语音" : "分享一张图片"),
                media: [
                    ...publishedImages,
                    ...(publishedAudio ? [publishedAudio] : [])
                ],
                boardSlug: activeStage,
                aiDisclosure: anonymousMode ? "none" : state.composerState.aiDisclosure,
                author: anonymousMode
                    ? { type: "alias_session", key: activeAliasKey }
                    : { type: "identity" }
            });
            const savedGuessSelection = activeStage === "guess" && mentionTarget
                ? await dataService.saveGuessSelection(mentionTarget)
                : null;

            revokeImageDrafts(images);
            if (audioDraft) {
                revokeComposerAudioDraft(audioDraft);
            }
            store.dispatch({ type: "composer/reset" });
            store.dispatch({
                type: "round/mark-progress",
                payload: {
                    wishSubmitted: activeStage === "wish" ? true : state.roundState.progress.wishSubmitted,
                    deliverySubmitted: activeStage === "delivery" ? true : state.roundState.progress.deliverySubmitted,
                    guessSubmitted: activeStage === "guess" ? true : state.roundState.progress.guessSubmitted
                }
            });
            if (savedGuessSelection) {
                store.dispatch({
                    type: "round/set-guess-selection",
                    payload: { selection: savedGuessSelection }
                });
            }
            if (anonymousMode && state.composerState.autoRotate) {
                await this.regenerateAliasProfile();
            }

            if (activeStage === "delivery") {
                await feedActions.setActiveBoard("guess");
            } else {
                const targetBoard = post.board === "none" ? "all" : post.board;
                await feedActions.loadFeed(targetBoard);
            }
            showToast({
                tone: "success",
                message: activeStage === "delivery"
                    ? "交付已提交，已切到猜测阶段。"
                    : anonymousMode
                        ? "匿名帖子已发送。"
                        : "帖子已发送。"
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
