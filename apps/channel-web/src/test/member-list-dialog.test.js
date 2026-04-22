import { describe, expect, it } from "vitest";
import { createStore } from "../shared/state/store.js";
import { mountMemberListDialogBlock } from "../blocks/member-list-dialog/index.js";

describe("member list dialog", () => {
    it("renders the current community roster when open", () => {
        const root = document.createElement("div");
        document.body.append(root);

        const store = createStore();
        store.dispatch({ type: "member-list/open" });

        const actions = {
            closeOverlay() {}
        };

        const block = mountMemberListDialogBlock({ root, store, actions });
        block.render();

        expect(root.textContent).toContain("频道成员");
        expect(root.textContent).toContain("雯子");
        expect(root.textContent).toContain("咪咪");
        expect(root.textContent).toContain("Trytry");
        expect(root.querySelector(".member-list-dialog")?.getAttribute("aria-hidden")).toBe("false");

        root.remove();
    });

    it("marks the dialog hidden when closed", () => {
        const root = document.createElement("div");
        document.body.append(root);

        const store = createStore();
        const actions = {
            closeOverlay() {}
        };

        const block = mountMemberListDialogBlock({ root, store, actions });
        block.render();

        const dialog = root.querySelector(".member-list-dialog");
        expect(dialog?.classList.contains("is-open")).toBe(false);
        expect(dialog?.getAttribute("aria-hidden")).toBe("true");

        root.remove();
    });
});
