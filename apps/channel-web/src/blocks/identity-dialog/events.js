export const attachIdentityDialogEvents = ({ root, actions }) => {
    root.addEventListener("click", (event) => {
        const button = event.target.closest("[data-identity-action]");
        if (!button) {
            return;
        }

        const action = button.dataset.identityAction;
        if (action === "close") {
            actions.closeOverlay("identity");
            return;
        }

        if (action === "save") {
            void actions.saveIdentity();
        }
    });

    root.addEventListener("input", (event) => {
        const input = event.target.closest("[data-ref='identity-name-input']");
        if (!input) {
            return;
        }

        actions.setIdentityDraft({ draftName: input.value });
    });

    root.addEventListener("change", (event) => {
        const input = event.target.closest("[data-ref='identity-avatar-input']");
        if (!input || !input.files?.[0]) {
            return;
        }

        void actions.setIdentityAvatar(input.files[0]);
        input.value = "";
    });
};
