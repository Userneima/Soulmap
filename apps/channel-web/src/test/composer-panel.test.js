import { beforeEach, describe, expect, it, vi } from "vitest";
import { mountComposerPanelBlock } from "../blocks/composer-panel/index.js";
import { createAppActions } from "../features/app-actions.js";
import { createStore } from "../shared/state/store.js";

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
    likePost: vi.fn(),
    publishPost: vi.fn(),
    publishComment: vi.fn(),
    updateIdentity: vi.fn(),
    updateChannel: vi.fn(),
    saveGuessSelection: vi.fn(),
    clearGuessSelection: vi.fn(),
    updateChannelRoundState: vi.fn()
});

describe("composer panel interactions", () => {
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
            payload: {
                channel: { id: "channel-1", slug: "channel", name: "频道" },
                realIdentity: { id: "identity-1", name: "章鱼烧", avatar: "avatar", meta: "当前真实身份", role: "member" },
                anonymousProfiles: [{ id: "alias-1", key: "slot-baiyu", name: "白榆", avatar: "alias" }],
                activeAliasKey: "slot-baiyu"
            }
        });

        root = document.createElement("div");
        document.body.appendChild(root);
        block = mountComposerPanelBlock({ root, store, actions });
    });

    it("hides the inline composer during guess stage", () => {
        store.dispatch({
            type: "round/set-stage",
            payload: { stage: "guess", forceAnonymous: false }
        });
        block.render();

        expect(root.querySelector(".composer-panel--hidden")).toBeTruthy();
        expect(root.querySelector("[data-composer-action='toggle-anonymous']")).toBeNull();
    });

    it("does not render the AI disclosure button during guess stage", () => {
        store.dispatch({
            type: "round/set-stage",
            payload: { stage: "guess", forceAnonymous: false }
        });
        block.render();
        expect(root.querySelector("[data-composer-action='toggle-ai-disclosure']")).toBeNull();
    });

    it("opens mention menu and selects a target member", () => {
        store.dispatch({
            type: "round/set-stage",
            payload: { stage: "delivery", forceAnonymous: true }
        });
        actions.expandComposer();
        block.render();

        const mentionToggle = root.querySelector("[data-composer-action='toggle-mention']");
        expect(mentionToggle).toBeTruthy();

        mentionToggle.click();
        block.render();

        const mentionOption = root.querySelector("[data-mention-member-name='雯子']");
        expect(mentionOption).toBeTruthy();

        mentionOption.click();
        block.render();

        expect(store.getState().composerState.mentionTarget?.name).toBe("雯子");
        expect(root.textContent).toContain("To");
        expect(root.textContent).toContain("雯子");
    });
});
