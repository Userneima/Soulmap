export const attachChannelSettingsDialogEvents = ({ root, actions }) => {
    root.addEventListener("click", (event) => {
        const button = event.target.closest("[data-channel-settings-action]");
        if (!button) {
            return;
        }

        const action = button.dataset.channelSettingsAction;
        if (action === "close") {
            actions.closeOverlay("channel-settings");
            return;
        }

        if (action === "save") {
            void actions.saveChannelSettings();
            return;
        }

        if (action === "clear-logo") {
            actions.setChannelSettingsDraft({ draftLogo: "" });
            return;
        }

        if (action === "clear-background") {
            actions.setChannelSettingsDraft({ draftBackground: "" });
        }
    });

    root.addEventListener("input", (event) => {
        const input = event.target.closest("[data-ref='channel-name-input']");
        if (!input) {
            return;
        }

        actions.setChannelSettingsDraft({ draftName: input.value });
    });

    root.addEventListener("change", (event) => {
        const logoInput = event.target.closest("[data-ref='channel-logo-input']");
        if (logoInput) {
            if (logoInput.files?.[0]) {
                void actions.setChannelLogo(logoInput.files[0]);
            }
            logoInput.value = "";
            return;
        }

        const backgroundInput = event.target.closest("[data-ref='channel-background-input']");
        if (!backgroundInput) {
            return;
        }

        if (backgroundInput.files?.[0]) {
            void actions.setChannelBackground(backgroundInput.files[0]);
        }
        backgroundInput.value = "";
    });
};
