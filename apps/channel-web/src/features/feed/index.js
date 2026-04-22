import { anonymizeComposerText, copyText, getChannelActionErrorMessage, getPostBodyText } from "../../shared/lib/helpers.js";

const requestInteractionAccess = ({ store, showToast }) => {
    const state = store.getState();
    const authStatus = state.authState.status;
    const membershipStatus = state.membershipState.status;

    if (authStatus === "guest") {
        store.dispatch({
            type: "auth-gate/open",
            payload: { mode: "login" }
        });
        return false;
    }

    if (authStatus === "upgrading_legacy_anonymous") {
        store.dispatch({
            type: "auth-gate/open",
            payload: { mode: "upgrade" }
        });
        return false;
    }

    if (membershipStatus !== "approved") {
        showToast({
            tone: "info",
            message: "公开浏览可用，评论和互动需要先申请加入频道。"
        });
        return false;
    }

    return true;
};

const sortFeedItems = (items, filter) => {
    if (filter === "new-reply") {
        return [...items].sort((left, right) => {
            const leftCount = left.comments?.length || 0;
            const rightCount = right.comments?.length || 0;
            if (rightCount !== leftCount) {
                return rightCount - leftCount;
            }
            return 0;
        });
    }

    return [...items];
};

const findFeedPostById = (state, postId) => state.feedState.items.find((item) => item.id === postId) || null;

const findDrawerCommentById = (state, commentId) => state.overlayState.comments.post?.comments?.find((comment) => comment.id === commentId) || null;

const normalizeLightboxImage = (image) => {
    if (!image?.url) {
        return null;
    }

    return {
        url: String(image.url),
        name: String(image.name || "帖子图片")
    };
};

