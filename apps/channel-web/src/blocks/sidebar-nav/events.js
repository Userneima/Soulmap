export const attachSidebarNavEvents = ({ root, actions }) => {
    root.addEventListener("click", (event) => {
        const button = event.target.closest("[data-sidebar-action]");
        if (!button) {
            return;
        }

        event.stopPropagation();

        const action = button.dataset.sidebarAction;
        if (action === "toggle") {
            actions.toggleSidebar();
            return;
        }

        if (action === "close") {
            actions.setSidebarOpen(false);
            return;
        }

        if (action === "identity") {
            actions.setAccountMenuOpen(false);
            actions.openOverlay("identity");
            return;
        }

        if (action === "create-channel") {
            actions.openCreateChannelPage();
            return;
        }

        if (action === "toggle-account-menu") {
            actions.toggleAccountMenu();
            return;
        }

        if (action === "login") {
            actions.openAuthGate("login");
            return;
        }

        if (action === "logout") {
            actions.setAccountMenuOpen(false);
            void actions.logout();
        }
    });

    root.addEventListener("input", (event) => {
        const searchInput = event.target.closest("[data-sidebar-ref='search-input']");
        if (!searchInput) {
            return;
        }

        actions.setFeedSearchQuery(searchInput.value);
    });
};
