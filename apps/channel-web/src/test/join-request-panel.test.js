import { describe, expect, it, vi } from "vitest";
import { mountJoinRequestPanelBlock } from "../blocks/join-request-panel/index.js";
import { createStore } from "../shared/state/store.js";

describe("join request panel input stability", () => {
    it("keeps the same textarea node when draft message changes", () => {
        const root = document.createElement("div");
        document.body.append(root);
        const store = createStore();
        const actions = {
            setMembershipField: vi.fn(),
            openAuthGate: vi.fn(),
            submitJoinRequest: vi.fn()
        };

        store.dispatch({
            type: "auth/set-state",
            payload: {
                status: "authenticated",
                user: { email: "member@example.com" }
            }
        });
        store.dispatch({
            type: "membership/set-state",
            payload: {
                status: "rejected"
            }
        });

        const block = mountJoinRequestPanelBlock({ root, store, actions });
        block.render();

        const before = root.querySelector("[data-join-request-ref='message']");
        expect(before).toBeTruthy();

        store.dispatch({
            type: "membership/set-field",
            payload: {
                draftMessage: "我想加入"
            }
        });
        block.render();

        const after = root.querySelector("[data-join-request-ref='message']");
        expect(after).toBe(before);
        expect(after.value).toBe("我想加入");

        root.remove();
    });

    it("stays visible for guests even if stale membership state says approved", () => {
        const root = document.createElement("div");
        document.body.append(root);
        const store = createStore();
        const actions = {
            setMembershipField: vi.fn(),
            openAuthGate: vi.fn(),
            submitJoinRequest: vi.fn()
        };

        store.dispatch({
            type: "runtime/preview-ready",
            payload: {
                channel: { id: "channel-1", slug: "soulmap", name: "Soulmap" }
            }
        });
        store.dispatch({
            type: "auth/set-state",
            payload: {
                status: "guest",
                user: null,
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

        const block = mountJoinRequestPanelBlock({ root, store, actions });
        block.render();

        const loginButton = root.querySelector("[data-join-request-action='login']");
        expect(loginButton).toBeTruthy();
        expect(root.textContent).toContain("邮箱登录");

        root.remove();
    });
});
