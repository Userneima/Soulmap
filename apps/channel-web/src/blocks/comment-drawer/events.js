export const attachCommentDrawerEvents = ({ root, actions }) => {
    root.addEventListener("click", (event) => {
        const button = event.target.closest("[data-comments-action]");
        if (button) {
            const action = button.dataset.commentsAction;
            if (action === "close") {
                actions.closeOverlay("comments");
                return;
            }
            if (action === "retry") {
                void actions.refreshComments();
                return;
            }
            if (action === "copy") {
                void actions.copyCurrentPostBody();
                return;
            }
            if (action === "send") {
                void actions.submitComment();
                return;
            }
            if (action === "toggle-anonymous") {
                actions.toggleCommentAnonymousMode();
                return;
            }
            if (action === "regenerate-alias") {
                void actions.regenerateAliasProfile();
                return;
            }
        }

        const sortButton = event.target.closest("[data-comments-sort]");
        if (sortButton) {
            actions.setCommentsSort(sortButton.dataset.commentsSort);
            return;
        }

        const likeButton = event.target.closest("[data-comment-action='like']");
        if (likeButton) {
            actions.likeComment(likeButton.dataset.commentId);
            return;
        }

        const replyButton = event.target.closest("[data-comment-action='reply']");
        if (replyButton) {
            actions.replyToComment({
                id: replyButton.dataset.commentId,
                authorName: replyButton.dataset.commentAuthor || "频道成员",
                text: replyButton.dataset.commentText || ""
            });
            return;
        }

        const clearReplyButton = event.target.closest("[data-comments-action='clear-reply']");
        if (clearReplyButton) {
            actions.clearCommentReplyTarget();
        }
    });

    root.addEventListener("input", (event) => {
        const input = event.target.closest("[data-ref='comment-input']");
        if (!input) {
            return;
        }
        actions.setCommentDraft(input.value);
    });

    root.addEventListener("keydown", (event) => {
        const input = event.target.closest("[data-ref='comment-input']");
        if (!input || event.key !== "Enter" || event.shiftKey) {
            return;
        }
        event.preventDefault();
        if (!input.disabled) {
            void actions.submitComment();
        }
    });
};
