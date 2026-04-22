import {
    cloneDemoBootstrap,
    cloneDemoChannel,
    cloneDemoPost,
    demoMembership,
    demoUserIdentity,
    demoPosts
} from "./seed.js";

const cloneValue = (value) => JSON.parse(JSON.stringify(value));

const buildTimeLabel = (createdAt) => {
    const diffMinutes = Math.max(1, Math.round((Date.now() - Date.parse(createdAt)) / 60000));
    if (diffMinutes < 60) {
        return "刚刚";
    }
    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) {
        return `${diffHours}小时前`;
    }
    return `${Math.round(diffHours / 24)}天前`;
};

const buildClaimSelection = (post) => ({
    postId: post.id,
    authorName: post.authorName,
    authorAvatar: post.authorAvatar || "",
    previewText: String(post.text || "").trim().slice(0, 72)
});

const buildGuessSelection = (member) => ({
    name: String(member?.name || "").trim(),
    avatar: String(member?.avatar || "").trim(),
    selectedAt: new Date().toISOString()
});

const clonePostList = (posts) => posts
    .map((post) => cloneDemoPost(post))
    .sort((left, right) => Date.parse(right.createdAt || 0) - Date.parse(left.createdAt || 0));

const updateAuthorReferences = (posts, userId, nextIdentity) => posts.map((post) => {
    if (post.authorUserId !== userId || post.isAnonymous) {
        return {
            ...post,
            comments: (post.comments || []).map((comment) => (
                comment.authorUserId === userId && !comment.isAnonymous
                    ? {
                        ...comment,
                        authorName: nextIdentity.name,
                        authorAvatar: nextIdentity.avatar
                    }
                    : { ...comment }
            ))
        };
    }

    return {
        ...post,
        authorName: nextIdentity.name,
        authorAvatar: nextIdentity.avatar,
        comments: (post.comments || []).map((comment) => (
            comment.authorUserId === userId && !comment.isAnonymous
                ? {
                    ...comment,
                    authorName: nextIdentity.name,
                    authorAvatar: nextIdentity.avatar
                }
                : { ...comment }
        ))
    };
});

