import { createClient } from "@supabase/supabase-js";
import { defaultAnonymousProfiles, defaultRealIdentity } from "../../entities/identity/config.js";
import { runtimeConfig } from "../config/runtime-config.js";
const channelShellCacheTtl = 24 * 60 * 60 * 1000;
const channelMemberCacheTtl = 10 * 60 * 1000;

const channelSelectFields = "id, slug, name, description, created_by, preview_visibility, join_policy";
const identitySelectFields = "id, channel_id, user_id, display_name, avatar_url, role";
const aliasSelectFields = "id, slot_key, display_name, avatar_url, status";
const joinRequestSelectFields = "id, channel_id, user_id, status, message, review_note, reviewed_by, reviewed_at, created_at, updated_at";
const postSelectFields = `
    id,
    board_slug,
    body,
    media,
    ai_disclosure,
    views_count,
    likes_count,
    shares_count,
    created_at,
    identity:identities!posts_identity_id_fkey (
        id,
        display_name,
        avatar_url,
        role
    ),
    alias_session:alias_sessions!posts_alias_session_id_fkey (
        id,
        slot_key,
        display_name,
        avatar_url
    ),
    comments (
        id,
        body,
        created_at,
        identity:identities!comments_identity_id_fkey (
            id,
            display_name,
            avatar_url,
            role
        ),
        alias_session:alias_sessions!comments_alias_session_id_fkey (
            id,
            slot_key,
            display_name,
            avatar_url
        )
    )
`;

const getRelativeTimeLabel = (timestamp) => {
    const diffMs = Date.now() - Date.parse(timestamp);
    if (Number.isNaN(diffMs) || diffMs < 5 * 60 * 1000) {
        return "刚刚";
    }

    const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
    if (diffHours < 24) {
        return `${Math.max(1, diffHours)}小时前`;
    }

    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    return `${Math.max(1, diffDays)}天前`;
};

const decodeJwtPayload = (token) => {
    if (!token) {
        return {};
    }

    const payload = token.split(".")[1];
    if (!payload) {
        return {};
    }

    try {
        const decoded = payload.replace(/-/g, "+").replace(/_/g, "/");
        const normalized = decoded.padEnd(decoded.length + ((4 - (decoded.length % 4)) % 4), "=");
        return JSON.parse(window.atob(normalized));
    } catch {
        return {};
    }
};

const normalizeUser = (user) => {
    if (!user) {
        return null;
    }

    return {
        id: user.id,
        email: user.email || "",
        phone: user.phone || "",
        lastSignInAt: user.last_sign_in_at || "",
        identities: Array.isArray(user.identities) ? user.identities.map((identity) => ({ ...identity })) : []
    };
};

const normalizeChannel = (channel) => ({
    id: channel.id,
    slug: channel.slug,
    name: channel.name,
    description: channel.description || "",
    previewVisibility: channel.preview_visibility || channel.visibility || "private",
    joinPolicy: channel.join_policy || "approval_required",
    isProvisioned: channel.id !== null
});

const isSchemaCompatibilityError = (error) => {
    const code = String(error?.code || "");
    return ["42703", "42P01", "42883", "PGRST202"].includes(code);
};

const getFallbackAuthor = (type) => ({
    display_name: type === "alias" ? "匿名成员" : "频道成员",
    avatar_url: "",
    role: "member"
});

const normalizeCommentRow = (commentRow) => {
    const author = commentRow.identity || commentRow.alias_session || getFallbackAuthor(commentRow.alias_session ? "alias" : "identity");
    return {
        id: commentRow.id,
        authorName: author.display_name || "频道成员",
        authorAvatar: author.avatar_url || "",
        timeLabel: getRelativeTimeLabel(commentRow.created_at),
        text: commentRow.body
    };
};

