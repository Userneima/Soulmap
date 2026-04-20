export const attachJoinRequestPanelEvents = ({ root, actions }) => {
    root.addEventListener("input", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) {
            return;
        }

        if (target.matches("[data-join-request-ref='message']")) {
            actions.setMembershipField({
                draftMessage: target.value,
                error: null
            });
        }
    });

    root.addEventListener("click", (event) => {
        const actionButton = event.target.closest("[data-join-request-action]");
        if (!actionButton) {
            return;
        }

        const action = actionButton.dataset.joinRequestAction;
        if (action === "login") {
            actions.openAuthGate("login");
            return;
        }
        if (action === "upgrade") {
            actions.openAuthGate("upgrade");
            return;
        }
        if (action === "submit") {
            void actions.submitJoinRequest();
        }
    });
};
