export const attachNotificationCenterEvents = ({ root, actions }) => {
    root.addEventListener("click", (event) => {
        const button = event.target.closest("[data-notification-center-action]");
        if (!button) {
            return;
        }

        const action = button.dataset.notificationCenterAction;
        if (action === "close") {
            actions.closeOverlay("notification-center");
            return;
        }

        if (action === "tab") {
            actions.setNotificationCenterTab(button.dataset.tabKey || "interaction");
        }
    });
};