const normalizePostRow = (postRow) => {
    const author = postRow.identity || postRow.alias_session || getFallbackAuthor(postRow.alias_session ? "alias" : "identity");
    const comments = [...(postRow.comments || [])]
        .sort((left, right) => Date.parse(left.created_at) - Date.parse(right.created_at))
        .map(normalizeCommentRow);

    return {
        id: postRow.id,
        authorName: author.display_name || "频道成员",
        authorAvatar: author.avatar_url || "",
        text: postRow.body,
        images: [...(postRow.media || [])],
        board: postRow.board_slug || "none",
        isAnonymous: !postRow.identity,
        role: postRow.identity?.role || "member",
        timeLabel: getRelativeTimeLabel(postRow.created_at),
        dateLabel: postRow.created_at.slice(0, 10),
        views: postRow.views_count,
        likes: postRow.likes_count,
        shares: postRow.shares_count,
        comments,
        aiDisclosure: postRow.ai_disclosure || "none"
    };
};

const normalizeJoinRequest = (requestRow, profileByUserId = new Map()) => {
    const profile = profileByUserId.get(requestRow.user_id) || {};
    return {
        id: requestRow.id,
        channelId: requestRow.channel_id,
        userId: requestRow.user_id,
        status: requestRow.status,
        message: requestRow.message || "",
        reviewNote: requestRow.review_note || "",
        reviewedBy: requestRow.reviewed_by || null,
        reviewedAt: requestRow.reviewed_at || null,
        createdAt: requestRow.created_at,
        updatedAt: requestRow.updated_at,
        applicantName: profile.display_name || "待审核成员",
        applicantAvatar: profile.avatar_url || ""
    };
};

const slugifyChannelName = (name) => {
    const normalized = String(name || "")
        .trim()
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    return normalized;
};

const createRandomSlugTail = () => Math.random().toString(36).slice(2, 8);
const getSessionStorage = () => {
    try {
        return window.sessionStorage;
    } catch {
        return null;
    }
};

const getChannelShellCacheKey = (slug) => `channel-shell:${slug}`;
const getChannelMemberCacheKey = (slug, userKey) => `channel-member:${slug}:${userKey}`;

const readSessionCache = (key, ttl) => {
    const storage = getSessionStorage();
    if (!storage) {
        return null;
    }

    try {
        const rawValue = storage.getItem(key);
        if (!rawValue) {
            return null;
        }

        const parsed = JSON.parse(rawValue);
        if (!parsed?.savedAt || !("data" in parsed)) {
            storage.removeItem(key);
            return null;
        }

        if (Date.now() - parsed.savedAt > ttl) {
            storage.removeItem(key);
            return null;
        }

        return parsed.data;
    } catch {
        storage.removeItem(key);
        return null;
    }
};

const writeSessionCache = (key, data) => {
    const storage = getSessionStorage();
    if (!storage) {
        return;
    }

    try {
        storage.setItem(key, JSON.stringify({
            savedAt: Date.now(),
            data
        }));
    } catch {
        // Ignore cache write failures.
    }
};

