export const createShellActions = ({ store }) => ({
    setSidebarOpen(open) {
        store.dispatch({
            type: "ui/set-sidebar",
            payload: { open }
        });
    },
    toggleSidebar() {
        const current = store.getState().uiState.sidebarOpen;
        this.setSidebarOpen(!current);
    },
    syncTopRegion(scrollY = window.scrollY) {
        const nextValue = scrollY > 48 ? "condensed" : "expanded";
        if (store.getState().uiState.topRegion === nextValue) {
            return;
        }
        store.dispatch({
            type: "ui/set-top-region",
            payload: { value: nextValue }
        });
    },
    setAccountMenuOpen(open) {
        store.dispatch({
            type: "ui/set-account-menu",
            payload: { open }
        });
    },
    toggleAccountMenu() {
        const current = store.getState().uiState.accountMenuOpen;
        this.setAccountMenuOpen(!current);
    },
    requestSearchFocus() {
        store.dispatch({ type: "ui/request-search-focus" });
    },
    openChannelMenu(anchor = {}) {
        store.dispatch({ type: "notification-center/close" });
        store.dispatch({
            type: "channel-menu/open",
            payload: anchor
        });
    },
    closeChannelMenu() {
        store.dispatch({ type: "channel-menu/close" });
    },
    openNotificationCenter(tab = "interaction", anchor = {}) {
        store.dispatch({ type: "channel-menu/close" });
        store.dispatch({
            type: "notification-center/open",
            payload: { tab, ...anchor }
        });
    },
    closeNotificationCenter() {
        store.dispatch({ type: "notification-center/close" });
    },
    setNotificationCenterTab(tab) {
        store.dispatch({
            type: "notification-center/set-tab",
            payload: { tab }
        });
    }
});
