import { beforeEach, describe, expect, it, vi } from "vitest";
import { createStore } from "../shared/state/store.js";
import { mountSidebarNavBlock } from "../blocks/sidebar-nav/index.js";
import { createAppActions } from "../features/app-actions.js";

const createMockDataService = () => ({
    getAuthState: vi.fn(),
    getChannelShell: vi.fn(),
    getCachedChannelBootstrap: vi.fn(),
    loadChannelBootstrap: vi.fn(),
    loadPublicChannelPreview: vi.fn(),
    loadMembershipState: vi.fn(),
    loadApprovedMemberRuntime: vi.fn(),
    listPendingJoinRequests: vi.fn(),
    loginWithPassword: vi.fn(),
    signOut: vi.fn(),
    upgradeLegacyAnonymousUser: vi.fn(),
    submitJoinRequest: vi.fn(),
    approveJoinRequest: vi.fn(),
    rejectJoinRequest: vi.fn(),
    createChannel: vi.fn(),
    listPosts: vi.fn(),
    getPost: vi.fn(),
    publishPost: vi.fn(),
    publishComment: vi.fn(),
    updateIdentity: vi.fn()
});

describe("sidebar nav account menu", () => {
    let store;
    let actions;
    let root;
    let block;

    beforeEach(() => {
        store = createStore();
        actions = createAppActions({
            store,
            dataService: createMockDataService()
        });

        store.dispatch({
            type: "auth/set-state",
            payload: {
                status: "authenticated",
                user: { id: "user-1", email: "member@example.com" },
                isAnonymous: false
            }
        });

        root = document.createElement("div");
        document.body.appendChild(root);
        block = mountSidebarNavBlock({ root, store, actions });
        block.render();
    });

    it("opens the account menu when clicking the identity footer", () => {
        const trigger = root.querySelector("[data-sidebar-action='toggle-account-menu']");
        expect(trigger).toBeTruthy();

        trigger.click();

        expect(store.getState().uiState.accountMenuOpen).toBe(true);
        block.render();
        expect(root.querySelector(".sidebar-nav__account-menu")).toBeTruthy();
    });

    it("focuses the in-channel search input when search focus is requested", () => {
        actions.requestSearchFocus();
        block.render();

        const searchInput = root.querySelector("[data-sidebar-ref='search-input']");
        expect(searchInput).toBeTruthy();
        expect(document.activeElement).toBe(searchInput);
    });
});
