import { getChannelActionErrorMessage, getPostBodyText, copyText } from "../../shared/lib/helpers.js";

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

export const createFeedActions = ({ store, dataService, showToast }) => ({
    async loadFeed(board = store.getState().feedState.activeBoard) {
        store.dispatch({
            type: "feed/set-board",
            payload: { board }
        });
        store.dispatch({ type: "feed/load-start" });

        try {
            const nextBoard = board === "all" ? null : board;
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
    openComments(postId, source = "comments") {
        store.dispatch({
            type: "comments/open",
            payload: { postId, source }
        });
        void this.refreshComments();
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
    async submitComment() {
        if (!requestInteractionAccess({ store, showToast })) {
            return;
        }

        const state = store.getState();
        const draftText = state.overlayState.comments.draftText.trim();
        const postId = state.overlayState.comments.postId;
        if (!draftText || !postId) {
            return;
        }

        store.dispatch({ type: "comments/submit-start" });

        try {
            await dataService.publishComment({
                postId,
                body: draftText,
                author: {
                    type: "identity"
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
                message: "评论已发送。"
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
