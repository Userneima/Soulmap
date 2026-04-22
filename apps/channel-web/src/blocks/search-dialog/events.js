export const attachSearchDialogEvents = ({ root, actions }) => {
    root.addEventListener("click", (event) => {
        const button = event.target.closest("[data-search-dialog-action]");
        if (!button) {
            return;
        }

        const action = button.dataset.searchDialogAction;
        if (action === "close") {
            actions.closeOverlay("search-dialog");
            return;
        }

        if (action === "open-result") {
            const postId = button.dataset.postId;
            actions.closeOverlay("search-dialog");
            actions.openOverlay("comments", {
                postId,
                source: "body"
            });
        }
    });

    root.addEventListener("input", (event) => {
        const input = event.target.closest("[data-search-dialog-ref='input']");
        if (!input) {
            return;
        }

        actions.setSearchDialogField({
            query: input.value
        });
    });

    root.addEventListener("change", (event) => {
        const sortSelect = event.target.closest("[data-search-dialog-ref='sort']");
        if (sortSelect) {
            actions.setSearchDialogField({
                sort: sortSelect.value
            });
            return;
        }

        const boardSelect = event.target.closest("[data-search-dialog-ref='board']");
        if (boardSelect) {
            actions.setSearchDialogField({
                board: boardSelect.value
            });
        }
    });
};