export const createChannelDataService = () => {
    const postCache = new Map();
    const runtimeState = {
        channel: null,
        authUser: null,
        identity: null,
        aliasProfiles: []
    };

    let supabaseClient = null;

    const getSupabaseClient = () => {
        if (supabaseClient) {
            return supabaseClient;
        }

        if (!runtimeConfig.supabaseUrl || !runtimeConfig.supabasePublishableKey) {
            throw new Error("Supabase runtime config is missing.");
        }

        supabaseClient = createClient(runtimeConfig.supabaseUrl, runtimeConfig.supabasePublishableKey, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: false
            }
        });

        return supabaseClient;
    };

    const ensureLoadedChannel = () => {
        if (!runtimeState.channel) {
            throw new Error("Channel preview has not been initialized.");
        }
        return runtimeState.channel;
    };

    const cachePosts = (posts) => {
        postCache.clear();
        posts.forEach((post) => {
            postCache.set(post.id, post);
        });
        return posts;
    };

    const createFallbackChannelRow = (slug) => ({
        id: null,
        slug,
        name: runtimeConfig.channelName || slug,
        description: "",
        created_by: null,
        preview_visibility: "public",
        join_policy: "approval_required"
    });

    const getUserCacheKey = (snapshot) => {
        if (!snapshot?.user?.id || snapshot.isAnonymous) {
            return "guest";
        }
        return snapshot.user.id;
    };

    const getShellChannel = (slug = runtimeConfig.channelSlug || "") => {
        const cachedShell = readSessionCache(getChannelShellCacheKey(slug), channelShellCacheTtl);
        if (cachedShell) {
            return normalizeChannel(cachedShell);
        }

        if (runtimeState.channel?.slug === slug) {
            return normalizeChannel(runtimeState.channel);
        }

        return normalizeChannel(createFallbackChannelRow(slug));
    };

    const getSessionSnapshot = async () => {
        const client = getSupabaseClient();
        const { data: sessionData, error: sessionError } = await client.auth.getSession();
        if (sessionError) {
            throw sessionError;
        }

        const session = sessionData.session;
        if (!session?.user) {
            runtimeState.authUser = null;
            return {
                user: null,
                isAnonymous: false,
                accessToken: ""
            };
        }

        const jwtPayload = decodeJwtPayload(session.access_token);
        const snapshot = {
            user: normalizeUser(session.user),
            isAnonymous: Boolean(jwtPayload.is_anonymous),
            accessToken: session.access_token
        };

        runtimeState.authUser = snapshot.user;
        return snapshot;
    };

    const ensureProfile = async () => {
        const user = runtimeState.authUser;
        if (!user?.id) {
            return null;
        }

        const client = getSupabaseClient();
        const { data: existingProfile, error: profileError } = await client
            .from("profiles")
            .select("id, display_name, avatar_url")
            .eq("id", user.id)
            .maybeSingle();

        if (profileError) {
            throw profileError;
        }

        if (existingProfile) {
            return existingProfile;
        }

        const fallbackName = user.email ? user.email.split("@")[0] : "";
        const { data: createdProfile, error: insertError } = await client
            .from("profiles")
            .insert({
                id: user.id,
                display_name: fallbackName || null
            })
            .select("id, display_name, avatar_url")
            .single();

        if (insertError) {
            throw insertError;
        }

        return createdProfile;
    };

    const fetchPosts = async (boardSlug = null) => {
        const client = getSupabaseClient();
        const channel = ensureLoadedChannel();
        let query = client
            .from("posts")
            .select(postSelectFields)
            .eq("channel_id", channel.id)
            .order("created_at", { ascending: false });

        if (boardSlug) {
            query = query.eq("board_slug", boardSlug);
        }

        const { data, error } = await query;
        if (error) {
            throw error;
        }

        return cachePosts((data || []).map(normalizePostRow));
    };

    const countPublicPosts = async (channelId) => {
        const client = getSupabaseClient();
        const { data, error } = await client
            .from("posts")
            .select("id")
            .eq("channel_id", channelId);

        if (error) {
            if (isSchemaCompatibilityError(error)) {
                return 0;
            }
            throw error;
        }

        return (data || []).length;
    };

    const mapAliasProfiles = (aliasRows) => {
        const aliasByKey = new Map((aliasRows || []).map((alias) => [alias.slot_key, alias]));
        return defaultAnonymousProfiles.map((profile) => {
            const alias = aliasByKey.get(profile.key);
            return {
                id: alias?.id || null,
                key: profile.key,
                name: alias?.display_name || profile.name,
                avatar: alias?.avatar_url || profile.avatar
            };
        });
    };

    const getCurrentMembership = async (channelId) => {
        const client = getSupabaseClient();
        const { data, error } = await client.rpc("get_my_channel_membership", {
            target_channel_id: channelId
        });

        if (error) {
            if (isSchemaCompatibilityError(error)) {
                return null;
            }
            throw error;
        }

        const membershipRow = Array.isArray(data) ? data[0] || null : data || null;
        if (!membershipRow) {
            return null;
        }

        return {
            status: membershipRow.status || "guest",
            role: membershipRow.role || null,
            identityId: membershipRow.identity_id || null,
            displayName: membershipRow.display_name || "",
            avatarUrl: membershipRow.avatar_url || ""
        };
    };

    const fetchChannelRow = async (slug) => {
        const client = getSupabaseClient();
        const { data, error } = await client
            .from("channels")
            .select(channelSelectFields)
            .eq("slug", slug)
            .single();

        let channelRow = data;
        if (error) {
            if (String(error.code || "") === "PGRST116") {
                channelRow = createFallbackChannelRow(slug);
            } else if (!isSchemaCompatibilityError(error)) {
                throw error;
            } else {
                const fallbackResponse = await client
                    .from("channels")
                    .select("id, slug, name, description, created_by, visibility")
                    .eq("slug", slug)
                    .single();

                if (fallbackResponse.error) {
                    if (String(fallbackResponse.error.code || "") === "PGRST116") {
                        channelRow = createFallbackChannelRow(slug);
                    } else {
                        throw fallbackResponse.error;
                    }
                } else {
                    channelRow = {
                        ...fallbackResponse.data,
                        preview_visibility: fallbackResponse.data.visibility || "private",
                        join_policy: "approval_required"
                    };
                }
            }
        }

        runtimeState.channel = channelRow;
        writeSessionCache(getChannelShellCacheKey(slug), channelRow);
        return channelRow;
    };

    const buildMembershipSnapshot = async (channelId, snapshot, { includeReviewItems = true } = {}) => {
        if (!channelId || !snapshot.user?.id || snapshot.isAnonymous) {
            return {
                status: "guest",
                joinRequest: null,
                reviewItems: [],
                role: null
            };
        }

        const client = getSupabaseClient();
        const membership = await getCurrentMembership(channelId);

        if (membership?.status === "approved" && membership.identityId) {
            let reviewItems = [];
            if (includeReviewItems && (membership.role === "owner" || membership.role === "admin")) {
                reviewItems = await thisApi.listPendingJoinRequests(channelId);
            }

            return {
                status: "approved",
                joinRequest: null,
                reviewItems,
                role: membership.role,
                identityId: membership.identityId,
                displayName: membership.displayName,
                avatarUrl: membership.avatarUrl
            };
        }

        const { data: requestRows, error: requestError } = await client
            .from("channel_join_requests")
            .select(joinRequestSelectFields)
            .eq("channel_id", channelId)
            .eq("user_id", snapshot.user.id)
            .order("created_at", { ascending: false })
            .limit(1);

        if (requestError) {
            if (isSchemaCompatibilityError(requestError)) {
                return {
                    status: "guest",
                    joinRequest: null,
                    reviewItems: [],
                    role: null
                };
            }
            throw requestError;
        }

        const latestRequest = requestRows?.[0] || null;
        return {
            status: latestRequest?.status === "rejected"
                ? "rejected"
                : latestRequest?.status === "pending"
                    ? "pending"
                    : "guest",
            joinRequest: latestRequest ? normalizeJoinRequest(latestRequest) : null,
            reviewItems: [],
            role: null
        };
    };

    const buildMemberRuntime = async (channelRow, snapshot, membership, { allowEnsureAliases = false } = {}) => {
        if (!channelRow?.id || !snapshot.user?.id || snapshot.isAnonymous || membership?.status !== "approved") {
            return null;
        }

        const client = getSupabaseClient();
        let identity = null;

        if (membership.identityId) {
            identity = {
                id: membership.identityId,
                channel_id: channelRow.id,
                user_id: snapshot.user.id,
                display_name: membership.displayName || defaultRealIdentity.name,
                avatar_url: membership.avatarUrl || defaultRealIdentity.avatar,
                role: membership.role || "member"
            };
        } else {
            const { data: identityRow, error: identityError } = await client
                .from("identities")
                .select(identitySelectFields)
                .eq("channel_id", channelRow.id)
                .eq("user_id", snapshot.user.id)
                .single();

            if (identityError) {
                throw identityError;
            }

            identity = identityRow;
        }

        let aliasRows = [];
        if (allowEnsureAliases) {
            const aliasResponse = await client.rpc("ensure_my_alias_sessions", {
                target_channel_id: channelRow.id
            });

            if (aliasResponse.error) {
                if (!isSchemaCompatibilityError(aliasResponse.error)) {
                    throw aliasResponse.error;
                }
            } else {
                aliasRows = aliasResponse.data || [];
            }
        }

        if (!aliasRows.length) {
            const existingAliasesResponse = await client
                .from("alias_sessions")
                .select(aliasSelectFields)
                .eq("channel_id", channelRow.id)
                .eq("identity_id", identity.id)
                .order("slot_key", { ascending: true });

            if (existingAliasesResponse.error) {
                throw existingAliasesResponse.error;
            }

            aliasRows = existingAliasesResponse.data || [];
        }

        runtimeState.identity = identity;
        runtimeState.aliasProfiles = mapAliasProfiles(aliasRows);

        return {
            channel: normalizeChannel(channelRow),
            realIdentity: {
                id: identity.id,
                name: identity.display_name || defaultRealIdentity.name,
                avatar: identity.avatar_url || defaultRealIdentity.avatar,
                meta: defaultRealIdentity.meta,
                role: identity.role
            },
            anonymousProfiles: runtimeState.aliasProfiles,
            activeAliasKey: runtimeState.aliasProfiles.find((profile) => profile.id)?.key
                || runtimeState.aliasProfiles[0]?.key
                || defaultAnonymousProfiles[0]?.key
                || null
        };
    };

    let thisApi = null;

    const getActorReference = (author) => {
        if (author.type === "alias_session") {
            const aliasProfile = runtimeState.aliasProfiles.find((profile) => profile.key === author.key);
            if (!aliasProfile?.id) {
                throw new Error("匿名马甲尚未初始化完成。");
            }

            return {
                identity_id: null,
                alias_session_id: aliasProfile.id
            };
        }

        if (!runtimeState.identity?.id) {
            throw new Error("频道成员身份尚未初始化完成。");
        }

        return {
            identity_id: runtimeState.identity.id,
            alias_session_id: null
        };
    };

    const fetchReviewProfiles = async (rows) => {
        const userIds = [...new Set((rows || []).map((row) => row.user_id).filter(Boolean))];
        if (!userIds.length) {
            return new Map();
        }

        const client = getSupabaseClient();
        const { data: profiles, error } = await client
            .from("profiles")
            .select("id, display_name, avatar_url")
            .in("id", userIds);

        if (error) {
            throw error;
        }

        return new Map((profiles || []).map((profile) => [profile.id, profile]));
    };

    const generateUniqueChannelSlug = async (name) => {
        const client = getSupabaseClient();
        const baseSlug = slugifyChannelName(name) || `channel-${createRandomSlugTail()}`;
        let candidateSlug = baseSlug;

        while (true) {
            const { data, error } = await client
                .from("channels")
                .select("id")
                .eq("slug", candidateSlug)
                .maybeSingle();

            if (error) {
                throw error;
            }

            if (!data?.id) {
                return candidateSlug;
            }

            candidateSlug = `${baseSlug}-${createRandomSlugTail()}`;
        }
    };

    const api = {
        async getAuthState() {
            return getSessionSnapshot();
        },
        getChannelShell(slug = runtimeConfig.channelSlug || "") {
            return getShellChannel(slug);
        },
        async getCachedChannelBootstrap(slug) {
            const snapshot = await getSessionSnapshot();
            const cachedChannel = readSessionCache(getChannelShellCacheKey(slug), channelShellCacheTtl);
            const cachedMember = readSessionCache(
                getChannelMemberCacheKey(slug, getUserCacheKey(snapshot)),
                channelMemberCacheTtl
            );

            if (!cachedChannel && !cachedMember) {
                return null;
            }

            const channel = normalizeChannel(cachedChannel || createFallbackChannelRow(slug));
            runtimeState.channel = cachedChannel || createFallbackChannelRow(slug);

            return {
                channel,
                auth: {
                    user: snapshot.user,
                    isAnonymous: snapshot.isAnonymous
                },
                membership: cachedMember?.membership || {
                    status: "guest",
                    joinRequest: null,
                    reviewItems: [],
                    role: null
                },
                memberRuntime: cachedMember?.memberRuntime || null
            };
        },
        async loadChannelBootstrap(slug) {
            const snapshot = await getSessionSnapshot();
            const channelRow = await fetchChannelRow(slug);
            const channel = normalizeChannel(channelRow);
            const auth = {
                user: snapshot.user,
                isAnonymous: snapshot.isAnonymous
            };

            const membership = await buildMembershipSnapshot(channel.id, snapshot, {
                includeReviewItems: true
            });
            const memberRuntime = membership.status === "approved"
                ? await buildMemberRuntime(channelRow, snapshot, membership, {
                    allowEnsureAliases: false
                })
                : null;

            writeSessionCache(getChannelMemberCacheKey(slug, getUserCacheKey(snapshot)), {
                membership,
                memberRuntime
            });

            return {
                channel,
                auth,
                membership,
                memberRuntime
            };
        },
        async loadPublicChannelPreview(slug) {
            return normalizeChannel(await fetchChannelRow(slug));
        },
        async listPublicChannels() {
            const client = getSupabaseClient();
            let query = client
                .from("channels")
                .select(channelSelectFields)
                .order("created_at", { ascending: true });

            let rows = null;
            const response = await query.eq("preview_visibility", "public");

            if (response.error) {
                if (!isSchemaCompatibilityError(response.error)) {
                    throw response.error;
                }

                const fallbackResponse = await client
                    .from("channels")
                    .select("id, slug, name, description, created_by, visibility")
                    .eq("visibility", "public")
                    .order("created_at", { ascending: true });

                if (fallbackResponse.error) {
                    throw fallbackResponse.error;
                }

                rows = (fallbackResponse.data || []).map((channel) => ({
                    ...channel,
                    preview_visibility: channel.visibility || "public",
                    join_policy: "approval_required"
                }));
            } else {
                rows = response.data || [];
            }

            if (!rows.length && runtimeConfig.channelSlug) {
                return [{
                    slug: runtimeConfig.channelSlug,
                    name: runtimeConfig.channelName || runtimeConfig.channelSlug,
                    description: "",
                    discussionCount: 0,
                    badge: (runtimeConfig.channelName || runtimeConfig.channelSlug || "频").slice(0, 1)
                }];
            }

            const channels = await Promise.all(rows.map(async (row) => ({
                ...normalizeChannel(row),
                discussionCount: await countPublicPosts(row.id)
            })));

            return channels.map((channel) => ({
                slug: channel.slug,
                name: channel.name,
                description: channel.description || "",
                discussionCount: channel.discussionCount,
                badge: (channel.name || "频").slice(0, 1)
            }));
        },
        async createChannel(input) {
            const snapshot = await getSessionSnapshot();
            if (!snapshot.user?.id || snapshot.isAnonymous) {
                throw new Error("请先登录，再创建频道。");
            }

            const client = getSupabaseClient();
            const channelName = String(input.name || "").trim();
            const channelDescription = String(input.description || "").trim();

            if (!channelName) {
                throw new Error("请输入频道名称。");
            }

            await ensureProfile();

            let channelSlug = "";
            let channelId = "";
            const rpcResponse = await client.rpc("create_channel_with_owner", {
                channel_name: channelName,
                channel_description: channelDescription
            });

            if (!rpcResponse.error) {
                const createdChannel = Array.isArray(rpcResponse.data) ? rpcResponse.data[0] : rpcResponse.data;
                channelSlug = createdChannel?.created_channel_slug || "";
                channelId = createdChannel?.created_channel_id || "";
            } else if (!isSchemaCompatibilityError(rpcResponse.error)) {
                throw rpcResponse.error;
            } else {
                const profile = await ensureProfile();
                const generatedSlug = await generateUniqueChannelSlug(channelName);
                const { data: createdChannel, error: channelError } = await client
                    .from("channels")
                    .insert({
                        slug: generatedSlug,
                        name: channelName,
                        description: channelDescription || null,
                        visibility: "public",
                        preview_visibility: "public",
                        join_policy: "approval_required",
                        created_by: snapshot.user.id
                    })
                    .select(channelSelectFields)
                    .single();

                if (channelError) {
                    throw channelError;
                }

                const { data: createdIdentity, error: identityError } = await client
                    .from("identities")
                    .insert({
                        channel_id: createdChannel.id,
                        user_id: snapshot.user.id,
                        display_name: profile?.display_name || snapshot.user.email?.split("@")[0] || "频道主",
                        avatar_url: profile?.avatar_url || null,
                        role: "owner"
                    })
                    .select(identitySelectFields)
                    .single();

                if (identityError) {
                    throw identityError;
                }

                const aliasResponse = await client.rpc("ensure_my_alias_sessions", {
                    target_channel_id: createdChannel.id
                });

                if (aliasResponse.error && !isSchemaCompatibilityError(aliasResponse.error)) {
                    throw aliasResponse.error;
                }

                if (aliasResponse.error) {
                    const aliasRows = defaultAnonymousProfiles.map((profileItem) => ({
                        channel_id: createdChannel.id,
                        identity_id: createdIdentity.id,
                        slot_key: profileItem.key,
                        display_name: profileItem.name,
                        avatar_url: profileItem.avatar,
                        status: "active"
                    }));

                    const insertedAliases = await client
                        .from("alias_sessions")
                        .insert(aliasRows)
                        .select(aliasSelectFields);

                    if (insertedAliases.error) {
                        throw insertedAliases.error;
                    }
                }

                channelSlug = createdChannel.slug;
                channelId = createdChannel.id;
            }

            const channel = await this.loadPublicChannelPreview(channelSlug);
            return this.loadApprovedMemberRuntime(channel.id || channelId);
        },
        async loginWithPassword(email, password) {
            const client = getSupabaseClient();
            const currentSnapshot = await getSessionSnapshot();

            if (currentSnapshot.isAnonymous) {
                const { error: signOutError } = await client.auth.signOut();
                if (signOutError) {
                    throw signOutError;
                }

                runtimeState.authUser = null;
                runtimeState.identity = null;
                runtimeState.aliasProfiles = [];
            }

            const { error } = await client.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                throw error;
            }

            const nextSnapshot = await getSessionSnapshot();
            await ensureProfile();
            return nextSnapshot;
        },
        async upgradeLegacyAnonymousUser(email, token = "") {
            const client = getSupabaseClient();
            if (!token) {
                const { error } = await client.auth.updateUser({ email });
                if (error) {
                    throw error;
                }
                return { email, verificationPending: true };
            }

            const { error } = await client.auth.verifyOtp({
                email,
                token,
                type: "email_change"
            });

            if (error) {
                throw error;
            }

            const snapshot = await getSessionSnapshot();
            await ensureProfile();
            return snapshot;
        },
        async signOut() {
            const client = getSupabaseClient();
            const { error } = await client.auth.signOut();
            if (error) {
                throw error;
            }

            runtimeState.authUser = null;
            runtimeState.identity = null;
            runtimeState.aliasProfiles = [];
            return { user: null, isAnonymous: false };
        },
        async loadMembershipState(channelId) {
            const snapshot = await getSessionSnapshot();
            return buildMembershipSnapshot(channelId, snapshot, {
                includeReviewItems: true
            });
        },
        async listPendingJoinRequests(channelId) {
            const client = getSupabaseClient();
            const { data: rows, error } = await client
                .from("channel_join_requests")
                .select(joinRequestSelectFields)
                .eq("channel_id", channelId)
                .eq("status", "pending")
                .order("created_at", { ascending: true });

            if (error) {
                if (isSchemaCompatibilityError(error)) {
                    return [];
                }
                throw error;
            }

            const profileByUserId = await fetchReviewProfiles(rows || []);
            return (rows || []).map((row) => normalizeJoinRequest(row, profileByUserId));
        },
        async submitJoinRequest(channelId, message) {
            const client = getSupabaseClient();
            const snapshot = await getSessionSnapshot();
            if (!snapshot.user?.id || snapshot.isAnonymous) {
                throw new Error("请先完成正式登录，再申请加入频道。");
            }

            const { data, error } = await client
                .from("channel_join_requests")
                .insert({
                    channel_id: channelId,
                    user_id: snapshot.user.id,
                    status: "pending",
                    message: message || null
                })
                .select(joinRequestSelectFields)
                .single();

            if (error) {
                throw error;
            }

            return normalizeJoinRequest(data);
        },
        async approveJoinRequest(requestId) {
            const client = getSupabaseClient();
            const { data, error } = await client.rpc("approve_channel_join_request", {
                target_request_id: requestId
            });

            if (error) {
                throw error;
            }

            return normalizeJoinRequest(data);
        },
        async rejectJoinRequest(requestId, reason = "") {
            const client = getSupabaseClient();
            const { data, error } = await client.rpc("reject_channel_join_request", {
                target_request_id: requestId,
                rejection_note: reason || null
            });

            if (error) {
                throw error;
            }

            return normalizeJoinRequest(data);
        },
        async loadApprovedMemberRuntime(channelId) {
            const snapshot = await getSessionSnapshot();
            if (!snapshot.user?.id || snapshot.isAnonymous) {
                throw new Error("当前会话还不是正式成员。");
            }

            const membership = await buildMembershipSnapshot(channelId, snapshot, {
                includeReviewItems: false
            });
            const runtime = await buildMemberRuntime(ensureLoadedChannel(), snapshot, membership, {
                allowEnsureAliases: true
            });

            if (!runtime) {
                throw new Error("当前会话还不是正式成员。");
            }

            return runtime;
        },
        async listPosts(boardSlug = null) {
            const channel = ensureLoadedChannel();
            if (!channel.id) {
                return [];
            }
            return fetchPosts(boardSlug);
        },
        async getPost(postId) {
            const channel = ensureLoadedChannel();
            if (!channel.id) {
                throw new Error("频道还没有初始化到数据库。");
            }
            const cachedPost = postCache.get(postId);
            if (cachedPost) {
                return cachedPost;
            }

            const client = getSupabaseClient();
            const { data, error } = await client
                .from("posts")
                .select(postSelectFields)
                .eq("id", postId)
                .eq("channel_id", runtimeState.channel.id)
                .single();

            if (error) {
                throw error;
            }

            const post = normalizePostRow(data);
            postCache.set(post.id, post);
            return post;
        },
        async publishPost(input) {
            const client = getSupabaseClient();
            const channel = ensureLoadedChannel();
            const authorReference = getActorReference(input.author);
            const { data, error } = await client
                .from("posts")
                .insert({
                    channel_id: channel.id,
                    board_slug: input.boardSlug || null,
                    body: input.body,
                    media: input.images || [],
                    ai_disclosure: input.aiDisclosure || "none",
                    ...authorReference
                })
                .select("id")
                .single();

            if (error) {
                throw error;
            }

            return this.getPost(data.id);
        },
        async publishComment(input) {
            const client = getSupabaseClient();
            const channel = ensureLoadedChannel();
            const authorReference = getActorReference(input.author);
            const { data, error } = await client
                .from("comments")
                .insert({
                    post_id: input.postId,
                    channel_id: channel.id,
                    body: input.body,
                    ...authorReference
                })
                .select("id, body, created_at, identity:identities!comments_identity_id_fkey(id, display_name, avatar_url), alias_session:alias_sessions!comments_alias_session_id_fkey(id, display_name, avatar_url)")
                .single();

            if (error) {
                throw error;
            }

            postCache.delete(input.postId);
            return normalizeCommentRow(data);
        },
        async likePost(postId) {
            const client = getSupabaseClient();
            const { data, error } = await client.rpc("increment_post_like", {
                target_post_id: postId
            });

            if (error) {
                throw error;
            }

            postCache.delete(postId);
            return Number(data || 0);
        },
        async updateIdentity(input) {
            const client = getSupabaseClient();
            if (!runtimeState.identity?.id) {
                throw new Error("频道成员身份尚未初始化完成。");
            }

            const updatePayload = {
                display_name: input.displayName
            };

            if (input.avatarUrl) {
                updatePayload.avatar_url = input.avatarUrl;
            }

            const { data, error } = await client
                .from("identities")
                .update(updatePayload)
                .eq("id", runtimeState.identity.id)
                .select("id, display_name, avatar_url, role")
                .single();

            if (error) {
                throw error;
            }

            runtimeState.identity = {
                ...runtimeState.identity,
                ...data
            };

            return {
                id: data.id,
                name: data.display_name,
                avatar: data.avatar_url || input.avatarUrl || defaultRealIdentity.avatar,
                meta: input.meta || defaultRealIdentity.meta,
                role: data.role
            };
        }
    };

    thisApi = api;
    return api;
};

export const channelDataService = createChannelDataService();
