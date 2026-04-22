export const attachChannelIntelligenceEvents = ({ root, actions }) => {
    root.addEventListener("click", (event) => {
        const panelAction = event.target.closest("[data-channel-intelligence-action]");
        if (panelAction) {
            const action = panelAction.dataset.channelIntelligenceAction;
            if (action === "open") {
                actions.openOverlay("channel-intelligence");
                return;
            }
            if (action === "close") {
                actions.closeOverlay("channel-intelligence");
                return;
            }
            if (action === "toggle-god-picker") {
                actions.toggleRoundGodPicker();
                return;
            }
            if (action === "toggle-theme-editor") {
                actions.toggleRoundThemeEditor();
                return;
            }
            if (action === "cancel-theme") {
                actions.cancelRoundThemeEditing();
                return;
            }
            if (action === "save-theme") {
                actions.saveRoundTheme();
                return;
            }
            if (action === "toggle-reveal-editor") {
                actions.toggleRoundRevealEditor();
                return;
            }
            if (action === "generate-reveal-results") {
                void actions.generateRoundRevealResults();
                return;
            }
            if (action === "toggle-reveal-member-picker") {
                actions.toggleRoundRevealMemberPicker();
                return;
            }
            if (action === "toggle-reveal-angel-picker") {
                actions.toggleRoundRevealAngelPicker();
                return;
            }
            if (action === "save-reveal-pair") {
                actions.saveRoundRevealPair();
                return;
            }
        }

        const godOption = event.target.closest("[data-channel-intelligence-god]");
        if (godOption) {
            actions.assignRoundGod({
                name: godOption.dataset.channelIntelligenceGod,
                avatar: godOption.dataset.channelIntelligenceAvatar || ""
            });
            return;
        }

        const revealMemberOption = event.target.closest("[data-channel-intelligence-member]");
        if (revealMemberOption) {
            actions.chooseRoundRevealMember({
                name: revealMemberOption.dataset.channelIntelligenceMember,
                avatar: revealMemberOption.dataset.channelIntelligenceAvatar || ""
            });
            return;
        }

        const revealAngelOption = event.target.closest("[data-channel-intelligence-angel]");
        if (revealAngelOption) {
            actions.chooseRoundRevealAngel({
                name: revealAngelOption.dataset.channelIntelligenceAngel,
                avatar: revealAngelOption.dataset.channelIntelligenceAvatar || ""
            });
            return;
        }

        const trigger = event.target.closest("[data-channel-intelligence-post-id]");
        if (!trigger) {
            return;
        }

        actions.closeOverlay("channel-intelligence");
        actions.openOverlay("comments", {
            postId: trigger.dataset.channelIntelligencePostId,
            source: "body"
        });
    });

    root.addEventListener("input", (event) => {
        const input = event.target.closest("[data-channel-intelligence-ref='theme-input']");
        if (!input) {
            return;
        }

        actions.setRoundThemeDraft(input.value);
    });
};
