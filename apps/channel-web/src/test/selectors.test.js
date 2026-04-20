import { describe, expect, it } from "vitest";
import { createInitialState } from "../shared/state/store.js";
import { selectComposerPanelVM } from "../blocks/composer-panel/selectors.js";
import { selectFeedListVM } from "../blocks/feed-list/selectors.js";
import { selectCommentDrawerVM } from "../blocks/comment-drawer/selectors.js";
import { selectAuthGateVM } from "../blocks/auth-gate/selectors.js";
import { selectJoinRequestPanelVM } from "../blocks/join-request-panel/selectors.js";
import { selectNotificationCenterVM } from "../blocks/notification-center/selectors.js";
import { selectChannelMenuDialogVM } from "../blocks/channel-menu-dialog/selectors.js";

describe("channel view model selectors", () => {
    it("builds anonymous composer vm for approved members", () => {
        const state = createInitialState();
        state.authState.status = "authenticated";
        state.membershipState.status = "approved";
        state.composerState.draftText = "匿名内容";
        state.composerState.images = [{ id: 1, name: "cover.png", url: "blob:test" }];
        state.composerState.anonymousMode = true;
        state.composerState.autoRotate = true;

        const vm = selectComposerPanelVM(state);

        expect(vm.canCompose).toBe(true);
        expect(vm.placeholder).toContain("匿名");
        expect(vm.submitLabel).toBe("匿名发表");
        expect(vm.canSubmit).toBe(true);
        expect(vm.images).toHaveLength(1);
        expect(vm.autoRotate).toBe(true);
    });

    it("maps guest viewer into composer gate vm", () => {
        const state = createInitialState();
        state.authState.status = "guest";
        state.membershipState.status = "guest";

        const vm = selectComposerPanelVM(state);

        expect(vm.canCompose).toBe(false);
        expect(vm.gate.primaryAction).toBe("open-auth-login");
    });

    it("maps feed state into empty and ready states", () => {
        const emptyState = createInitialState();
        emptyState.feedState.status = "empty";
        expect(selectFeedListVM(emptyState).status).toBe("empty");

        const readyState = createInitialState();
        readyState.feedState.status = "ready";
        readyState.feedState.items = [{ id: "1", comments: [] }];
        expect(selectFeedListVM(readyState).items).toHaveLength(1);
    });

    it("marks liked posts in feed vm", () => {
        const state = createInitialState();
        state.feedState.status = "ready";
        state.feedState.items = [{ id: "1", authorName: "云栖", text: "test", comments: [], likes: 3 }];
        state.feedState.likedPostIds = ["1"];

        const vm = selectFeedListVM(state);
        expect(vm.items[0].isLiked).toBe(true);
    });

    it("adds full entry metadata for long posts", () => {
        const state = createInitialState();
        state.feedState.status = "ready";
        state.feedState.items = [{
            id: "1",
            authorName: "云栖",
            text: "这是一条很长很长的帖子内容，用来验证帖子卡片会不会恢复成预览态并出现全文入口。".repeat(3),
            comments: []
        }];

        const vm = selectFeedListVM(state);
        expect(vm.items[0].showFullEntry).toBe(true);
        expect(vm.items[0].previewText.endsWith("...")).toBe(true);
    });

    it("filters feed items by in-channel search query", () => {
        const state = createInitialState();
        state.feedState.status = "ready";
        state.feedState.searchQuery = "苹果";
        state.feedState.items = [
            { id: "1", authorName: "云栖", text: "讨论苹果发布会", comments: [] },
            { id: "2", authorName: "海屿", text: "聊聊协作节奏", comments: [] }
        ];

        const vm = selectFeedListVM(state);
        expect(vm.items).toHaveLength(1);
        expect(vm.items[0].id).toBe("1");
    });

    it("returns search-empty when no posts match the current query", () => {
        const state = createInitialState();
        state.feedState.status = "ready";
        state.feedState.searchQuery = "不存在";
        state.feedState.items = [
            { id: "1", authorName: "云栖", text: "讨论苹果发布会", comments: [] }
        ];

        const vm = selectFeedListVM(state);
        expect(vm.status).toBe("search-empty");
        expect(vm.items).toHaveLength(0);
    });

    it("sorts comments and disables sending for guests", () => {
        const state = createInitialState();
        state.authState.status = "guest";
        state.overlayState.comments.open = true;
        state.overlayState.comments.status = "ready";
        state.overlayState.comments.sort = "latest";
        state.overlayState.comments.post = {
            id: "post-1",
            comments: [
                { id: "a", text: "早一点" },
                { id: "b", text: "晚一点" }
            ]
        };

        const vm = selectCommentDrawerVM(state);
        expect(vm.comments[0].id).toBe("b");
        expect(vm.canSend).toBe(false);
        expect(vm.accessHint).toContain("登录");
    });

    it("exposes comment drawer source and focus target", () => {
        const state = createInitialState();
        state.overlayState.comments.open = true;
        state.overlayState.comments.status = "ready";
        state.overlayState.comments.openSource = "comments";
        state.overlayState.comments.initialFocusTarget = "comment-input";
        state.overlayState.comments.post = { id: "post-1", comments: [] };

        const vm = selectCommentDrawerVM(state);
        expect(vm.openSource).toBe("comments");
        expect(vm.initialFocusTarget).toBe("comment-input");
    });

    it("keeps auth gate closed until login is explicitly opened", () => {
        const state = createInitialState();
        state.authState.status = "upgrading_legacy_anonymous";

        const vm = selectAuthGateVM(state);
        expect(vm.open).toBe(false);
        expect(vm.mode).toBe("login");
    });

    it("builds join request vm for authenticated unapproved member", () => {
        const state = createInitialState();
        state.runtimeState.status = "preview";
        state.authState.status = "authenticated";
        state.membershipState.status = "guest";

        const vm = selectJoinRequestPanelVM(state);
        expect(vm.visible).toBe(true);
        expect(vm.canSubmit).toBe(true);
        expect(vm.primaryLabel).toContain("提交");
    });

    it("computes anchored floating panel styles from trigger coordinates", () => {
        const state = createInitialState();
        state.overlayState.notificationCenter.open = true;
        state.overlayState.notificationCenter.anchorX = 900;
        state.overlayState.notificationCenter.anchorY = 140;
        state.overlayState.channelMenu.open = true;
        state.overlayState.channelMenu.anchorX = 960;
        state.overlayState.channelMenu.anchorY = 146;

        const notificationVm = selectNotificationCenterVM(state);
        const menuVm = selectChannelMenuDialogVM(state);

        expect(notificationVm.panelStyle).toContain("top:140px");
        expect(notificationVm.panelStyle).toContain("left:");
        expect(menuVm.panelStyle).toContain("top:146px");
        expect(menuVm.panelStyle).toContain("left:");
    });
});