export const createFeedActions = ({ store, dataService, showToast }) => ({
    async loadFeed(board = store.getState().feedState.activeBoard) {
        store.dispatch({
            type: "feed/set-board",
            payload: { board }
        });
        store.dispatch({ type: "feed/load-start" });

        try {
            const nextBoard = board === "all"
                ? null
                : board === "claim"
                    ? "wish"
                    : board === "guess"
                        ? "delivery"
                    : board === "reveal"
                        ? "guess"
                    : board;
            const items = await dataService.listPosts(nextBoard);
            const filter = store.getState().feedState.activeFilter;
            store.dispatch({
                type: "feed/load-success",
                payload: { items: sortFeedItems(items, filter) }
            });
        } catch (error) {
            store.dispatch({
                type: "feed/load-error",
                payload: { error }
            });
            showToast({
                tone: "error",
                message: getChannelActionErrorMessage("load_feed", error)
            });
        }
    },
    async setActiveBoard(board) {
        if (board && board !== "all") {
            store.dispatch({
                type: "round/set-stage",
                payload: {
                    stage: board,
                    forceAnonymous: ["wish", "delivery"].includes(board)
                }
            });
        }
        await this.loadFeed(board);
    },
    setFeedFilter(filter) {
        store.dispatch({
            type: "feed/set-filter",
            payload: { filter }
        });

        const { items } = store.getState().feedState;
        store.dispatch({
            type: "feed/load-success",
            payload: { items: sortFeedItems(items, filter) }
        });
    },
    setFeedSearchQuery(searchQuery) {
        store.dispatch({
            type: "feed/set-search-query",
            payload: { searchQuery }
        });
    },
    async likePost(postId) {
        if (!requestInteractionAccess({ store, showToast })) {
            return;
        }

        const post = findFeedPostById(store.getState(), postId);
        if (post?.isDeleted) {
            showToast({
                tone: "info",
                message: "该帖子已删除，无法继续点赞。"
            });
            return;
        }

        const likedPostIds = store.getState().feedState.likedPostIds || [];
        if (likedPostIds.includes(postId)) {
            showToast({
                tone: "info",
                message: "这条帖子你已经点过赞了。"
            });
            return;
        }

        try {
            const likes = await dataService.likePost(postId);
            store.dispatch({
                type: "feed/mark-liked",
                payload: { postId, likes }
            });
            showToast({
                tone: "success",
                message: "已点赞。"
            });
        } catch (error) {
            showToast({
                tone: "error",
                message: getChannelActionErrorMessage("like_post", error)
            });
        }
    },
    async claimWish(postId) {
        if (!requestInteractionAccess({ store, showToast })) {
            return;
        }

        const state = store.getState();
        const post = findFeedPostById(state, postId);
        if (!post || post.isDeleted) {
            showToast({
                tone: "info",
                message: "这条愿望当前不可选。"
            });
            return;
        }

        if (state.roundState.activeStage !== "claim") {
            showToast({
                tone: "info",
                message: "当前不在选愿望阶段。"
            });
            return;
        }

        if (post.authorUserId && post.authorUserId === state.authState.user?.id) {
            showToast({
                tone: "info",
                message: "不能选择自己发的愿望。"
            });
            return;
        }

        try {
            const selection = await dataService.saveClaimSelection(post);
            store.dispatch({
                type: "round/set-claim-selection",
                payload: { selection }
            });
            showToast({
                tone: "success",
                message: state.roundState.claimSelection?.postId === postId
                    ? "这条愿望已经是你当前的目标。"
                    : "愿望已锁定，交付阶段会自动带上目标。"
            });
        } catch (error) {
            showToast({
                tone: "error",
                message: getChannelActionErrorMessage("update_round_state", error)
            });
        }
    },
    openComments(postId, source = "comments") {
        store.dispatch({
            type: "comments/open",
            payload: { postId, source }
        });
        void this.refreshComments();
    },
    openPostImage(postId, imageIndex = 0) {
        const post = findFeedPostById(store.getState(), postId);
        const image = normalizeLightboxImage(post?.images?.[imageIndex]);
        if (!image) {
            return;
        }

        store.dispatch({
            type: "image-lightbox/open",
            payload: {
                image,
                source: "feed"
            }
        });
    },
    openCurrentDrawerImage(imageIndex = 0) {
        const image = normalizeLightboxImage(store.getState().overlayState.comments.post?.images?.[imageIndex]);
        if (!image) {
            return;
        }

        store.dispatch({
            type: "image-lightbox/open",
            payload: {
                image,
                source: "comments"
            }
        });
    },
    closeImageLightbox() {
        store.dispatch({ type: "image-lightbox/close" });
    },
    getActiveCommentsPostId() {
        return store.getState().overlayState.comments.postId;
    },
    closeComments() {
        store.dispatch({ type: "comments/close" });
    },
    async refreshComments() {
        const { postId } = store.getState().overlayState.comments;
        if (!postId) {
            return;
        }

        try {
            const post = await dataService.getPost(postId);
            store.dispatch({
                type: "comments/load-success",
                payload: { post }
            });
        } catch (error) {
            store.dispatch({
                type: "comments/load-error",
                payload: { error }
            });
            showToast({
                tone: "error",
                message: getChannelActionErrorMessage("load_comments", error)
            });
        }
    },
    setCommentsSort(sort) {
        store.dispatch({
            type: "comments/set-field",
            payload: { sort }
        });
    },
    setCommentDraft(draftText) {
        store.dispatch({
            type: "comments/set-field",
            payload: { draftText }
        });
    },
    async likeComment(commentId) {
        if (!requestInteractionAccess({ store, showToast })) {
            return;
        }

        const { likedCommentIds = [], postId } = store.getState().overlayState.comments;
        const comment = findDrawerCommentById(store.getState(), commentId);
        if (comment?.isDeleted) {
            showToast({
                tone: "info",
                message: "该评论已删除，无法继续点赞。"
            });
            return;
        }

        if (likedCommentIds.includes(commentId)) {
            showToast({
                tone: "info",
                message: "这条评论你已经点过赞了。"
            });
            return;
        }

        try {
            const likes = await dataService.likeComment(commentId, postId);
            store.dispatch({
                type: "comments/like",
                payload: { commentId, likes }
            });
        } catch (error) {
            showToast({
                tone: "error",
                message: getChannelActionErrorMessage("like_comment", error)
            });
        }
    },
    replyToComment(comment) {
        if (!requestInteractionAccess({ store, showToast })) {
            return;
        }

        if (comment.isDeleted) {
            showToast({
                tone: "info",
                message: "该评论已删除，无法继续回复。"
            });
            return;
        }

        store.dispatch({
            type: "comments/set-field",
            payload: {
                replyTarget: {
                    id: comment.id,
                    authorName: comment.authorName,
                    text: comment.text || ""
                },
                draftText: ""
            }
        });
    },
    clearCommentReplyTarget() {
        store.dispatch({
            type: "comments/set-field",
            payload: {
                replyTarget: null
            }
        });
    },
    toggleCommentAnonymousMode() {
        if (!requestInteractionAccess({ store, showToast })) {
            return;
        }

        const current = store.getState().overlayState.comments.anonymousMode;
        store.dispatch({
            type: "comments/set-field",
            payload: {
                anonymousMode: !current
            }
        });
    },
    async submitComment() {
        if (!requestInteractionAccess({ store, showToast })) {
            return;
        }

        const state = store.getState();
        const draftText = state.overlayState.comments.draftText.trim();
        const postId = state.overlayState.comments.postId;
        const replyTarget = state.overlayState.comments.replyTarget;
        const anonymousMode = state.overlayState.comments.anonymousMode;
        if (!draftText || !postId) {
            return;
        }

        if (state.overlayState.comments.post?.isDeleted) {
            showToast({
                tone: "info",
                message: "原帖已删除，无法继续评论。"
            });
            return;
        }

        store.dispatch({ type: "comments/submit-start" });

        try {
            const anonymizedDraft = anonymousMode
                ? await dataService.anonymizeAnonymousDraft?.({
                    text: draftText,
                    purpose: "comment",
                    channelId: state.runtimeState.channel?.id || null
                })
                : null;

            await dataService.publishComment({
                postId,
                parentCommentId: replyTarget?.id || null,
                body: anonymousMode ? (anonymizedDraft?.text || anonymizeComposerText(draftText)) : draftText,
                author: {
                    type: anonymousMode ? "alias_session" : "identity",
                    key: anonymousMode ? state.runtimeState.activeAliasKey : undefined
                }
            });

            store.dispatch({
                type: "comments/submit-finish",
                payload: { clearDraft: true }
            });
            await this.loadFeed(store.getState().feedState.activeBoard);
            await this.refreshComments();
            showToast({
                tone: "success",
                message: anonymousMode ? "匿名评论已发送。" : "评论已发送。"
            });
        } catch (error) {
            store.dispatch({
                type: "comments/submit-finish",
                payload: { clearDraft: false }
            });
            showToast({
                tone: "error",
                message: getChannelActionErrorMessage("publish_comment", error)
            });
        }
    },
    requestDeletePost(postId) {
        const state = store.getState();
        const overlayPost = state.overlayState.comments.post;
        const post = findFeedPostById(state, postId)
            || ((overlayPost?.id === postId || !postId) ? overlayPost : null);
        if (!post || post.isDeleted) {
            return;
        }

        const currentUserId = state.authState.user?.id || null;
        const isModerator = ["owner", "admin"].includes(state.runtimeState.realIdentity.role) && state.membershipState.status === "approved";
        const scopeLabel = post.authorUserId === currentUserId ? "self" : (isModerator ? "moderator" : "unknown");
        const message = scopeLabel === "moderator"
            ? "将以管理员身份删除该内容，删除后会保留“已删除”占位。"
            : "删除后会保留“已删除”占位。";

        store.dispatch({
            type: "delete-confirm/open",
            payload: {
                targetType: "post",
                targetId: post.id,
                postId: post.id,
                title: "删除帖子",
                message,
                scopeLabel
            }
        });
    },
    requestDeleteComment(commentId) {
        const state = store.getState();
        const comment = findDrawerCommentById(state, commentId);
        if (!comment || comment.isDeleted) {
            return;
        }

        const currentUserId = state.authState.user?.id || null;
        const isModerator = ["owner", "admin"].includes(state.runtimeState.realIdentity.role) && state.membershipState.status === "approved";
        const scopeLabel = comment.authorUserId === currentUserId ? "self" : (isModerator ? "moderator" : "unknown");
        const message = scopeLabel === "moderator"
            ? "将以管理员身份删除该内容，删除后会保留“已删除”占位。"
            : "删除后会保留“已删除”占位。";

        store.dispatch({
            type: "delete-confirm/open",
            payload: {
                targetType: "comment",
                targetId: comment.id,
                postId: state.overlayState.comments.postId || state.overlayState.comments.post?.id || null,
                title: "删除评论",
                message,
                scopeLabel
            }
        });
    },
    cancelDeleteConfirm() {
        store.dispatch({ type: "delete-confirm/close" });
    },
    async confirmDeletePost(postId = store.getState().overlayState.deleteConfirm.targetId) {
        if (!postId) {
            return;
        }

        store.dispatch({ type: "delete-confirm/submit-start" });

        try {
            const nextPost = await dataService.deletePost(postId);
            store.dispatch({
                type: "feed/replace-post",
                payload: { post: nextPost }
            });
            store.dispatch({ type: "delete-confirm/submit-finish" });
            showToast({
                tone: "success",
                message: "帖子已删除。"
            });
        } catch (error) {
            store.dispatch({
                type: "delete-confirm/submit-error",
                payload: { error }
            });
            showToast({
                tone: "error",
                message: getChannelActionErrorMessage("delete_post", error)
            });
        }
    },
    async confirmDeleteComment(commentId = store.getState().overlayState.deleteConfirm.targetId) {
        if (!commentId) {
            return;
        }

        store.dispatch({ type: "delete-confirm/submit-start" });

        try {
            const nextPost = await dataService.deleteComment(commentId);
            store.dispatch({
                type: "feed/replace-post",
                payload: { post: nextPost }
            });
            store.dispatch({ type: "delete-confirm/submit-finish" });
            showToast({
                tone: "success",
                message: "评论已删除。"
            });
        } catch (error) {
            store.dispatch({
                type: "delete-confirm/submit-error",
                payload: { error }
            });
            showToast({
                tone: "error",
                message: getChannelActionErrorMessage("delete_comment", error)
            });
        }
    },
    async copyCurrentPostBody() {
        const post = store.getState().overlayState.comments.post;
        if (!post) {
            return;
        }

        try {
            await copyText(getPostBodyText(post));
            showToast({
                tone: "success",
                message: "帖子正文已复制。"
            });
        } catch (error) {
            showToast({
                tone: "error",
                message: getChannelActionErrorMessage("copy_post", error)
            });
        }
    }
});
