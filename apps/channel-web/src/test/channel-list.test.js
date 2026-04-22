import { describe, expect, it, vi } from "vitest";
import { mountChannelListPage } from "../screens/channel-list/index.js";

describe("channel list page", () => {
    it("renders demo and real channel entry points together", async () => {
        const root = document.createElement("div");
        const dataService = {
            listPublicChannels: vi.fn().mockResolvedValue([{
                slug: "live-channel",
                name: "品运一家人",
                description: "真实频道",
                discussionCount: 12,
                badge: "品"
            }])
        };

        await mountChannelListPage({ root, dataService });

        expect(root.textContent).toContain("先试玩完整流程");
        expect(root.textContent).toContain("进入真实频道");
        expect(root.querySelector('a[href="?view=demo"]')).not.toBeNull();
        expect(root.querySelector('a[href="?channel=live-channel"]')).not.toBeNull();
    });
});
