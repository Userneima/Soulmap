import { postCommentsSortChoices } from "../../entities/post/config.js";

const getSortedComments = (comments, sort) => {
    if (sort === "latest") {
        return [...comments].reverse();
    }
    return [...comments];
};

export const selectCommentDrawerVM = (state) => {
    const overlay = state.overlayState.comments;
    const post = overlay.post;
    const authStatus = state.authState.status;
    const membershipStatus = state.membershipState.status;
    const canInteract = authStatus === "authenticated" && membershipStatus === "approved";

    return {
        open: overlay.open,
        status: overlay.status,
        error: typeof overlay.error === "string"
            ? overlay.error
            : overlay.error?.message || "",
        openSource: overlay.openSource,
        initialFocusTarget: overlay.initialFocusTarget,
        sort: overlay.sort,
        sortChoices: postCommentsSortChoices,
        post,
        comments: getSortedComments(post?.comments || [], overlay.sort),
        draftText: overlay.draftText,
        submitStatus: overlay.submitStatus,
        canSend: Boolean(overlay.draftText.trim()) && overlay.submitStatus !== "submitting" && overlay.status === "ready" && canInteract,
        copyEnabled: Boolean(post),
        canInteract,
        accessHint: authStatus === "guest"
            ? "登录后才能评论"
            : authStatus === "upgrading_legacy_anonymous"
                ? "升级为正式账号后才能评论"
                : membershipStatus === "approved"
                    ? "发言要友善，畅聊不引战"
                    : "申请加入频道后才能评论"
    };
};
