import { beforeEach, describe, expect, it, vi } from "vitest";
import { createStore } from "../shared/state/store.js";
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
    upgradeLegacyAnonymousUser: vi.fn(),
    submitJoinRequest: vi.fn(),
    approveJoinRequest: vi.fn(),
    rejectJoinRequest: vi.fn(),
    createChannel: vi.fn(),
    listPosts: vi.fn(),
    getPost: vi.fn(),
    likePost: vi.fn(),
    publishPost: vi.fn(),
    publishComment: vi.fn(),
    updateIdentity: vi.fn()
});

const approvedRuntime = {
    channel: { id: "channel-1", slug: "channel", name: "频道", previewVisibility: "public", joinPolicy: "approval_required" },
    realIdentity: { id: "identity-1", name: "管理员", avatar: "avatar", meta: "当前真实身份", role: "owner" },
    anonymousProfiles: [{ id: "alias-1", key: "slot-baiyu", name: "白榆", avatar: "alias" }]
};

const seedApprovedViewer = (store) => {
    store.dispatch({
        type: "auth/set-state",
        payload: {
            status: "authenticated",
            user: { id: "user-1", email: "member@example.com" },
            isAnonymous: false
        }
    });
    store.dispatch({
        type: "membership/set-state",
        payload: {
            status: "approved",
            joinRequest: null,
            reviewItems: []
        }
    });
    store.dispatch({
        type: "runtime/member-ready",
        payload: approvedRuntime
    });
};

