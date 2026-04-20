export const attachAuthGateEvents = ({ root, actions }) => {
    root.addEventListener("click", (event) => {
        const actionButton = event.target.closest("[data-auth-gate-action]");
        if (!actionButton) {
            return;
        }

        const action = actionButton.dataset.authGateAction;
        if (action === "close") {
            actions.closeOverlay("auth-gate");
            return;
        }

        if (action === "submit") {
            void actions.submitAuthFlow();
        }
    });

    root.addEventListener("input", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) {
            return;
        }

        if (target.matches("[data-auth-gate-ref='email']")) {
            actions.setAuthField({ email: target.value, error: null });
            return;
        }

        if (target.matches("[data-auth-gate-ref='password']")) {
            actions.setAuthField({ password: target.value, error: null });
        }
    });
};
