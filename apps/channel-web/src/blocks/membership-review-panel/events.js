export const attachMembershipReviewPanelEvents = ({ root, actions }) => {
    root.addEventListener("click", (event) => {
        const actionButton = event.target.closest("[data-membership-review-action]");
        if (!actionButton) {
            return;
        }

        const requestId = actionButton.dataset.requestId;
        const action = actionButton.dataset.membershipReviewAction;
        if (!requestId) {
            return;
        }

        if (action === "approve") {
            void actions.approveJoinRequest(requestId);
            return;
        }

        if (action === "reject") {
            void actions.rejectJoinRequest(requestId);
        }
    });
};
