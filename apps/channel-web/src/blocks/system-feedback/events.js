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
            return;
        }

        if (action === "cancel-delete") {
            actions.cancelDeleteConfirm();
            return;
        }

        if (action === "confirm-delete") {
            const deleteConfirm = actions.getDeleteConfirmState?.();
            if (deleteConfirm?.targetType === "post") {
                void actions.confirmDeletePost(deleteConfirm.targetId);
                return;
            }

            if (deleteConfirm?.targetType === "comment") {
                void actions.confirmDeleteComment(deleteConfirm.targetId);
            }
        }
    });
};
