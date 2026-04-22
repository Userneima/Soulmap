import { describe, expect, it, vi } from "vitest";
import { mountAuthGateBlock } from "../blocks/auth-gate/index.js";
import { createStore } from "../shared/state/store.js";

describe("auth gate block", () => {
    it("renders register mode with display name field and mode switch", () => {
        const root = document.createElement("div");
        document.body.append(root);
        const store = createStore();
        const actions = {
            closeOverlay: vi.fn(),
            openAuthGate: vi.fn(),
            submitAuthFlow: vi.fn(),
            setAuthField: vi.fn()
        };

        store.dispatch({
            type: "auth-gate/open",
            payload: { mode: "register" }
        });

        const block = mountAuthGateBlock({ root, store, actions });
        block.render();

        expect(root.querySelector("[data-auth-gate-ref='display-name']")).not.toBeNull();
        expect(root.querySelector("[data-auth-gate-action='switch-login']")).not.toBeNull();
        expect(root.textContent).toContain("注册后继续");

        root.querySelector("[data-auth-gate-action='switch-login']").click();
        expect(actions.openAuthGate).toHaveBeenCalledWith("login");

        root.remove();
    });

    it("preserves email input focus across rerenders", () => {
        const root = document.createElement("div");
        document.body.append(root);
        const store = createStore();
        const actions = {
            closeOverlay: vi.fn(),
            openAuthGate: vi.fn(),
            submitAuthFlow: vi.fn(),
            setAuthField: vi.fn()
        };

        store.dispatch({
            type: "auth-gate/open",
            payload: { mode: "upgrade" }
        });
        store.dispatch({
            type: "auth/set-state",
            payload: {
                status: "upgrading_legacy_anonymous",
                email: "w@example.com"
            }
        });

        const block = mountAuthGateBlock({ root, store, actions });
        block.render();

        const emailInput = root.querySelector("[data-auth-gate-ref='email']");
        emailInput.focus();
        emailInput.value = "wa@example.com";
        store.dispatch({
            type: "auth/set-field",
            payload: { email: "wa@example.com" }
        });
        block.render();

        const nextEmailInput = root.querySelector("[data-auth-gate-ref='email']");
        expect(document.activeElement).toBe(nextEmailInput);
        expect(nextEmailInput.value).toBe("wa@example.com");

        root.remove();
    });
});
