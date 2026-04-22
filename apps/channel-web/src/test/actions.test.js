import { beforeEach, describe, expect, it, vi } from "vitest";
import { createStore } from "../shared/state/store.js";
import { createAppActions } from "../features/app-actions.js";

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
    registerWithPassword: vi.fn(),
    upgradeLegacyAnonymousUser: vi.fn(),
    submitJoinRequest: vi.fn(),
    approveJoinRequest: vi.fn(),
    rejectJoinRequest: vi.fn(),
    createChannel: vi.fn(),
    listPosts: vi.fn(),
    getPost: vi.fn(),
    likePost: vi.fn(),
    likeComment: vi.fn(),
    deletePost: vi.fn(),
    deleteComment: vi.fn(),
    publishPost: vi.fn(),
    publishComment: vi.fn(),
    updateIdentity: vi.fn(),
    updateChannel: vi.fn(),
    updateChannelRoundState: vi.fn(),
    saveClaimSelection: vi.fn(),
    clearClaimSelection: vi.fn(),
    saveGuessSelection: vi.fn(),
    clearGuessSelection: vi.fn()
});

const approvedRuntime = {
    channel: {
        id: "channel-1",
        slug: "channel",
        name: "频道",
        previewVisibility: "public",
        joinPolicy: "approval_required",
        currentRoundTheme: "旧主题",
        currentRoundGodProfile: {
            name: "管理员",
            avatar: "avatar"
        }
    },
    realIdentity: { id: "identity-1", name: "管理员", avatar: "avatar", meta: "当前真实身份", role: "owner" },
    anonymousProfiles: [{ id: "alias-1", key: "slot-baiyu", name: "白榆", avatar: "alias" }]
};

const seedApprovedViewer = (store) => {
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
        payload: approvedRuntime
    });
};

