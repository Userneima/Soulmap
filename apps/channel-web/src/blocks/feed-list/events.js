export const attachFeedListEvents = ({ root, store, actions }) => {
    root.addEventListener("click", (event) => {
        const stateAction = event.target.closest("[data-feed-action='retry']");
        if (stateAction) {
            void actions.loadFeed(store.getState().feedState.activeBoard);
            return;
        }

        const commentsButton = event.target.closest("[data-feed-action='open-comments']");
        const bodyButton = event.target.closest("[data-feed-action='open-post-body']");
        const likeButton = event.target.closest("[data-feed-action='like-post']");
        if (likeButton) {
            const article = likeButton.closest("[data-post-id]");
            if (!article) {
                return;
            }

            void actions.likePost(article.dataset.postId);
            return;
        }

        if (!commentsButton && !bodyButton) {
            return;
        }

        const article = (commentsButton || bodyButton).closest("[data-post-id]");
        if (!article) {
            return;
        }

        actions.openOverlay("comments", {
            postId: article.dataset.postId,
            source: bodyButton ? "body" : "comments"
        });
    });
};
