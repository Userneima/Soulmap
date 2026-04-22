import { describe, expect, it, vi } from "vitest";
import { createStore } from "../shared/state/store.js";
import { mountChannelHeroBlock } from "../blocks/channel-hero/index.js";

describe("channel hero member entry", () => {
    it("opens member list when clicking the member count", () => {
        const root = document.createElement("div");
        document.body.append(root);

        const store = createStore();
        store.dispatch({
            type: "runtime/preview-ready",
            payload: {
                channel: {
                    id: "channel-1",
                    slug: "channel",
                    name: "品运一家人",
                    logoUrl: "logo"
                }
            }
        });

        const actions = {
            requestSearchFocus: vi.fn(),
            openOverlay: vi.fn()
        };

        const block = mountChannelHeroBlock({ root, store, actions });
        block.render();

        const memberButton = root.querySelector("[data-channel-hero-action='members']");
        expect(memberButton).toBeTruthy();

        memberButton.click();

        expect(actions.openOverlay).toHaveBeenCalledWith("member-list");

        root.remove();
    });
});