export const createDemoDataService = () => {
    const bootstrap = cloneDemoBootstrap();
    let channel = cloneDemoChannel();
    let auth = cloneValue(bootstrap.auth);
    let membership = {
        ...demoMembership,
        reviewItems: []
    };
    let memberRuntime = {
        ...cloneValue(bootstrap.memberRuntime),
        channel: cloneDemoChannel()
    };
    let posts = clonePostList(demoPosts);
    let postCounter = 1;
    let commentCounter = 1;

    const getCurrentUserId = () => auth.user?.id || "demo-user";
    const getCurrentIdentity = () => ({
        ...demoUserIdentity,
        ...memberRuntime.realIdentity
    });
    const getActiveAlias = () => memberRuntime.anonymousProfiles.find((profile) => profile.key === memberRuntime.activeAliasKey)
        || memberRuntime.anonymousProfiles[0];

    const syncChannelReferences = () => {
        channel.currentRevealMap = cloneValue(channel.currentRevealMap || {});
        memberRuntime.channel = cloneValue(channel);
    };

    const buildBootstrap = () => ({
        channel: cloneValue(channel),
        auth: cloneValue(auth),
        membership: cloneValue(membership),
        memberRuntime: {
            ...cloneValue(memberRuntime),
            channel: cloneValue(channel)
        }
    });

    const normalizeAuthorFromInput = (author) => {
        if (author?.type === "alias_session") {
            const alias = getActiveAlias();
            return {
                authorName: alias?.name || "匿名用户",
                authorAvatar: alias?.avatar || "",
                isAnonymous: true,
                adminRevealIdentity: {
                    name: getCurrentIdentity().name,
                    avatar: getCurrentIdentity().avatar
                }
            };
        }

        return {
            authorName: getCurrentIdentity().name,
            authorAvatar: getCurrentIdentity().avatar,
            isAnonymous: false,
            adminRevealIdentity: null
        };
    };

    const mapMedia = (media) => ({
        images: (media || [])
            .filter((item) => item.kind === "image")
            .map((item, index) => ({
                id: `${Date.now()}-image-${index}`,
                name: item.name || `图片 ${index + 1}`,
                url: item.url
            })),
        audioClips: (media || [])
            .filter((item) => item.kind === "audio")
            .map((item, index) => ({
                id: `${Date.now()}-audio-${index}`,
                name: item.name || `语音 ${index + 1}`,
                url: item.url,
                mimeType: item.mimeType || "audio/webm"
            }))
    });

    return {
        async getAuthState() {
            return cloneValue(auth);
        },
        getChannelShell() {
            return cloneValue(channel);
        },
        async getCachedChannelBootstrap() {
            return buildBootstrap();
        },
        async loadChannelBootstrap() {
            return buildBootstrap();
        },
        async loadPublicChannelPreview() {
            return cloneValue(channel);
        },
        async loadMembershipState() {
            return cloneValue(membership);
        },
        async loadApprovedMemberRuntime() {
            return {
                ...cloneValue(memberRuntime),
                channel: cloneValue(channel)
            };
        },
        async listPublicChannels() {
            return [];
        },
        async listPendingJoinRequests() {
            return [];
        },
        async listPosts(boardSlug = null) {
            const filteredPosts = boardSlug
                ? posts.filter((post) => post.board === boardSlug)
                : posts;
            return clonePostList(filteredPosts);
        },
        async getPost(postId) {
            const post = posts.find((item) => item.id === postId);
            if (!post) {
                throw new Error("试玩帖子不存在。");
            }
            return cloneDemoPost(post);
        },
        async publishPost(input) {
            const { authorName, authorAvatar, isAnonymous, adminRevealIdentity } = normalizeAuthorFromInput(input.author);
            const { images, audioClips } = mapMedia(input.media || input.images || []);
            const createdAt = new Date().toISOString();
            const post = {
                id: `demo-post-${postCounter++}`,
                board: input.boardSlug || "all",
                authorName,
                authorAvatar,
                authorUserId: getCurrentUserId(),
                text: String(input.body || "").trim(),
                createdAt,
                timeLabel: buildTimeLabel(createdAt),
                dateLabel: createdAt,
                isAnonymous,
                isDeleted: false,
                deletedLabel: "",
                role: "member",
                images,
                audioClips,
                comments: [],
                likes: 0,
                shares: 0,
                views: 0,
                aiDisclosure: input.aiDisclosure || "none",
                adminRevealIdentity
            };

            posts = [post, ...posts];
            return cloneDemoPost(post);
        },
        async publishComment(input) {
            const author = normalizeAuthorFromInput(input.author);
            const createdAt = new Date().toISOString();
            const comment = {
                id: `demo-comment-${commentCounter++}`,
                postId: input.postId,
                parentCommentId: input.parentCommentId || null,
                authorName: author.authorName,
                authorAvatar: author.authorAvatar,
                authorUserId: getCurrentUserId(),
                text: String(input.body || "").trim(),
                createdAt,
                timeLabel: buildTimeLabel(createdAt),
                isAnonymous: author.isAnonymous,
                isDeleted: false,
                deletedLabel: "",
                likes: 0,
                adminRevealIdentity: author.adminRevealIdentity
            };

            posts = posts.map((post) => (
                post.id === input.postId
                    ? {
                        ...post,
                        comments: [...(post.comments || []), comment]
                    }
                    : post
            ));

            return { ...comment };
        },
        async likePost(postId) {
            let nextLikes = 0;
            posts = posts.map((post) => {
                if (post.id !== postId) {
                    return post;
                }
                nextLikes = (post.likes || 0) + 1;
                return {
                    ...post,
                    likes: nextLikes
                };
            });
            return nextLikes;
        },
        async likeComment(commentId) {
            let nextLikes = 0;
            posts = posts.map((post) => ({
                ...post,
                comments: (post.comments || []).map((comment) => {
                    if (comment.id !== commentId) {
                        return comment;
                    }
                    nextLikes = (comment.likes || 0) + 1;
                    return {
                        ...comment,
                        likes: nextLikes
                    };
                })
            }));
            return nextLikes;
        },
        async deletePost(postId) {
            let nextPost = null;
            posts = posts.map((post) => {
                if (post.id !== postId) {
                    return post;
                }
                nextPost = {
                    ...post,
                    text: "该帖子已删除",
                    isDeleted: true,
                    deletedLabel: "该帖子已删除",
                    likes: 0,
                    shares: 0
                };
                return nextPost;
            });
            if (!nextPost) {
                throw new Error("试玩帖子不存在。");
            }
            return cloneDemoPost(nextPost);
        },
        async deleteComment(commentId) {
            let nextPost = null;
            posts = posts.map((post) => {
                const nextComments = (post.comments || []).map((comment) => (
                    comment.id === commentId
                        ? {
                            ...comment,
                            text: "该评论已删除",
                            isDeleted: true,
                            deletedLabel: "该评论已删除",
                            likes: 0
                        }
                        : comment
                ));
                if (nextComments.some((comment) => comment.id === commentId)) {
                    nextPost = {
                        ...post,
                        comments: nextComments
                    };
                    return nextPost;
                }
                return post;
            });
            if (!nextPost) {
                throw new Error("试玩评论不存在。");
            }
            return cloneDemoPost(nextPost);
        },
        async updateIdentity(input) {
            const previousName = memberRuntime.realIdentity.name;
            const nextIdentity = {
                ...getCurrentIdentity(),
                name: String(input.name || memberRuntime.realIdentity.name || demoUserIdentity.name).trim(),
                avatar: String(input.avatar || memberRuntime.realIdentity.avatar || demoUserIdentity.avatar).trim()
            };

            memberRuntime.realIdentity = nextIdentity;
            posts = updateAuthorReferences(posts, getCurrentUserId(), nextIdentity);

            if (channel.currentRevealMap?.[previousName]) {
                channel.currentRevealMap[nextIdentity.name] = {
                    ...channel.currentRevealMap[previousName],
                    member: {
                        name: nextIdentity.name,
                        avatar: nextIdentity.avatar
                    }
                };
                delete channel.currentRevealMap[previousName];
                syncChannelReferences();
            }

            return cloneValue(nextIdentity);
        },
        async updateChannel(input) {
            channel = {
                ...channel,
                name: input.name || channel.name,
                logoUrl: input.logoUrl || channel.logoUrl,
                backgroundUrl: input.backgroundUrl || channel.backgroundUrl
            };
            syncChannelReferences();
            return cloneValue(channel);
        },
        async updateChannelRoundState(input) {
            if (input.theme !== undefined) {
                channel.currentRoundTheme = String(input.theme || "").trim();
            }
            if (input.godProfile !== undefined) {
                channel.currentRoundGodProfile = input.godProfile ? { ...input.godProfile } : null;
            }
            if (input.revealMap !== undefined) {
                channel.currentRevealMap = cloneValue(input.revealMap || {});
            }
            syncChannelReferences();
            return cloneValue(channel);
        },
        async saveClaimSelection(post) {
            const currentPost = posts.find((item) => item.id === post?.id);
            if (!currentPost || currentPost.isDeleted || currentPost.board !== "wish") {
                throw new Error("当前试玩愿望不可选。");
            }
            if (currentPost.authorUserId === getCurrentUserId()) {
                throw new Error("不能选择自己发的愿望。");
            }

            const selection = buildClaimSelection(currentPost);
            memberRuntime.claimSelection = selection;
            return cloneValue(selection);
        },
        async clearClaimSelection() {
            memberRuntime.claimSelection = null;
        },
        async saveGuessSelection(member) {
            const selection = buildGuessSelection(member);
            if (!selection.name) {
                throw new Error("先选择你猜的是谁。");
            }
            if (selection.name === getCurrentIdentity().name) {
                throw new Error("不能把自己设成猜测对象。");
            }
            memberRuntime.guessSelection = selection;
            return cloneValue(selection);
        },
        async clearGuessSelection() {
            memberRuntime.guessSelection = null;
        },
        async createAliasProfile(aliasKey, profile) {
            memberRuntime.anonymousProfiles = memberRuntime.anonymousProfiles.map((item) => (
                item.key === aliasKey
                    ? {
                        ...item,
                        name: profile.name,
                        avatar: profile.avatar
                    }
                    : item
            ));
            memberRuntime.activeAliasKey = aliasKey;
            return {
                profiles: memberRuntime.anonymousProfiles.map((item) => ({ ...item })),
                activeAliasKey: aliasKey
            };
        },
        async signOut() {
            return cloneValue(auth);
        },
        async loginWithPassword() {
            throw new Error("试玩模式不接入真实登录，请进入真实频道。");
        },
        async upgradeLegacyAnonymousUser() {
            throw new Error("试玩模式不接入匿名账号升级。");
        },
        async submitJoinRequest() {
            throw new Error("试玩模式不会提交真实加入申请。");
        },
        async approveJoinRequest() {
            throw new Error("试玩模式不处理真实审批。");
        },
        async rejectJoinRequest() {
            throw new Error("试玩模式不处理真实审批。");
        },
        async createChannel() {
            throw new Error("试玩模式不支持创建真实频道。");
        }
    };
};
