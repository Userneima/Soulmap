export const attachSystemFeedbackEvents = ({ root, actions }) => {
    root.addEventListener("click", (event) => {
        const button = event.target.closest("[data-system-action]");
        if (!button) {
            return;
        }

        const action = button.dataset.systemAction;
        if (action === "retry-runtime") {
            void actions.initializeChannelRuntime();
            return;
        }

        if (action === "hide-toast") {
            actions.hideToast();
        }
    });
};