describe("channel feature actions", () => {
    let store;
    let dataService;
    let actions;

    beforeEach(() => {
        window.history.replaceState({}, "", "/");
        store = createStore();
        dataService = createMockDataService();
        dataService.getChannelShell.mockReturnValue(approvedRuntime.channel);
        dataService.getCachedChannelBootstrap.mockResolvedValue(null);
        actions = createAppActions({ store, dataService });
    });

    it("initializes public preview, auth state and approved member runtime", async () => {
        dataService.loadChannelBootstrap.mockResolvedValue({
            channel: approvedRuntime.channel,
            auth: {
                user: { id: "user-1", email: "owner@example.com" },
                isAnonymous: false
            },
            membership: {
                status: "approved",
                joinRequest: null,
                reviewItems: [],
                role: "owner"
            },
            memberRuntime: approvedRuntime
        });
        dataService.listPosts.mockResolvedValue([{ id: "post-1", comments: [] }]);

        await actions.initializeChannelRuntime();

        const state = store.getState();
        expect(state.runtimeState.status).toBe("ready");
        expect(state.runtimeState.phase).toBe("ready");
        expect(state.authState.status).toBe("authenticated");
        expect(state.membershipState.status).toBe("approved");
        expect(state.roundState.theme).toBe("旧主题");
        expect(state.roundState.godProfile).toEqual({
            name: "管理员",
            avatar: "avatar"
        });
        expect(state.feedState.items).toHaveLength(1);
    });

    it("treats legacy anonymous session as guest preview in demo mode", async () => {
        dataService.loadChannelBootstrap.mockResolvedValue({
            channel: approvedRuntime.channel,
            auth: {
                user: { id: "anon-user-1" },
                isAnonymous: true
            },
            membership: {
                status: "guest",
                joinRequest: null,
                reviewItems: [],
                role: null
            },
            memberRuntime: null
        });
        dataService.listPosts.mockResolvedValue([{ id: "post-1", comments: [] }]);

        await actions.initializeChannelRuntime();

        const state = store.getState();
        expect(state.authState.status).toBe("guest");
        expect(state.membershipState.status).toBe("guest");
        expect(state.overlayState.authGate.open).toBe(false);
        expect(state.runtimeState.status).toBe("preview");
    });

    it("opens auth gate instead of posting for guests", async () => {
        store.dispatch({
            type: "auth/set-state",
            payload: {
                status: "guest",
                user: null,
                isAnonymous: false
            }
        });
        store.dispatch({
            type: "composer/set-field",
            payload: {
                draftText: "guest draft"
            }
        });

        await actions.submitPost();

        const state = store.getState();
        expect(state.overlayState.authGate.open).toBe(true);
        expect(state.overlayState.authGate.mode).toBe("login");
        expect(dataService.publishPost).not.toHaveBeenCalled();
    });

    it("keeps composer draft when publish fails for approved members", async () => {
        seedApprovedViewer(store);
        store.dispatch({
            type: "composer/set-field",
            payload: {
                draftText: "draft post"
            }
        });
        dataService.publishPost.mockRejectedValue(new Error("publish failed"));

        await actions.submitPost();

        expect(store.getState().composerState.draftText).toBe("draft post");
        expect(store.getState().composerState.submitStatus).toBe("idle");
    });

    it("submits audio clips as post media", async () => {
        seedApprovedViewer(store);
        store.dispatch({
            type: "round/set-stage",
            payload: { stage: "guess", forceAnonymous: false }
        });
        store.dispatch({
            type: "composer/set-field",
            payload: {
                mentionTarget: {
                    name: "海屿",
                    avatar: "haiyu-avatar"
                },
                audioDraft: {
                    id: 1,
                    kind: "audio",
                    name: "语音 1",
                    url: "blob:voice-draft",
                    mimeType: "audio/webm"
                }
            }
        });
        dataService.publishPost.mockResolvedValue({
            id: "post-audio-1",
            board: "guess",
            comments: []
        });
        dataService.saveGuessSelection.mockResolvedValue({
            name: "海屿",
            avatar: "haiyu-avatar",
            selectedAt: "2026-04-21T12:00:00.000Z"
        });
        dataService.listPosts.mockResolvedValue([]);

        const fetchMock = vi.fn().mockResolvedValue({
            blob: async () => new Blob(["voice"], { type: "audio/webm" })
        });
        vi.stubGlobal("fetch", fetchMock);

        try {
            await actions.submitPost();
        } finally {
            vi.unstubAllGlobals();
        }

        expect(dataService.publishPost).toHaveBeenCalledWith(expect.objectContaining({
            body: "@海屿",
            media: [expect.objectContaining({
                kind: "audio",
                name: "语音 1",
                mimeType: "audio/webm"
            })]
        }));
        expect(store.getState().composerState.audioDraft).toBe(null);
    });

    it("keeps comment draft when submit comment fails", async () => {
        seedApprovedViewer(store);
        store.dispatch({
            type: "comments/open",
            payload: { postId: "post-1", source: "comments" }
        });
        store.dispatch({
            type: "comments/set-field",
            payload: {
                status: "ready",
                draftText: "draft comment"
            }
        });
        dataService.publishComment.mockRejectedValue(new Error("comment failed"));

        await actions.submitComment();

        expect(store.getState().overlayState.comments.draftText).toBe("draft comment");
        expect(store.getState().overlayState.comments.submitStatus).toBe("idle");
    });

    it("persists round theme updates through channel storage", async () => {
        seedApprovedViewer(store);
        store.dispatch({
            type: "channel-intelligence/set-field",
            payload: {
                draftTheme: "玄学",
                themeEditorOpen: true
            }
        });
        dataService.updateChannelRoundState.mockResolvedValue({
            ...approvedRuntime.channel,
            currentRoundTheme: "玄学"
        });

        await actions.saveRoundTheme();

        expect(dataService.updateChannelRoundState).toHaveBeenCalledWith({
            theme: "玄学"
        });
        expect(store.getState().roundState.theme).toBe("玄学");
        expect(store.getState().overlayState.channelIntelligence.themeEditorOpen).toBe(false);
    });

    it("persists round god updates through channel storage", async () => {
        seedApprovedViewer(store);
        dataService.updateChannelRoundState.mockResolvedValue({
            ...approvedRuntime.channel,
            currentRoundGodProfile: {
                name: "海屿",
                avatar: "haiyu-avatar"
            }
        });

        await actions.assignRoundGod({
            name: "海屿",
            avatar: "haiyu-avatar"
        });

        expect(dataService.updateChannelRoundState).toHaveBeenCalledWith({
            godProfile: {
                name: "海屿",
                avatar: "haiyu-avatar"
            }
        });
        expect(store.getState().roundState.godProfile).toEqual({
            name: "海屿",
            avatar: "haiyu-avatar"
        });
        expect(store.getState().overlayState.channelIntelligence.godPickerOpen).toBe(false);
    });

    it("persists guess selection after submitting a guess post", async () => {
        seedApprovedViewer(store);
        store.dispatch({
            type: "round/set-stage",
            payload: { stage: "guess", forceAnonymous: false }
        });
        store.dispatch({
            type: "composer/set-field",
            payload: {
                draftText: "",
                mentionTarget: {
                    name: "海屿",
                    avatar: "haiyu-avatar"
                }
            }
        });
        dataService.publishPost.mockResolvedValue({
            id: "guess-post-1",
            board: "guess",
            comments: []
        });
        dataService.saveGuessSelection.mockResolvedValue({
            name: "海屿",
            avatar: "haiyu-avatar",
            selectedAt: "2026-04-21T12:00:00.000Z"
        });
        dataService.listPosts.mockResolvedValue([]);

        await actions.submitPost();

        expect(dataService.publishPost).toHaveBeenCalledWith(expect.objectContaining({
            body: "@海屿",
            boardSlug: "guess"
        }));
        expect(dataService.saveGuessSelection).toHaveBeenCalledWith({
            name: "海屿",
            avatar: "haiyu-avatar"
        });
        expect(store.getState().roundState.guessSelection?.name).toBe("海屿");
        expect(store.getState().roundState.progress.guessSubmitted).toBe(true);
    });

    it("persists reveal pairs through channel storage", async () => {
        seedApprovedViewer(store);
        store.dispatch({
            type: "channel-intelligence/set-field",
            payload: {
                revealEditorOpen: true,
                draftRevealMember: {
                    name: "章鱼烧",
                    avatar: "avatar"
                },
                draftRevealAngel: {
                    name: "海屿",
                    avatar: "haiyu-avatar"
                }
            }
        });
        dataService.updateChannelRoundState.mockResolvedValue({
            ...approvedRuntime.channel,
            currentRevealMap: {
                章鱼烧: {
                    member: {
                        name: "章鱼烧",
                        avatar: "avatar"
                    },
                    angel: {
                        name: "海屿",
                        avatar: "haiyu-avatar"
                    }
                }
            }
        });

        await actions.saveRoundRevealPair();

        expect(dataService.updateChannelRoundState).toHaveBeenCalledWith({
            revealMap: {
                章鱼烧: {
                    member: {
                        name: "章鱼烧",
                        avatar: "avatar"
                    },
                    angel: {
                        name: "海屿",
                        avatar: "haiyu-avatar"
                    },
                    updatedAt: expect.any(String)
                }
            }
        });
        expect(store.getState().roundState.revealMap.章鱼烧.angel.name).toBe("海屿");
    });

    it("generates reveal pairs directly from delivery posts", async () => {
        seedApprovedViewer(store);
        dataService.listPosts.mockResolvedValue([
            {
                id: "delivery-1",
                board: "delivery",
                text: "@章鱼烧\n这是我给你的交付",
                createdAt: "2026-04-22T10:00:00.000Z",
                isDeleted: false,
                adminRevealIdentity: {
                    name: "海屿",
                    avatar: "haiyu-avatar"
                }
            },
            {
                id: "delivery-2",
                board: "delivery",
                text: "@苹果\n另一条交付",
                createdAt: "2026-04-22T09:00:00.000Z",
                isDeleted: false,
                adminRevealIdentity: {
                    name: "白榆",
                    avatar: "baiyu-avatar"
                }
            }
        ]);
        dataService.updateChannelRoundState.mockResolvedValue({
            ...approvedRuntime.channel,
            currentRevealMap: {
                章鱼烧: {
                    member: { name: "章鱼烧", avatar: "avatar" },
                    angel: { name: "海屿", avatar: "haiyu-avatar" }
                },
                苹果: {
                    member: { name: "苹果", avatar: "avatar" },
                    angel: { name: "白榆", avatar: "baiyu-avatar" }
                }
            }
        });

        await actions.generateRoundRevealResults();

        expect(dataService.listPosts).toHaveBeenCalledWith("delivery");
        expect(dataService.updateChannelRoundState).toHaveBeenCalledWith({
            revealMap: {
                章鱼烧: {
                    member: { name: "章鱼烧", avatar: expect.any(String) },
                    angel: { name: "海屿", avatar: "haiyu-avatar" },
                    updatedAt: expect.any(String)
                },
                苹果: {
                    member: { name: "苹果", avatar: expect.any(String) },
                    angel: { name: "白榆", avatar: "baiyu-avatar" },
                    updatedAt: expect.any(String)
                }
            }
        });
        expect(store.getState().roundState.revealMap.章鱼烧.angel.name).toBe("海屿");
        expect(store.getState().roundState.revealMap.苹果.angel.name).toBe("白榆");
    });

    it("submits reply comments with parent comment id", async () => {
        seedApprovedViewer(store);
        store.dispatch({
            type: "comments/open",
            payload: { postId: "post-1", source: "comments" }
        });
        store.dispatch({
            type: "comments/set-field",
            payload: {
                status: "ready",
                draftText: "接着这条说",
                replyTarget: {
                    id: "comment-1",
                    authorName: "海屿",
                    text: "原评论"
                }
            }
        });
        dataService.publishComment.mockResolvedValue({ id: "comment-2" });
        dataService.listPosts.mockResolvedValue([{ id: "post-1", comments: [] }]);
        dataService.getPost.mockResolvedValue({ id: "post-1", comments: [] });

        await actions.submitComment();

        expect(dataService.publishComment).toHaveBeenCalledWith(expect.objectContaining({
            postId: "post-1",
            parentCommentId: "comment-1",
            body: "接着这条说"
        }));
        expect(store.getState().overlayState.comments.replyTarget).toBe(null);
    });

    it("opens post detail drawer with source metadata", () => {
        actions.openOverlay("comments", {
            postId: "post-1",
            source: "body"
        });

        const commentsOverlay = store.getState().overlayState.comments;
        expect(commentsOverlay.open).toBe(true);
        expect(commentsOverlay.postId).toBe("post-1");
        expect(commentsOverlay.openSource).toBe("body");
        expect(commentsOverlay.initialFocusTarget).toBe("post-body");
    });

    it("opens and closes the image lightbox from feed images", () => {
        store.dispatch({
            type: "feed/load-success",
            payload: {
                items: [{
                    id: "post-1",
                    images: [{ name: "cover.png", url: "https://example.com/cover.png" }],
                    comments: []
                }]
            }
        });

        actions.openPostImage("post-1", 0);

        expect(store.getState().overlayState.imageLightbox.open).toBe(true);
        expect(store.getState().overlayState.imageLightbox.image?.url).toBe("https://example.com/cover.png");

        actions.closeOverlay("image-lightbox");

        expect(store.getState().overlayState.imageLightbox.open).toBe(false);
    });

    it("saves channel settings and updates the current channel", async () => {
        seedApprovedViewer(store);
        store.dispatch({ type: "channel-settings/open" });
        store.dispatch({
            type: "channel-settings/set-field",
            payload: {
                draftName: "新的频道名",
                draftLogo: "new-logo",
                draftBackground: "new-background"
            }
        });
        dataService.updateChannel.mockResolvedValue({
            ...approvedRuntime.channel,
            name: "新的频道名",
            logoUrl: "new-logo",
            backgroundUrl: "new-background"
        });

        await actions.saveChannelSettings();

        const state = store.getState();
        expect(dataService.updateChannel).toHaveBeenCalledWith({
            name: "新的频道名",
            logoUrl: "new-logo",
            backgroundUrl: "new-background"
        });
        expect(state.runtimeState.channel.name).toBe("新的频道名");
        expect(state.runtimeState.channel.logoUrl).toBe("new-logo");
        expect(state.runtimeState.channel.backgroundUrl).toBe("new-background");
        expect(state.overlayState.channelSettings.open).toBe(false);
    });

    it("opens the image lightbox from drawer images", () => {
        store.dispatch({
            type: "comments/open",
            payload: { postId: "post-1", source: "comments" }
        });
        store.dispatch({
            type: "comments/load-success",
            payload: {
                post: {
                    id: "post-1",
                    images: [{ name: "detail.png", url: "https://example.com/detail.png" }],
                    comments: []
                }
            }
        });

        actions.openCurrentDrawerImage(0);

        expect(store.getState().overlayState.imageLightbox.open).toBe(true);
        expect(store.getState().overlayState.imageLightbox.image?.url).toBe("https://example.com/detail.png");
        expect(store.getState().overlayState.imageLightbox.source).toBe("comments");
    });

    it("likes a post once for the current session and updates the count", async () => {
        seedApprovedViewer(store);
        store.dispatch({
            type: "feed/load-success",
            payload: {
                items: [{ id: "post-1", likes: 3, comments: [] }]
            }
        });
        dataService.likePost.mockResolvedValue(4);

        await actions.likePost("post-1");
        await actions.likePost("post-1");

        expect(dataService.likePost).toHaveBeenCalledTimes(1);
        expect(store.getState().feedState.items[0].likes).toBe(4);
        expect(store.getState().feedState.likedPostIds).toContain("post-1");
    });

    it("likes a comment once for the current session and updates the count", async () => {
        seedApprovedViewer(store);
        store.dispatch({
            type: "comments/open",
            payload: { postId: "post-1", source: "comments" }
        });
        store.dispatch({
            type: "comments/load-success",
            payload: {
                post: {
                    id: "post-1",
                    comments: [{ id: "comment-1", likes: 2 }]
                }
            }
        });
        dataService.likeComment.mockResolvedValue(3);

        await actions.likeComment("comment-1");
        await actions.likeComment("comment-1");

        expect(dataService.likeComment).toHaveBeenCalledTimes(1);
        expect(dataService.likeComment).toHaveBeenCalledWith("comment-1", "post-1");
        expect(store.getState().overlayState.comments.post.comments[0].likes).toBe(3);
        expect(store.getState().overlayState.comments.likedCommentIds).toContain("comment-1");
    });

    it("opens delete confirmation for posts and replaces the post after delete", async () => {
        seedApprovedViewer(store);
        store.dispatch({
            type: "feed/load-success",
            payload: {
                items: [{
                    id: "post-1",
                    authorName: "章鱼烧",
                    authorUserId: "user-1",
                    text: "原始帖子",
                    comments: [],
                    likes: 2,
                    shares: 1
                }]
            }
        });
        dataService.deletePost.mockResolvedValue({
            id: "post-1",
            authorName: "章鱼烧",
            authorUserId: "user-1",
            text: "该帖子已删除",
            isDeleted: true,
            deletedLabel: "该帖子已删除",
            comments: [],
            likes: 0,
            shares: 0
        });

        actions.requestDeletePost("post-1");

        expect(store.getState().overlayState.deleteConfirm.open).toBe(true);

        await actions.confirmDeletePost("post-1");

        expect(dataService.deletePost).toHaveBeenCalledWith("post-1");
        expect(store.getState().feedState.items[0].isDeleted).toBe(true);
        expect(store.getState().overlayState.deleteConfirm.open).toBe(false);
    });

    it("opens delete confirmation for comments and replaces drawer post after delete", async () => {
        seedApprovedViewer(store);
        store.dispatch({
            type: "comments/open",
            payload: { postId: "post-1", source: "comments" }
        });
        store.dispatch({
            type: "comments/load-success",
            payload: {
                post: {
                    id: "post-1",
                    authorName: "章鱼烧",
                    authorUserId: "user-2",
                    comments: [{
                        id: "comment-1",
                        authorName: "章鱼烧",
                        authorUserId: "user-1",
                        text: "原评论"
                    }]
                }
            }
        });
        dataService.deleteComment.mockResolvedValue({
            id: "post-1",
            authorName: "章鱼烧",
            authorUserId: "user-2",
            comments: [{
                id: "comment-1",
                authorName: "章鱼烧",
                authorUserId: "user-1",
                text: "该评论已删除",
                isDeleted: true,
                deletedLabel: "该评论已删除"
            }]
        });

        actions.requestDeleteComment("comment-1");
        expect(store.getState().overlayState.deleteConfirm.open).toBe(true);

        await actions.confirmDeleteComment("comment-1");

        expect(dataService.deleteComment).toHaveBeenCalledWith("comment-1");
        expect(store.getState().overlayState.comments.post.comments[0].isDeleted).toBe(true);
        expect(store.getState().overlayState.deleteConfirm.open).toBe(false);
    });

    it("updates real identity after saving identity dialog", async () => {
        seedApprovedViewer(store);
        store.dispatch({ type: "identity/open" });
        store.dispatch({
            type: "identity/set-field",
            payload: {
                draftName: "新名字",
                draftAvatar: "avatar-new"
            }
        });
        dataService.updateIdentity.mockResolvedValue({
            id: "identity-1",
            name: "新名字",
            avatar: "avatar-new",
            meta: "当前真实身份",
            role: "owner"
        });

        await actions.saveIdentity();

        const state = store.getState();
        expect(state.runtimeState.realIdentity.name).toBe("新名字");
        expect(state.overlayState.identity.open).toBe(false);
    });

    it("logs in with password and refreshes approved runtime", async () => {
        store.dispatch({
            type: "auth/set-field",
            payload: { email: "member@example.com", password: "secret123" }
        });
        dataService.loginWithPassword.mockResolvedValue({
            user: { id: "user-1", email: "member@example.com" },
            isAnonymous: false
        });
        dataService.loadChannelBootstrap.mockResolvedValue({
            channel: approvedRuntime.channel,
            auth: {
                user: { id: "user-1", email: "member@example.com" },
                isAnonymous: false
            },
            membership: {
                status: "approved",
                joinRequest: null,
                reviewItems: [],
                role: "owner"
            },
            memberRuntime: approvedRuntime
        });

        await actions.loginWithPassword();

        expect(dataService.loginWithPassword).toHaveBeenCalledWith("member@example.com", "secret123");
        expect(store.getState().authState.status).toBe("authenticated");
    });

    it("registers with password and refreshes approved runtime", async () => {
        store.dispatch({
            type: "auth-gate/open",
            payload: { mode: "register" }
        });
        store.dispatch({
            type: "auth/set-field",
            payload: {
                displayName: "海屿",
                email: "member@example.com",
                password: "secret123"
            }
        });
        dataService.registerWithPassword.mockResolvedValue({
            user: { id: "user-1", email: "member@example.com" },
            isAnonymous: false
        });
        dataService.loadChannelBootstrap.mockResolvedValue({
            channel: approvedRuntime.channel,
            auth: {
                user: { id: "user-1", email: "member@example.com" },
                isAnonymous: false
            },
            membership: {
                status: "approved",
                joinRequest: null,
                reviewItems: [],
                role: "owner"
            },
            memberRuntime: approvedRuntime
        });

        await actions.submitAuthFlow();

        expect(dataService.registerWithPassword).toHaveBeenCalledWith("member@example.com", "secret123", "海屿");
        expect(store.getState().authState.status).toBe("authenticated");
        expect(store.getState().overlayState.authGate.open).toBe(false);
    });

    it("keeps create-channel draft after successful registration", async () => {
        window.history.replaceState({}, "", "/?view=create-channel");
        store.dispatch({
            type: "auth-gate/open",
            payload: { mode: "register" }
        });
        store.dispatch({
            type: "auth/set-field",
            payload: {
                displayName: "海屿",
                email: "member@example.com",
                password: "secret123"
            }
        });
        store.dispatch({
            type: "channel-create/set-field",
            payload: {
                name: "新频道",
                description: "保留中的草稿"
            }
        });
        dataService.registerWithPassword.mockResolvedValue({
            user: { id: "user-1", email: "member@example.com" },
            isAnonymous: false
        });
        dataService.getAuthState.mockResolvedValue({
            user: { id: "user-1", email: "member@example.com" },
            isAnonymous: false
        });

        await actions.submitAuthFlow();

        const state = store.getState();
        expect(state.authState.status).toBe("authenticated");
        expect(state.overlayState.authGate.open).toBe(false);
        expect(state.channelCreateState.name).toBe("新频道");
        expect(state.channelCreateState.description).toBe("保留中的草稿");
        expect(dataService.loadChannelBootstrap).not.toHaveBeenCalled();
    });

    it("shows an explicit error when registration returns no session", async () => {
        store.dispatch({
            type: "auth-gate/open",
            payload: { mode: "register" }
        });
        store.dispatch({
            type: "auth/set-field",
            payload: {
                displayName: "海屿",
                email: "member@example.com",
                password: "secret123"
            }
        });
        const error = new Error("Supabase email confirmation is still enabled.");
        error.code = "auth_email_confirmation_required";
        dataService.registerWithPassword.mockRejectedValue(error);

        await actions.submitAuthFlow();

        const state = store.getState();
        expect(state.authState.status).toBe("guest");
        expect(state.authState.displayName).toBe("海屿");
        expect(state.authState.error).toContain("还没有关闭邮箱确认");
    });

    it("resets membership to guest when password login fails", async () => {
        store.dispatch({
            type: "auth/set-field",
            payload: { email: "member@example.com", password: "wrong-pass" }
        });
        store.dispatch({
            type: "membership/set-state",
            payload: {
                status: "approved",
                joinRequest: null,
                reviewItems: [{ id: "review-1" }]
            }
        });
        dataService.loginWithPassword.mockRejectedValue(new Error("Invalid login credentials"));

        await actions.loginWithPassword();

        expect(store.getState().authState.status).toBe("guest");
        expect(store.getState().membershipState.status).toBe("guest");
        expect(store.getState().membershipState.reviewItems).toEqual([]);
    });

    it("submits join request and switches membership to pending", async () => {
        store.dispatch({
            type: "runtime/preview-ready",
            payload: { channel: approvedRuntime.channel }
        });
        store.dispatch({
            type: "auth/set-state",
            payload: {
                status: "authenticated",
                user: { id: "user-2", email: "guest@example.com" },
                isAnonymous: false
            }
        });
        store.dispatch({
            type: "membership/set-state",
            payload: {
                status: "guest",
                draftMessage: "我想加入讨论。"
            }
        });
        dataService.submitJoinRequest.mockResolvedValue({
            id: "request-1",
            channelId: "channel-1",
            userId: "user-2",
            status: "pending",
            message: "我想加入讨论。"
        });

        await actions.submitJoinRequest();

        const state = store.getState();
        expect(state.membershipState.status).toBe("pending");
        expect(state.membershipState.joinRequest?.status).toBe("pending");
    });

    it("stores in-channel search query without reloading the feed", () => {
        actions.setFeedSearchQuery("苹果");

        expect(store.getState().feedState.searchQuery).toBe("苹果");
        expect(dataService.listPosts).not.toHaveBeenCalled();
    });

    it("toggles the account menu from the sidebar identity trigger", () => {
        expect(store.getState().uiState.accountMenuOpen).toBe(false);
        actions.toggleAccountMenu();
        expect(store.getState().uiState.accountMenuOpen).toBe(true);
        actions.toggleAccountMenu();
        expect(store.getState().uiState.accountMenuOpen).toBe(false);
    });

    it("opens the channel search dialog from the hero search entry", async () => {
        dataService.listPosts.mockResolvedValue([{ id: "post-1", authorName: "云栖", text: "test", comments: [] }]);

        await actions.requestSearchFocus();

        expect(store.getState().overlayState.searchDialog.open).toBe(true);
        expect(store.getState().overlayState.searchDialog.items).toHaveLength(1);
        expect(store.getState().uiState.sidebarOpen).toBe(false);
    });

    it("keeps composer collapsed by default and expands when anonymous mode is enabled", () => {
        seedApprovedViewer(store);

        expect(store.getState().composerState.expanded).toBe(false);
        expect(store.getState().composerState.anonymousMode).toBe(false);
        expect(store.getState().composerState.aiImageReshape).toBe(false);

        actions.toggleAnonymousMode();

        expect(store.getState().composerState.expanded).toBe(true);
        expect(store.getState().composerState.anonymousMode).toBe(true);
        expect(store.getState().composerState.aiImageReshape).toBe(true);
    });

    it("submits anonymous posts with alias author payload", async () => {
        seedApprovedViewer(store);
        store.dispatch({ type: "composer/toggle-anonymous" });
        store.dispatch({
            type: "composer/set-field",
            payload: { draftText: "匿名内容" }
        });
        dataService.publishPost.mockResolvedValue({ id: "post-1", board: "none" });
        dataService.listPosts.mockResolvedValue([{ id: "post-1", comments: [] }]);

        await actions.submitPost();

        expect(dataService.publishPost).toHaveBeenCalledWith(expect.objectContaining({
            author: { type: "alias_session", key: "slot-baiyu" }
        }));
        expect(store.getState().composerState.expanded).toBe(false);
    });

    it("prepends selected mention target when submitting a post", async () => {
        seedApprovedViewer(store);
        store.dispatch({
            type: "round/set-stage",
            payload: { stage: "delivery", forceAnonymous: true }
        });
        store.dispatch({
            type: "round/set-claim-selection",
            payload: {
                selection: {
                    postId: "wish-1",
                    authorName: "小灰灰",
                    authorAvatar: "avatar-1",
                    previewText: "这条愿望我来完成"
                }
            }
        });
        store.dispatch({
            type: "composer/set-field",
            payload: {
                draftText: "这条愿望我来完成",
                mentionTarget: { name: "小灰灰", avatar: "avatar-1" }
            }
        });
        dataService.publishPost.mockResolvedValue({ id: "post-1", board: "none" });
        dataService.listPosts.mockResolvedValue([{ id: "post-1", comments: [] }]);

        await actions.submitPost();

        expect(dataService.publishPost).toHaveBeenCalledWith(expect.objectContaining({
            body: "@小灰灰\n这条愿望这边来完成",
            boardSlug: "delivery"
        }));
        expect(store.getState().composerState.mentionTarget).toBe(null);
    });

    it("loads wish posts when switching into claim stage", async () => {
        seedApprovedViewer(store);
        dataService.listPosts.mockResolvedValue([{ id: "post-1", board: "wish", comments: [] }]);

        await actions.setActiveBoard("claim");

        expect(dataService.listPosts).toHaveBeenCalledWith("wish");
        expect(store.getState().roundState.activeStage).toBe("claim");
    });

    it("loads delivery posts when switching into guess stage", async () => {
        seedApprovedViewer(store);
        dataService.listPosts.mockResolvedValue([{ id: "post-1", board: "delivery", comments: [] }]);

        await actions.setActiveBoard("guess");

        expect(dataService.listPosts).toHaveBeenCalledWith("delivery");
        expect(store.getState().roundState.activeStage).toBe("guess");
    });

    it("locks a selected wish for the current round", async () => {
        seedApprovedViewer(store);
        store.dispatch({
            type: "round/set-stage",
            payload: { stage: "claim", forceAnonymous: false }
        });
        store.dispatch({
            type: "feed/load-success",
            payload: {
                items: [{
                    id: "wish-1",
                    board: "wish",
                    authorName: "白榆",
                    authorAvatar: "alias-avatar",
                    authorUserId: "user-2",
                    text: "希望有人帮我把这周的知识整理成目录",
                    comments: []
                }]
            }
        });
        dataService.saveClaimSelection.mockResolvedValue({
            postId: "wish-1",
            authorName: "白榆",
            authorAvatar: "alias-avatar",
            previewText: "希望有人帮我把这周的知识整理成目录"
        });

        await actions.claimWish("wish-1");

        expect(dataService.saveClaimSelection).toHaveBeenCalledWith(expect.objectContaining({
            id: "wish-1"
        }));
        expect(store.getState().roundState.claimSelection?.postId).toBe("wish-1");
        expect(store.getState().roundState.progress.claimSelected).toBe(true);
    });

    it("opens and closes the channel menu overlay", () => {
        expect(store.getState().overlayState.channelMenu.open).toBe(false);
        actions.openOverlay("channel-menu", {
            anchorX: 120,
            anchorY: 68,
            anchorSource: "channel-hero-menu"
        });
        expect(store.getState().overlayState.channelMenu.open).toBe(true);
        expect(store.getState().overlayState.channelMenu.anchorX).toBe(120);
        expect(store.getState().overlayState.channelMenu.anchorY).toBe(68);
        expect(store.getState().overlayState.channelMenu.anchorSource).toBe("channel-hero-menu");
        actions.closeOverlay("channel-menu");
        expect(store.getState().overlayState.channelMenu.open).toBe(false);
    });

    it("opens and switches the notification center overlay", () => {
        expect(store.getState().overlayState.notificationCenter.open).toBe(false);
        actions.openOverlay("notification-center", {
            tab: "interaction",
            anchorX: 132,
            anchorY: 72,
            anchorSource: "channel-hero-notifications"
        });
        expect(store.getState().overlayState.notificationCenter.open).toBe(true);
        expect(store.getState().overlayState.notificationCenter.tab).toBe("interaction");
        expect(store.getState().overlayState.notificationCenter.anchorX).toBe(132);
        expect(store.getState().overlayState.notificationCenter.anchorY).toBe(72);
        expect(store.getState().overlayState.notificationCenter.anchorSource).toBe("channel-hero-notifications");
        actions.setNotificationCenterTab("admin");
        expect(store.getState().overlayState.notificationCenter.tab).toBe("admin");
        actions.closeOverlay("notification-center");
        expect(store.getState().overlayState.notificationCenter.open).toBe(false);
    });

    it("signs out and returns the page to public preview state", async () => {
        seedApprovedViewer(store);
        store.dispatch({
            type: "feed/load-success",
            payload: { items: [{ id: "post-1", comments: [] }] }
        });
        dataService.signOut = vi.fn().mockResolvedValue({
            user: null,
            isAnonymous: false
        });
        dataService.loadChannelBootstrap.mockResolvedValue({
            channel: approvedRuntime.channel,
            auth: {
                user: null,
                isAnonymous: false
            },
            membership: {
                status: "guest",
                joinRequest: null,
                reviewItems: [],
                role: null
            },
            memberRuntime: null
        });
        dataService.listPosts.mockResolvedValue([{ id: "post-1", comments: [] }]);

        await actions.logout();

        const state = store.getState();
        expect(dataService.signOut).toHaveBeenCalled();
        expect(state.authState.status).toBe("guest");
        expect(state.membershipState.status).toBe("guest");
        expect(state.runtimeState.status).toBe("preview");
    });

    it("initializes create-channel page as guest and opens auth gate", async () => {
        dataService.getAuthState.mockResolvedValue({
            user: null,
            isAnonymous: false
        });

        await actions.initializeCreateChannelPage();

        const state = store.getState();
        expect(state.authState.status).toBe("guest");
        expect(state.overlayState.authGate.open).toBe(true);
    });

    it("creates channel and redirects into the new channel as owner", async () => {
        store.dispatch({
            type: "auth/set-state",
            payload: {
                status: "authenticated",
                user: { id: "user-1", email: "owner@example.com" },
                isAnonymous: false
            }
        });
        store.dispatch({
            type: "channel-create/set-field",
            payload: {
                name: "新频道",
                description: "新频道简介"
            }
        });
        dataService.createChannel.mockResolvedValue({
            channel: { id: "channel-2", slug: "new-channel", name: "新频道", previewVisibility: "public", joinPolicy: "approval_required" },
            realIdentity: { id: "identity-2", name: "owner", avatar: "avatar", meta: "当前真实身份", role: "owner" },
            anonymousProfiles: [{ id: "alias-2", key: "slot-baiyu", name: "白榆", avatar: "alias" }],
            activeAliasKey: "slot-baiyu"
        });

        await actions.submitCreateChannel();

        expect(dataService.createChannel).toHaveBeenCalledWith({
            name: "新频道",
            description: "新频道简介"
        });
        expect(store.getState().membershipState.status).toBe("approved");
        expect(store.getState().runtimeState.channel?.slug).toBe("new-channel");
        expect(store.getState().runtimeState.realIdentity.role).toBe("owner");
    });
});
