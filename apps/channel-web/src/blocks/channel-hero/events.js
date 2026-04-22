export const attachChannelHeroEvents = ({ root, actions }) => {
    const getOverlayAnchor = (button, source) => {
        const rect = button.getBoundingClientRect();

        return {
            anchorX: rect.left + (rect.width / 2),
            anchorY: rect.bottom,
            anchorSource: source
        };
    };

    root.addEventListener("click", (event) => {
        const button = event.target.closest("[data-channel-hero-action]");
        if (!button) {
            return;
        }

        const action = button.dataset.channelHeroAction;
        if (action === "search") {
            actions.requestSearchFocus();
            return;
        }

        if (action === "members") {
            actions.openOverlay("member-list");
            return;
        }

        if (action === "notifications") {
            actions.openOverlay("notification-center", {
                tab: "interaction",
                ...getOverlayAnchor(button, "channel-hero-notifications")
            });
            return;
        }

        if (action === "menu") {
            actions.openOverlay("channel-menu", getOverlayAnchor(button, "channel-hero-menu"));
        }
    });
};
