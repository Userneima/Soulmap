import { describe, expect, it } from "vitest";
import { createStore } from "../shared/state/store.js";
import { mountSearchDialogBlock } from "../blocks/search-dialog/index.js";

describe("search dialog", () => {
    it("locks page scrolling while the dialog is open", () => {
        const root = document.createElement("div");
        document.body.appendChild(root);
        const store = createStore();
        const block = mountSearchDialogBlock({
            root,
            store,
            actions: {
                closeOverlay() {},
                openOverlay() {},
                setSearchDialogField() {}
            }
        });

        store.dispatch({ type: "search-dialog/open" });
        block.render();

        expect(document.body.classList.contains("app-scroll-locked")).toBe(true);
        expect(document.documentElement.classList.contains("app-scroll-locked")).toBe(true);

        store.dispatch({ type: "search-dialog/close" });
        block.render();

        expect(document.body.classList.contains("app-scroll-locked")).toBe(false);
        expect(document.documentElement.classList.contains("app-scroll-locked")).toBe(false);

        root.remove();
    });
});
