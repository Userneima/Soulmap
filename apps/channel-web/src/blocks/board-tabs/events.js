export const attachBoardTabsEvents = ({ root, actions }) => {
    root.addEventListener("click", (event) => {
        const filterButton = event.target.closest("[data-filter]");
        if (filterButton) {
            actions.setFeedFilter(filterButton.dataset.filter);
            return;
        }

        const boardButton = event.target.closest("[data-board]");
        if (boardButton) {
            void actions.setActiveBoard(boardButton.dataset.board);
            return;
        }

        const composeButton = event.target.closest("[data-board-tabs-action='compose']");
        if (composeButton) {
            window.scrollTo({ top: 0, behavior: "smooth" });
            actions.syncTopRegion(0);
        }
    });
};
