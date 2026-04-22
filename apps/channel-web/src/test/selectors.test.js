import { describe, expect, it } from "vitest";
import { createInitialState } from "../shared/state/store.js";
import { selectComposerPanelVM } from "../blocks/composer-panel/selectors.js";
import { selectFeedListVM } from "../blocks/feed-list/selectors.js";
import { selectCommentDrawerVM } from "../blocks/comment-drawer/selectors.js";
import { selectAuthGateVM } from "../blocks/auth-gate/selectors.js";
import { selectJoinRequestPanelVM } from "../blocks/join-request-panel/selectors.js";
import { selectNotificationCenterVM } from "../blocks/notification-center/selectors.js";
import { selectChannelMenuDialogVM } from "../blocks/channel-menu-dialog/selectors.js";
import { selectChannelIntelligenceVM } from "../blocks/channel-intelligence/selectors.js";

describe("channel view model selectors", () => {
    it("builds anonymous composer vm for approved members", () => {
        const state = createInitialState();
        state.authState.status = "authenticated";
        state.membershipState.status = "approved";
        state.composerState.draftText = "匿名内容";
        state.composerState.images = [{ id: 1, name: "cover.png", url: "blob:test" }];
        state.composerState.anonymousMode = true;
        state.composerState.autoRotate = true;
        state.composerState.aiImageReshape = true;

        const vm = selectComposerPanelVM(state);

        expect(vm.canCompose).toBe(true);
        expect(vm.placeholder).toContain("愿望");
        expect(vm.submitLabel).toBe("发布愿望");
        expect(vm.canSubmit).toBe(true);
        expect(vm.images).toHaveLength(1);
        expect(vm.autoRotate).toBe(true);
        expect(vm.aiImageReshape).toBe(true);
    });

    it("requires mention target during delivery stage", () => {
        const state = createInitialState();
        state.authState.status = "authenticated";
        state.membershipState.status = "approved";
        state.roundState.activeStage = "delivery";
        state.composerState.draftText = "我已经准备好了";

        const vm = selectComposerPanelVM(state);

        expect(vm.stageInfo.label).toBe("交付");
        expect(vm.anonymousLocked).toBe(true);
        expect(vm.canSubmit).toBe(false);
    });

    it("hydrates delivery target from the selected wish", () => {
        const state = createInitialState();
        state.authState.status = "authenticated";
        state.membershipState.status = "approved";
        state.roundState.activeStage = "delivery";
        state.roundState.claimSelection = {
            postId: "wish-1",
            authorName: "白榆",
            authorAvatar: "alias-avatar",
            previewText: "帮我把知识目录整理一下"
        };
        state.composerState.draftText = "我来完成这条";

        const vm = selectComposerPanelVM(state);

        expect(vm.mentionTarget?.name).toBe("白榆");
        expect(vm.canSubmit).toBe(true);
    });

    it("allows audio-only drafts to submit and summarizes them correctly", () => {
        const state = createInitialState();
        state.authState.status = "authenticated";
        state.membershipState.status = "approved";
        state.roundState.activeStage = "guess";
        state.composerState.mentionTarget = {
            name: "健",
            avatar: "alias-avatar"
        };
        state.composerState.audioDraft = {
            id: 1,
            kind: "audio",
            name: "语音 1",
            url: "blob:voice"
        };

        const vm = selectComposerPanelVM(state);

        expect(vm.canSubmit).toBe(true);
        expect(vm.collapsedSummary).toBe("已录 1 条语音");
    });

    it("hydrates guess target and mention title during guess stage", () => {
        const state = createInitialState();
        state.authState.status = "authenticated";
        state.membershipState.status = "approved";
        state.roundState.activeStage = "guess";
        state.roundState.guessSelection = {
            name: "雯子",
            avatar: "alias-avatar"
        };
        state.composerState.draftText = "我觉得就是你";

        const vm = selectComposerPanelVM(state);

        expect(vm.mentionTitle).toBe("你猜的是谁");
        expect(vm.mentionTarget?.name).toBe("雯子");
        expect(vm.hideInlineComposer).toBe(true);
        expect(vm.canSubmit).toBe(true);
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

    it("exposes claim actions when browsing wishes in claim stage", () => {
        const state = createInitialState();
        state.authState.status = "authenticated";
        state.authState.user = { id: "user-1" };
        state.membershipState.status = "approved";
        state.roundState.activeStage = "claim";
        state.feedState.status = "ready";
        state.feedState.items = [{
            id: "wish-1",
            board: "wish",
            authorName: "白榆",
            authorAvatar: "alias-avatar",
            authorUserId: "user-2",
            text: "希望有人帮我整理目录",
            comments: []
        }];

        const vm = selectFeedListVM(state);
        expect(vm.items[0].canClaimWish).toBe(true);
        expect(vm.items[0].claimActionLabel).toBe("选这个愿望");
    });

    it("renders member candidates instead of posts during guess stage", () => {
        const state = createInitialState();
        state.authState.status = "authenticated";
        state.membershipState.status = "approved";
        state.roundState.activeStage = "guess";
        state.roundState.guessExcludedNames = ["苹果"];
        state.runtimeState.realIdentity.name = "健";
        state.composerState.mentionTarget = {
            name: "雯子",
            avatar: "alias-avatar"
        };
        state.composerState.draftText = "";
        state.feedState.status = "ready";
        state.feedState.items = [{
            id: "delivery-1",
            board: "delivery",
            authorName: "白榆",
            text: "@健\n这周结课作业太多了，差点忘了讲故事。",
            comments: []
        }];

        const vm = selectFeedListVM(state);
        expect(vm.mode).toBe("guess-picker");
        expect(vm.candidates.some((candidate) => candidate.name === "健")).toBe(false);
        expect(vm.candidates.find((candidate) => candidate.name === "雯子")?.isSelected).toBe(true);
        expect(vm.candidates.at(-1)?.name).toBe("苹果");
        expect(vm.candidates.at(-1)?.isExcluded).toBe(true);
        expect(vm.guessDraftText).toBe("");
        expect(vm.canSubmitGuess).toBe(true);
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

    it("hides deleted posts from the main feed vm", () => {
        const state = createInitialState();
        state.authState.status = "authenticated";
        state.authState.user = { id: "user-1" };
        state.membershipState.status = "approved";
        state.feedState.status = "ready";
        state.feedState.items = [{
            id: "1",
            authorName: "云栖",
            authorUserId: "user-1",
            text: "该帖子已删除",
            isDeleted: true,
            deletedLabel: "该帖子已删除",
            comments: []
        }];

        const vm = selectFeedListVM(state);
        expect(vm.items).toHaveLength(0);
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

    it("excludes deleted placeholders from in-channel search", () => {
        const state = createInitialState();
        state.feedState.status = "ready";
        state.feedState.searchQuery = "已删除";
        state.feedState.items = [
            {
                id: "1",
                authorName: "云栖",
                text: "该帖子已删除",
                isDeleted: true,
                deletedLabel: "该帖子已删除",
                comments: []
            },
            {
                id: "2",
                authorName: "海屿",
                text: "正常内容",
                comments: [{ id: "c1", text: "该评论已删除", isDeleted: true }]
            }
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

    it("sorts hot comments by likes and exposes liked and reply state", () => {
        const state = createInitialState();
        state.authState.status = "authenticated";
        state.membershipState.status = "approved";
        state.overlayState.comments.open = true;
        state.overlayState.comments.status = "ready";
        state.overlayState.comments.sort = "hot";
        state.overlayState.comments.likedCommentIds = ["b"];
        state.overlayState.comments.replyTarget = { id: "b", authorName: "北桥" };
        state.overlayState.comments.post = {
            id: "post-1",
            comments: [
                { id: "a", text: "第一条", likes: 1 },
                { id: "b", text: "第二条", likes: 3 }
            ]
        };

        const vm = selectCommentDrawerVM(state);
        expect(vm.comments[0].id).toBe("b");
        expect(vm.comments[0].isLiked).toBe(true);
        expect(vm.comments[0].floorLabel).toBe("2L");
        expect(vm.replyTarget.authorName).toBe("北桥");
    });

    it("renders reply comments as threaded items under their parent", () => {
        const state = createInitialState();
        state.authState.status = "authenticated";
        state.membershipState.status = "approved";
        state.overlayState.comments.open = true;
        state.overlayState.comments.status = "ready";
        state.overlayState.comments.sort = "latest";
        state.overlayState.comments.post = {
            id: "post-1",
            comments: [
                { id: "a", authorName: "海屿", text: "第一条", createdAt: "2026-04-20T10:00:00.000Z", likes: 0, parentCommentId: null },
                { id: "b", authorName: "章鱼烧", text: "回复内容", createdAt: "2026-04-20T11:00:00.000Z", likes: 0, parentCommentId: "a" },
                { id: "c", authorName: "北桥", text: "另一条根评论", createdAt: "2026-04-20T12:00:00.000Z", likes: 2, parentCommentId: null }
            ]
        };

        const vm = selectCommentDrawerVM(state);
        expect(vm.comments.map((comment) => comment.id)).toEqual(["c", "a", "b"]);
        expect(vm.comments[2].replyDepth).toBe(1);
        expect(vm.comments[2].replyTargetAuthorName).toBe("海屿");
        expect(vm.comments[2].replyTargetPreview).toBe("第一条");
    });

    it("builds comment-thread summaries for the drawer", () => {
        const state = createInitialState();
        state.authState.status = "authenticated";
        state.membershipState.status = "approved";
        state.overlayState.comments.open = true;
        state.overlayState.comments.status = "ready";
        state.overlayState.comments.post = {
            id: "post-1",
            text: "我们要不要把频道归档和知识库目录合并处理？",
            comments: [
                { id: "a", authorName: "海屿", text: "我支持先统一知识库目录，不然检索路径会继续分叉。", likes: 3 },
                { id: "b", authorName: "北桥", text: "担心一次合并太重，迁移成本和旧链接兼容要先想清楚。", likes: 2 }
            ]
        };

        const vm = selectCommentDrawerVM(state);
        expect(vm.threadSummary).toBeTruthy();
        expect(vm.threadSummary.topicLine).toContain("讨论");
        expect(vm.threadSummary.unresolvedLine).toContain("还没解决");
    });

    it("does not render single-post summaries without AI summary data", () => {
        const state = createInitialState();
        state.authState.status = "authenticated";
        state.membershipState.status = "approved";
        state.overlayState.comments.open = true;
        state.overlayState.comments.status = "ready";
        state.overlayState.comments.post = {
            id: "post-1",
            board: "delivery",
            text: "这是一条很长很长的帖子内容，用来验证摘要不再显示在 feed 外层，而是在点击评论或者全文进入内层以后才出现。".repeat(3),
            comments: []
        };

        const vm = selectCommentDrawerVM(state);
        expect(vm.postSummaryLines).toHaveLength(0);
    });

    it("does not build single-post summaries for wish posts", () => {
        const state = createInitialState();
        state.authState.status = "authenticated";
        state.membershipState.status = "approved";
        state.overlayState.comments.open = true;
        state.overlayState.comments.status = "ready";
        state.overlayState.comments.post = {
            id: "post-1",
            board: "wish",
            text: "这是一条很长很长的许愿内容，但在许愿阶段不应该额外显示单帖摘要。".repeat(3),
            comments: []
        };

        const vm = selectCommentDrawerVM(state);
        expect(vm.postSummaryLines).toHaveLength(0);
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

    it("turns deleted post drawer into read-only mode", () => {
        const state = createInitialState();
        state.authState.status = "authenticated";
        state.authState.user = { id: "user-1" };
        state.membershipState.status = "approved";
        state.overlayState.comments.open = true;
        state.overlayState.comments.status = "ready";
        state.overlayState.comments.post = {
            id: "post-1",
            authorUserId: "user-2",
            text: "该帖子已删除",
            isDeleted: true,
            deletedLabel: "该帖子已删除",
            comments: []
        };

        const vm = selectCommentDrawerVM(state);
        expect(vm.canInteract).toBe(false);
        expect(vm.copyEnabled).toBe(false);
        expect(vm.accessHint).toContain("原帖已删除");
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

        expect(notificationVm.panelStyle).toContain("top:154px");
        expect(notificationVm.panelStyle).toContain("left:");
        expect(menuVm.panelStyle).toContain("top:160px");
        expect(menuVm.panelStyle).toContain("left:");
    });

    it("builds weekly digest vm from recent feed activity", () => {
        const state = createInitialState();
        state.overlayState.channelIntelligence.open = true;
        state.feedState.items = [
            {
                id: "post-1",
                authorName: "云栖",
                createdAt: "2026-04-20T10:00:00.000Z",
                timeLabel: "1天前",
                text: "继续讨论频道归档、知识库结构和检索入口。",
                likes: 4,
                comments: [
                    { id: "c1", authorName: "海屿", text: "为什么旧链接兼容还没有方案？", likes: 1 }
                ]
            },
            {
                id: "post-2",
                authorName: "海屿",
                createdAt: "2026-04-19T10:00:00.000Z",
                timeLabel: "2天前",
                text: "知识库标签结构要不要和频道 board 一一对应？",
                likes: 2,
                comments: []
            }
        ];

        const vm = selectChannelIntelligenceVM(state);
        expect(vm.status).toBe("ready");
        expect(vm.open).toBe(true);
        expect(vm.topThemes.length).toBeGreaterThan(0);
        expect(vm.topThemes[0].label.length).toBeGreaterThan(6);
        expect(vm.topThemes.some((item) => item.label.includes("知识库") || item.label.includes("归档"))).toBe(true);
        expect(vm.representativePosts.length).toBeGreaterThan(0);
        expect(vm.compactHint).toContain("点击查看");
        expect(vm.currentStageLabel).toBe("许愿");
    });

    it("builds round task summary for channel intelligence", () => {
        const state = createInitialState();
        state.roundState.activeStage = "delivery";

        const vm = selectChannelIntelligenceVM(state);
        expect(vm.currentStageLabel).toBe("交付");
        expect(vm.currentTaskStatus).toBe("待完成");
        expect(vm.currentTaskLabel).toContain("To");
    });

    it("marks delivery stage as done when the current user already posted in delivery", () => {
        const state = createInitialState();
        state.roundState.activeStage = "delivery";
        state.authState.status = "authenticated";
        state.authState.user = { id: "user-1" };
        state.feedState.items = [
            {
                id: "delivery-1",
                board: "delivery",
                authorUserId: "user-1",
                authorName: "白榆",
                authorAvatar: "avatar",
                isDeleted: false,
                comments: []
            }
        ];

        const vm = selectChannelIntelligenceVM(state);
        expect(vm.currentTaskStatus).toBe("已完成");
    });

    it("builds reveal result and reveal pairs for channel intelligence", () => {
        const state = createInitialState();
        state.roundState.activeStage = "reveal";
        state.runtimeState.realIdentity = {
            ...state.runtimeState.realIdentity,
            name: "章鱼烧",
            avatar: "octopus-avatar",
            role: "owner"
        };
        state.roundState.guessSelection = {
            name: "海屿",
            avatar: "haiyu-avatar"
        };
        state.roundState.revealMap = {
            章鱼烧: {
                member: {
                    name: "章鱼烧",
                    avatar: "octopus-avatar"
                },
                angel: {
                    name: "海屿",
                    avatar: "haiyu-avatar"
                }
            }
        };

        const vm = selectChannelIntelligenceVM(state);
        expect(vm.currentTaskStatus).toBe("已完成");
        expect(vm.revealPairs).toHaveLength(1);
        expect(vm.revealResult?.actualName).toBe("海屿");
        expect(vm.revealResult?.isCorrect).toBe(true);
    });
});
