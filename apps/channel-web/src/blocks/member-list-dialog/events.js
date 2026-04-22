export const attachMemberListDialogEvents = ({ root, actions }) => {
    root.addEventListener("click", (event) => {
        const button = event.target.closest("[data-member-list-action]");
        if (!button) {
            return;
        }

        if (button.dataset.memberListAction === "close") {
            actions.closeOverlay("member-list");
        }
    });
};
