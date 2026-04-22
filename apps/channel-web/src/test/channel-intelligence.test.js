import { describe, expect, it, vi } from "vitest";
import { mountChannelIntelligenceBlock } from "../blocks/channel-intelligence/index.js";
import { createStore } from "../shared/state/store.js";

describe("channel intelligence block", () => {
    it("preserves theme input focus across rerenders", () => {
        const root = document.createElement("div");
        document.body.append(root);
        const store = createStore();
        const actions = {
            openOverlay: vi.fn(),
            closeOverlay: vi.fn(),
            toggleRoundGodPicker: vi.fn(),
            assignRoundGod: vi.fn(),
            toggleRoundThemeEditor: vi.fn(),
            cancelRoundThemeEditing: vi.fn(),
            setRoundThemeDraft: vi.fn(),
            saveRoundTheme: vi.fn()
        };

        store.dispatch({
            type: "channel-intelligence/set-field",
            payload: {
                open: true,
                themeEditorOpen: true,
                draftTheme: "A"
            }
        });

        const block = mountChannelIntelligenceBlock({ root, store, actions });
        block.render();

        const themeInput = root.querySelector("[data-channel-intelligence-ref='theme-input']");
        themeInput.focus();
        themeInput.value = "AI";
        themeInput.setSelectionRange(2, 2);

        store.dispatch({
            type: "channel-intelligence/set-field",
            payload: { draftTheme: "AI" }
        });
        block.render();

        const nextThemeInput = root.querySelector("[data-channel-intelligence-ref='theme-input']");
        expect(document.activeElement).toBe(nextThemeInput);
        expect(nextThemeInput.value).toBe("AI");
        expect(nextThemeInput.selectionStart).toBe(2);
        expect(nextThemeInput.selectionEnd).toBe(2);

        root.remove();
    });
});