describe("channel feature actions", () => {
    let store;
    let dataService;
    let actions;

    beforeEach(() => {
        store = createStore();
        dataService = createMockDataService();
        dataService.getChannelShell.mockReturnValue(approvedRuntime.channel);
        dataService.getCachedChannelBootstrap.mockResolvedValue(null);
        actions = createAppActions({ store, dataService });
    });

    it("initializes public preview, auth state and approved member runtime", async () => {
        dataService.loadChannelBootstrap.mockResolvedValue({
            channel: approvedRuntime.channel,
            auth: {
                user: { id: "user-1", email: "owner@example.com" },
                isAnonymous: false
            },
            membership: {
                status: "approved",
                joinRequest: null,
                reviewItems: [],
                role: "owner"
            },
            memberRuntime: approvedRuntime
        });
        dataService.listPosts.mockResolvedValue([{ id: "post-1", comments: [] }]);

        await actions.initializeChannelRuntime();

        const state = store.getState();
        expect(state.runtimeState.status).toBe("ready");
        expect(state.runtimeState.phase).toBe("ready");
        expect(state.authState.status).toBe("authenticated");
        expect(state.membershipState.status).toBe("approved");
        expect(state.feedState.items).toHaveLength(1);
    });

    it("treats legacy anonymous session as guest preview in demo mode", async () => {
        dataService.loadChannelBootstrap.mockResolvedValue({
            channel: approvedRuntime.channel,
            auth: {
                user: { id: "anon-user-1" },
                isAnonymous: true
            },
            membership: {
                status: "guest",
                joinRequest: null,
                reviewItems: [],
                role: null
            },
            memberRuntime: null
        });
        dataService.listPosts.mockResolvedValue([{ id: "post-1", comments: [] }]);

        await actions.initializeChannelRuntime();

        const state = store.getState();
        expect(state.authState.status).toBe("guest");
        expect(state.membershipState.status).toBe("guest");
        expect(state.overlayState.authGate.open).toBe(false);
        expect(state.runtimeState.status).toBe("preview");
    });

    it("opens auth gate instead of posting for guests", async () => {
        store.dispatch({
            type: "auth/set-state",
            payload: {
                status: "guest",
                user: null,
                isAnonymous: false
            }
        });
        store.dispatch({
            type: "composer/set-field",
            payload: {
                draftText: "guest draft"
            }
        });

        await actions.submitPost();

        const state = store.getState();
        expect(state.overlayState.authGate.open).toBe(true);
        expect(state.overlayState.authGate.mode).toBe("login");
        expect(dataService.publishPost).not.toHaveBeenCalled();
    });

    it("keeps composer draft when publish fails for approved members", async () => {
        seedApprovedViewer(store);
        store.dispatch({
            type: "composer/set-field",
            payload: {
                draftText: "draft post"
            }
        });
        dataService.publishPost.mockRejectedValue(new Error("publish failed"));

        await actions.submitPost();

        expect(store.getState().composerState.draftText).toBe("draft post");
        expect(store.getState().composerState.submitStatus).toBe("idle");
    });

    it("keeps comment draft when submit comment fails", async () => {
        seedApprovedViewer(store);
        store.dispatch({
            type: "comments/open",
            payload: { postId: "post-1", source: "comments" }
        });
        store.dispatch({
            type: "comments/set-field",
            payload: {
                status: "ready",
                draftText: "draft comment"
            }
        });
        dataService.publishComment.mockRejectedValue(new Error("comment failed"));

        await actions.submitComment();

        expect(store.getState().overlayState.comments.draftText).toBe("draft comment");
        expect(store.getState().overlayState.comments.submitStatus).toBe("idle");
    });

    it("opens post detail drawer with source metadata", () => {
        actions.openOverlay("comments", {
            postId: "post-1",
            source: "body"
        });

        const commentsOverlay = store.getState().overlayState.comments;
        expect(commentsOverlay.open).toBe(true);
        expect(commentsOverlay.postId).toBe("post-1");
        expect(commentsOverlay.openSource).toBe("body");
        expect(commentsOverlay.initialFocusTarget).toBe("post-body");
    });

    it("likes a post once for the current session and updates the count", async () => {
        seedApprovedViewer(store);
        store.dispatch({
            type: "feed/load-success",
            payload: {
                items: [{ id: "post-1", likes: 3, comments: [] }]
            }
        });
        dataService.likePost.mockResolvedValue(4);

        await actions.likePost("post-1");
        await actions.likePost("post-1");

        expect(dataService.likePost).toHaveBeenCalledTimes(1);
        expect(store.getState().feedState.items[0].likes).toBe(4);
        expect(store.getState().feedState.likedPostIds).toContain("post-1");
    });

    it("updates real identity after saving identity dialog", async () => {
        seedApprovedViewer(store);
        store.dispatch({ type: "identity/open" });
        store.dispatch({
            type: "identity/set-field",
            payload: {
                draftName: "新名字",
                draftAvatar: "avatar-new"
            }
        });
        dataService.updateIdentity.mockResolvedValue({
            id: "identity-1",
            name: "新名字",
            avatar: "avatar-new",
            meta: "当前真实身份",
            role: "owner"
        });

        await actions.saveIdentity();

        const state = store.getState();
        expect(state.runtimeState.realIdentity.name).toBe("新名字");
        expect(state.overlayState.identity.open).toBe(false);
    });

    it("logs in with password and refreshes approved runtime", async () => {
        store.dispatch({
            type: "auth/set-field",
            payload: { email: "member@example.com", password: "secret123" }
        });
        dataService.loginWithPassword.mockResolvedValue({
            user: { id: "user-1", email: "member@example.com" },
            isAnonymous: false
        });
        dataService.loadChannelBootstrap.mockResolvedValue({
            channel: approvedRuntime.channel,
            auth: {
                user: { id: "user-1", email: "member@example.com" },
                isAnonymous: false
            },
            membership: {
                status: "approved",
                joinRequest: null,
                reviewItems: [],
                role: "owner"
            },
            memberRuntime: approvedRuntime
        });

        await actions.loginWithPassword();

        expect(dataService.loginWithPassword).toHaveBeenCalledWith("member@example.com", "secret123");
        expect(store.getState().authState.status).toBe("authenticated");
    });

    it("submits join request and switches membership to pending", async () => {
        store.dispatch({
            type: "runtime/preview-ready",
            payload: { channel: approvedRuntime.channel }
        });
        store.dispatch({
            type: "auth/set-state",
            payload: {
                status: "authenticated",
                user: { id: "user-2", email: "guest@example.com" },
                isAnonymous: false
            }
        });
        store.dispatch({
            type: "membership/set-state",
            payload: {
                status: "guest",
                draftMessage: "我想加入讨论。"
            }
        });
        dataService.submitJoinRequest.mockResolvedValue({
            id: "request-1",
            channelId: "channel-1",
            userId: "user-2",
            status: "pending",
            message: "我想加入讨论。"
        });

        await actions.submitJoinRequest();

        const state = store.getState();
        expect(state.membershipState.status).toBe("pending");
        expect(state.membershipState.joinRequest?.status).toBe("pending");
    });

    it("stores in-channel search query without reloading the feed", () => {
        actions.setFeedSearchQuery("苹果");

        expect(store.getState().feedState.searchQuery).toBe("苹果");
        expect(dataService.listPosts).not.toHaveBeenCalled();
    });

    it("toggles the account menu from the sidebar identity trigger", () => {
        expect(store.getState().uiState.accountMenuOpen).toBe(false);
        actions.toggleAccountMenu();
        expect(store.getState().uiState.accountMenuOpen).toBe(true);
        actions.toggleAccountMenu();
        expect(store.getState().uiState.accountMenuOpen).toBe(false);
    });

    it("requests channel search focus from the hero search entry", () => {
        expect(store.getState().uiState.searchFocusNonce).toBe(0);
        actions.requestSearchFocus();
        expect(store.getState().uiState.searchFocusNonce).toBe(1);
        expect(store.getState().uiState.sidebarOpen).toBe(true);
    });

    it("opens and closes the channel menu overlay", () => {
        expect(store.getState().overlayState.channelMenu.open).toBe(false);
        actions.openOverlay("channel-menu", {
            anchorX: 120,
            anchorY: 68,
            anchorSource: "channel-hero-menu"
        });
        expect(store.getState().overlayState.channelMenu.open).toBe(true);
        expect(store.getState().overlayState.channelMenu.anchorX).toBe(120);
        expect(store.getState().overlayState.channelMenu.anchorY).toBe(68);
        expect(store.getState().overlayState.channelMenu.anchorSource).toBe("channel-hero-menu");
        actions.closeOverlay("channel-menu");
        expect(store.getState().overlayState.channelMenu.open).toBe(false);
    });

    it("opens and switches the notification center overlay", () => {
        expect(store.getState().overlayState.notificationCenter.open).toBe(false);
        actions.openOverlay("notification-center", {
            tab: "interaction",
            anchorX: 132,
            anchorY: 72,
            anchorSource: "channel-hero-notifications"
        });
        expect(store.getState().overlayState.notificationCenter.open).toBe(true);
        expect(store.getState().overlayState.notificationCenter.tab).toBe("interaction");
        expect(store.getState().overlayState.notificationCenter.anchorX).toBe(132);
        expect(store.getState().overlayState.notificationCenter.anchorY).toBe(72);
        expect(store.getState().overlayState.notificationCenter.anchorSource).toBe("channel-hero-notifications");
        actions.setNotificationCenterTab("admin");
        expect(store.getState().overlayState.notificationCenter.tab).toBe("admin");
        actions.closeOverlay("notification-center");
        expect(store.getState().overlayState.notificationCenter.open).toBe(false);
    });

    it("signs out and returns the page to public preview state", async () => {
        seedApprovedViewer(store);
        store.dispatch({
            type: "feed/load-success",
            payload: { items: [{ id: "post-1", comments: [] }] }
        });
        dataService.signOut = vi.fn().mockResolvedValue({
            user: null,
            isAnonymous: false
        });
        dataService.loadChannelBootstrap.mockResolvedValue({
            channel: approvedRuntime.channel,
            auth: {
                user: null,
                isAnonymous: false
            },
            membership: {
                status: "guest",
                joinRequest: null,
                reviewItems: [],
                role: null
            },
            memberRuntime: null
        });
        dataService.listPosts.mockResolvedValue([{ id: "post-1", comments: [] }]);

        await actions.logout();

        const state = store.getState();
        expect(dataService.signOut).toHaveBeenCalled();
        expect(state.authState.status).toBe("guest");
        expect(state.membershipState.status).toBe("guest");
        expect(state.runtimeState.status).toBe("preview");
    });

    it("initializes create-channel page as guest and opens auth gate", async () => {
        dataService.getAuthState.mockResolvedValue({
            user: null,
            isAnonymous: false
        });

        await actions.initializeCreateChannelPage();

        const state = store.getState();
        expect(state.authState.status).toBe("guest");
        expect(state.overlayState.authGate.open).toBe(true);
    });

    it("creates channel and redirects into the new channel as owner", async () => {
        store.dispatch({
            type: "auth/set-state",
            payload: {
                status: "authenticated",
                user: { id: "user-1", email: "owner@example.com" },
                isAnonymous: false
            }
        });
        store.dispatch({
            type: "channel-create/set-field",
            payload: {
                name: "新频道",
                description: "新频道简介"
            }
        });
        dataService.createChannel.mockResolvedValue({
            channel: { id: "channel-2", slug: "new-channel", name: "新频道", previewVisibility: "public", joinPolicy: "approval_required" },
            realIdentity: { id: "identity-2", name: "owner", avatar: "avatar", meta: "当前真实身份", role: "owner" },
            anonymousProfiles: [{ id: "alias-2", key: "slot-baiyu", name: "白榆", avatar: "alias" }],
            activeAliasKey: "slot-baiyu"
        });

        await actions.submitCreateChannel();

        expect(dataService.createChannel).toHaveBeenCalledWith({
            name: "新频道",
            description: "新频道简介"
        });
        expect(store.getState().membershipState.status).toBe("approved");
        expect(store.getState().runtimeState.channel?.slug).toBe("new-channel");
        expect(store.getState().runtimeState.realIdentity.role).toBe("owner");
    });
});
