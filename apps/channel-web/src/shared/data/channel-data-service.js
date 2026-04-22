import { createClient } from "@supabase/supabase-js";
import { defaultAnonymousProfiles, defaultRealIdentity, mentionMembers } from "../../entities/identity/config.js";
import { runtimeConfig } from "../config/runtime-config.js";
import { getPostPreviewText } from "../lib/helpers.js";
const channelShellCacheTtl = 24 * 60 * 60 * 1000;
const channelMemberCacheTtl = 10 * 60 * 1000;
const defaultChannelLogo = "https://lh3.googleusercontent.com/aida-public/AB6AXuDJUmmuvmt3jmrXR6sjC-XgIw7ZpGWHK2ClL0rFR7fWwCkwWqjrmHW39Py4Oi-W0kn2oYCMKoNVvH5vAdlhcYDzUfqmH67hsNpn2JEEuVJNKGnXMflYRLFqtaIpQdlJrUocYHAsapz8CAuaAK8kSS0EGaoQfWEx31DipdiQCFDAFw-1EVVf3XaU8tzBCxY_HmC9peicAbPCoNUtPvO-SwM7dKIClndraRoa0_3S5laPdFIz7G3On8LqOlZSEB-nMy5BSBAljxc7jIw";
const defaultChannelBackground = "";
const memberAvatarByName = new Map(mentionMembers.map((member) => [member.name, member.avatar || ""]));

const channelSelectFields = "id, slug, name, description, created_by, preview_visibility, join_policy, current_round_theme, current_round_god_name, current_round_god_avatar, current_reveal_map";
const minimalChannelSelectFields = "id, slug, name, description, created_by, visibility";
const identitySelectFields = "id, channel_id, user_id, display_name, avatar_url, role, current_claim_post_id, current_claim_selected_at, current_guess_name, current_guess_avatar, current_guess_selected_at";
const legacyIdentitySelectFields = "id, channel_id, user_id, display_name, avatar_url, role";
const aliasSelectFields = "id, slot_key, display_name, avatar_url, status, last_used_at, created_at";
const joinRequestSelectFields = "id, channel_id, user_id, status, message, review_note, reviewed_by, reviewed_at, created_at, updated_at";
const commentSelectFields = `
    id,
    body,
    likes_count,
    parent_comment_id,
    deleted_at,
    deleted_by,
    deleted_snapshot,
    created_at,
    identity:identities!comments_identity_id_fkey (
        id,
        user_id,
        display_name,
        avatar_url,
        role
    ),
    alias_session:alias_sessions!comments_alias_session_id_fkey (
        id,
        slot_key,
        display_name,
        avatar_url,
        identity:identities!alias_sessions_identity_id_fkey (
            id,
            user_id,
            display_name,
            avatar_url,
            role
        )
    )
`;
const legacyCommentSelectFields = `
    id,
    body,
    created_at,
    identity:identities!comments_identity_id_fkey (
        id,
        user_id,
        display_name,
        avatar_url,
        role
    ),
    alias_session:alias_sessions!comments_alias_session_id_fkey (
        id,
        slot_key,
        display_name,
        avatar_url,
        identity:identities!alias_sessions_identity_id_fkey (
            id,
            user_id,
            display_name,
            avatar_url,
            role
        )
    )
`;
const postSelectFields = `
    id,
    board_slug,
    body,
    media,
    ai_disclosure,
    views_count,
    likes_count,
    shares_count,
    deleted_at,
    deleted_by,
    deleted_snapshot,
    created_at,
    identity:identities!posts_identity_id_fkey (
        id,
        user_id,
        display_name,
        avatar_url,
        role
    ),
    alias_session:alias_sessions!posts_alias_session_id_fkey (
        id,
        slot_key,
        display_name,
        avatar_url,
        identity:identities!alias_sessions_identity_id_fkey (
            id,
            user_id,
            display_name,
            avatar_url,
            role
        )
    ),
    comments (${commentSelectFields})
`;
const legacyPostSelectFields = `
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
        user_id,
        display_name,
        avatar_url,
        role
    ),
    alias_session:alias_sessions!posts_alias_session_id_fkey (
        id,
        slot_key,
        display_name,
        avatar_url,
        identity:identities!alias_sessions_identity_id_fkey (
            id,
            user_id,
            display_name,
            avatar_url,
            role
        )
    ),
    comments (${legacyCommentSelectFields})
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

const normalizeRevealParty = (value, fallbackName = "") => {
    if (!value && !fallbackName) {
        return null;
    }

    if (typeof value === "string") {
        const name = String(value).trim() || String(fallbackName || "").trim();
        return name
            ? {
                name,
                avatar: ""
            }
            : null;
    }

    if (value && typeof value === "object") {
        const name = String(
            value.name
            || value.memberName
            || value.display_name
            || fallbackName
            || ""
        ).trim();

        if (!name) {
            return null;
        }

        return {
            name,
            avatar: String(value.avatar || value.avatarUrl || value.avatar_url || "").trim()
        };
    }

    const name = String(fallbackName || "").trim();
    return name
        ? {
            name,
            avatar: ""
        }
        : null;
};

const normalizeRevealMap = (revealMap) => Object.fromEntries(
    Object.entries(revealMap && typeof revealMap === "object" ? revealMap : {})
        .map(([memberName, entry]) => {
            const normalizedMember = normalizeRevealParty(entry?.member, memberName);
            const normalizedAngel = normalizeRevealParty(entry?.angel || entry);
            if (!normalizedMember?.name || !normalizedAngel?.name) {
                return null;
            }

            return [
                normalizedMember.name,
                {
                    member: normalizedMember,
                    angel: normalizedAngel,
                    updatedAt: entry?.updatedAt || entry?.updated_at || null
                }
            ];
        })
        .filter(Boolean)
);

const normalizeChannel = (channel) => ({
    id: channel.id,
    slug: channel.slug,
    name: channel.name,
    description: channel.description || "",
    logoUrl: channel.logo_url || channel.logoUrl || defaultChannelLogo,
    backgroundUrl: channel.background_url || channel.backgroundUrl || defaultChannelBackground,
    previewVisibility: channel.preview_visibility || channel.visibility || "private",
    joinPolicy: channel.join_policy || "approval_required",
    currentRoundTheme: String(channel.current_round_theme || channel.currentRoundTheme || "").trim(),
    currentRoundGodProfile: channel.current_round_god_name || channel.currentRoundGodName
        ? {
            name: channel.current_round_god_name || channel.currentRoundGodName || "",
            avatar: channel.current_round_god_avatar || channel.currentRoundGodAvatar || ""
        }
        : null,
    currentRevealMap: normalizeRevealMap(channel.current_reveal_map || channel.currentRevealMap),
    isProvisioned: channel.id !== null
});

const isSchemaCompatibilityError = (error) => {
    const code = String(error?.code || "");
    const message = String(error?.message || "").toLowerCase();
    return ["42703", "42P01", "42883", "PGRST202", "PGRST204"].includes(code)
        || message.includes("does not exist")
        || message.includes("schema cache")
        || message.includes("could not find the")
        || message.includes("likes_count")
        || message.includes("parent_comment_id")
        || message.includes("deleted_at")
        || message.includes("deleted_snapshot");
};

const getFallbackAuthor = (type) => ({
    display_name: type === "alias" ? "匿名成员" : "频道成员",
    avatar_url: "",
    role: "member"
});

const extractRevealMeta = (media) => {
    const items = Array.isArray(media) ? media : [];
    const revealEntry = items.find((item) => item && typeof item === "object" && String(item.kind || "").trim().toLowerCase() === "reveal_meta");
    if (!revealEntry?.realName) {
        return null;
    }

    return {
        name: String(revealEntry.realName).trim(),
        avatar: String(revealEntry.realAvatar || memberAvatarByName.get(String(revealEntry.realName).trim()) || "").trim()
    };
};

const getAdminRevealIdentity = (aliasSession, media) => {
    const revealMeta = extractRevealMeta(media);
    if (revealMeta?.name) {
        return {
            id: aliasSession?.identity?.id || null,
            name: revealMeta.name,
            avatar: revealMeta.avatar || "",
            role: aliasSession?.identity?.role || "member"
        };
    }

    return aliasSession?.identity
        ? {
            id: aliasSession.identity.id,
            name: aliasSession.identity.display_name || "频道成员",
            avatar: aliasSession.identity.avatar_url || "",
            role: aliasSession.identity.role || "member"
        }
        : null;
};

const normalizeCommentRow = (commentRow) => {
    const author = commentRow.identity || commentRow.alias_session || getFallbackAuthor(commentRow.alias_session ? "alias" : "identity");
    const isDeleted = Boolean(commentRow.deleted_at);
    return {
        id: commentRow.id,
        authorName: author.display_name || "频道成员",
        authorAvatar: author.avatar_url || "",
        authorUserId: author.user_id || author.identity?.user_id || null,
        isAnonymous: !commentRow.identity,
        createdAt: commentRow.created_at,
        timeLabel: getRelativeTimeLabel(commentRow.created_at),
        likes: isDeleted ? 0 : (commentRow.likes_count || 0),
        parentCommentId: commentRow.parent_comment_id || null,
        text: isDeleted ? "该评论已删除" : commentRow.body,
        isDeleted,
        deletedAt: commentRow.deleted_at || null,
        deletedBy: commentRow.deleted_by || null,
        deletedByModerator: Boolean(commentRow.deleted_snapshot?.deleted_by_moderator),
        deletedLabel: isDeleted ? "该评论已删除" : "",
        adminRevealIdentity: getAdminRevealIdentity(commentRow.alias_session)
    };
};

const normalizeChannelRowCompatibility = (channel) => ({
    ...channel,
    preview_visibility: channel.preview_visibility || channel.visibility || "private",
    join_policy: channel.join_policy || "approval_required",
    current_round_theme: String(channel.current_round_theme || channel.currentRoundTheme || "").trim(),
    current_round_god_name: channel.current_round_god_name || channel.currentRoundGodName || null,
    current_round_god_avatar: channel.current_round_god_avatar || channel.currentRoundGodAvatar || "",
    current_reveal_map: channel.current_reveal_map && typeof channel.current_reveal_map === "object"
        ? channel.current_reveal_map
        : channel.currentRevealMap && typeof channel.currentRevealMap === "object"
            ? channel.currentRevealMap
            : {}
});

const normalizePostMedia = (media) => {
    const items = Array.isArray(media) ? media : [];
    const images = [];
    const audioClips = [];

    items.forEach((item, index) => {
        if (!item || typeof item !== "object") {
            return;
        }

        const normalizedKind = String(item.kind || "").trim().toLowerCase();
        if (normalizedKind === "audio") {
            audioClips.push({
                id: item.id || `audio-${index}`,
                kind: "audio",
                name: item.name || `语音 ${index + 1}`,
                url: item.url || "",
                mimeType: item.mimeType || "audio/webm"
            });
            return;
        }

        if (normalizedKind === "image" || !normalizedKind) {
            images.push({
                id: item.id || `image-${index}`,
                kind: "image",
                name: item.name || `图片 ${index + 1}`,
                url: item.url || ""
            });
        }
    });

    return { images, audioClips };
};

const normalizePostRow = (postRow) => {
    const author = postRow.identity || postRow.alias_session || getFallbackAuthor(postRow.alias_session ? "alias" : "identity");
    const isDeleted = Boolean(postRow.deleted_at);
    const media = normalizePostMedia(postRow.media);
    const comments = [...(postRow.comments || [])]
        .sort((left, right) => Date.parse(left.created_at) - Date.parse(right.created_at))
        .map(normalizeCommentRow);

    return {
        id: postRow.id,
        authorName: author.display_name || "频道成员",
        authorAvatar: author.avatar_url || "",
        authorUserId: author.user_id || author.identity?.user_id || null,
        createdAt: postRow.created_at,
        text: isDeleted ? "该帖子已删除" : postRow.body,
        images: isDeleted ? [] : media.images,
        audioClips: isDeleted ? [] : media.audioClips,
        board: postRow.board_slug || "none",
        isAnonymous: !postRow.identity,
        isDeleted,
        deletedAt: postRow.deleted_at || null,
        deletedBy: postRow.deleted_by || null,
        deletedByModerator: Boolean(postRow.deleted_snapshot?.deleted_by_moderator),
        deletedLabel: isDeleted ? "该帖子已删除" : "",
        role: postRow.identity?.role || postRow.alias_session?.identity?.role || "member",
        timeLabel: getRelativeTimeLabel(postRow.created_at),
        dateLabel: postRow.created_at.slice(0, 10),
        views: postRow.views_count,
        likes: isDeleted ? 0 : postRow.likes_count,
        shares: isDeleted ? 0 : postRow.shares_count,
        comments,
        aiDisclosure: isDeleted ? "none" : (postRow.ai_disclosure || "none"),
        adminRevealIdentity: getAdminRevealIdentity(postRow.alias_session, postRow.media)
    };
};

const buildClaimSelectionFromPost = (post) => {
    if (!post?.id) {
        return null;
    }

    const preview = getPostPreviewText(post, 88);
    return {
        postId: post.id,
        board: post.board || "wish",
        authorName: post.authorName || "匿名成员",
        authorAvatar: post.authorAvatar || "",
        previewText: preview.text || "",
        createdAt: post.createdAt || new Date().toISOString()
    };
};

const normalizeClaimSelection = (post) => {
    const selection = buildClaimSelectionFromPost(post);
    return selection?.postId ? selection : null;
};

const normalizeGuessSelection = (selection) => {
    const normalized = normalizeRevealParty(selection);
    if (!normalized?.name) {
        return null;
    }

    return {
        name: normalized.name,
        avatar: normalized.avatar || "",
        selectedAt: selection?.selectedAt || selection?.selected_at || null
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
        logo_url: defaultChannelLogo,
        background_url: defaultChannelBackground,
        created_by: null,
        preview_visibility: "public",
        join_policy: "approval_required",
        current_round_theme: "",
        current_round_god_name: null,
        current_round_god_avatar: ""
    });

    const getUserCacheKey = (snapshot) => {
        if (!snapshot?.user?.id || snapshot.isAnonymous) {
            return "guest";
        }
        return snapshot.user.id;
    };

    const syncChannelCaches = async (channelRow) => {
        const normalizedRow = normalizeChannelRowCompatibility(channelRow);
        const slug = normalizedRow.slug || runtimeConfig.channelSlug || "";
        runtimeState.channel = normalizedRow;
        writeSessionCache(getChannelShellCacheKey(slug), normalizedRow);

        const snapshot = await getSessionSnapshot();
        const memberCacheKey = getChannelMemberCacheKey(slug, getUserCacheKey(snapshot));
        const cachedMember = readSessionCache(memberCacheKey, channelMemberCacheTtl);
        if (!cachedMember?.memberRuntime) {
            return normalizedRow;
        }

        writeSessionCache(memberCacheKey, {
            ...cachedMember,
            memberRuntime: {
                ...cachedMember.memberRuntime,
                channel: normalizeChannel(normalizedRow)
            }
        });

        return normalizedRow;
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

    const ensureProfile = async (preferredDisplayName = "") => {
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

        const fallbackName = String(preferredDisplayName || "").trim() || (user.email ? user.email.split("@")[0] : "");
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

    const tryInvokeAnonymousAnonymizer = async ({
        text = "",
        purpose = "post",
        channelId = null,
        images = [],
        reshapeImages = false
    }) => {
        try {
            const client = getSupabaseClient();
            const normalizedText = String(text || "").trim();
            const normalizedImages = Array.isArray(images)
                ? images
                    .map((image) => ({
                        name: String(image?.name || ""),
                        url: String(image?.url || "")
                    }))
                    .filter((image) => image.url.startsWith("data:image/"))
                : [];

            if (!normalizedText && !normalizedImages.length) {
                return null;
            }

            const { data, error } = await client.functions.invoke("anonymous-anonymize", {
                body: {
                    text: normalizedText,
                    purpose,
                    channelId,
                    images: normalizedImages,
                    reshapeImages
                }
            });

            if (error) {
                return null;
            }

            if (typeof data?.text !== "string" || !data.text.trim()) {
                return null;
            }

            return {
                text: data.text.trim(),
                provider: typeof data.provider === "string" ? data.provider : "ai",
                images: Array.isArray(data?.images)
                    ? data.images
                        .map((image) => ({
                            name: String(image?.name || ""),
                            url: String(image?.url || "")
                        }))
                        .filter((image) => image.url.startsWith("data:image/"))
                    : []
            };
        } catch {
            return null;
        }
    };

    const fetchPosts = async (boardSlug = null) => {
        const client = getSupabaseClient();
        const channel = ensureLoadedChannel();
        const runQuery = (selectFields) => {
            let query = client
                .from("posts")
                .select(selectFields)
                .eq("channel_id", channel.id)
                .order("created_at", { ascending: false });

            if (boardSlug) {
                query = query.eq("board_slug", boardSlug);
            }

            return query;
        };

        let response = await runQuery(postSelectFields);
        if (response.error && isSchemaCompatibilityError(response.error)) {
            response = await runQuery(legacyPostSelectFields);
        }

        if (response.error) {
            throw response.error;
        }

        return cachePosts((response.data || []).map(normalizePostRow));
    };

    const fetchPostById = async (channelId, postId) => {
        const client = getSupabaseClient();
        let response = await client
            .from("posts")
            .select(postSelectFields)
            .eq("id", postId)
            .eq("channel_id", channelId)
            .single();

        if (response.error && isSchemaCompatibilityError(response.error)) {
            response = await client
                .from("posts")
                .select(legacyPostSelectFields)
                .eq("id", postId)
                .eq("channel_id", channelId)
                .single();
        }

        if (response.error) {
            throw response.error;
        }

        const post = normalizePostRow(response.data);
        postCache.set(post.id, post);
        return post;
    };

    const fetchIdentityRow = async ({ identityId = null, channelId = null, userId = null }) => {
        const client = getSupabaseClient();
        const runQuery = (selectFields) => {
            let query = client
                .from("identities")
                .select(selectFields);

            if (identityId) {
                return query.eq("id", identityId).single();
            }

            return query
                .eq("channel_id", channelId)
                .eq("user_id", userId)
                .single();
        };

        let response = await runQuery(identitySelectFields);
        if (response.error && isSchemaCompatibilityError(response.error)) {
            response = await runQuery(legacyIdentitySelectFields);
        }

        if (response.error) {
            throw response.error;
        }

        return {
            current_claim_post_id: null,
            current_claim_selected_at: null,
            current_guess_name: null,
            current_guess_avatar: null,
            current_guess_selected_at: null,
            ...response.data
        };
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
        const normalizedRows = [...(aliasRows || [])]
            .sort((left, right) => {
                const statusWeight = (right.status === "active") - (left.status === "active");
                if (statusWeight !== 0) {
                    return statusWeight;
                }

                const rightTime = Date.parse(right.last_used_at || right.created_at || 0);
                const leftTime = Date.parse(left.last_used_at || left.created_at || 0);
                return rightTime - leftTime;
            });

        if (!normalizedRows.length) {
            return defaultAnonymousProfiles.map((profile) => ({
                id: null,
                key: profile.key,
                name: profile.name,
                avatar: profile.avatar,
                status: "active"
            }));
        }

        return normalizedRows.map((alias, index) => {
            const fallbackProfile = defaultAnonymousProfiles[index % defaultAnonymousProfiles.length];
            return {
                id: alias.id || null,
                key: alias.slot_key,
                name: alias.display_name || fallbackProfile.name,
                avatar: alias.avatar_url || fallbackProfile.avatar,
                status: alias.status || "active"
            };
        });
    };

    const createAliasSlotKey = () => `slot-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

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
                    .select(minimalChannelSelectFields)
                    .eq("slug", slug)
                    .single();

                if (fallbackResponse.error) {
                    if (String(fallbackResponse.error.code || "") === "PGRST116") {
                        channelRow = createFallbackChannelRow(slug);
                    } else {
                        throw fallbackResponse.error;
                    }
                } else {
                    channelRow = normalizeChannelRowCompatibility(fallbackResponse.data);
                }
            }
        }

        const normalizedRow = normalizeChannelRowCompatibility(channelRow);
        runtimeState.channel = normalizedRow;
        writeSessionCache(getChannelShellCacheKey(slug), normalizedRow);
        return normalizedRow;
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
        const identity = await fetchIdentityRow({
            identityId: membership.identityId || null,
            channelId: channelRow.id,
            userId: snapshot.user.id
        });

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
        let claimSelection = null;
        if (identity.current_claim_post_id) {
            try {
                const selectedWishPost = await fetchPostById(channelRow.id, identity.current_claim_post_id);
                if (!selectedWishPost.isDeleted && selectedWishPost.board === "wish") {
                    claimSelection = normalizeClaimSelection(selectedWishPost);
                }
            } catch (error) {
                if (!isSchemaCompatibilityError(error) && String(error?.code || "") !== "PGRST116") {
                    throw error;
                }
            }
        }

        return {
            channel: normalizeChannel(channelRow),
            realIdentity: {
                id: identity.id,
                name: identity.display_name || defaultRealIdentity.name,
                avatar: identity.avatar_url || defaultRealIdentity.avatar,
                meta: defaultRealIdentity.meta,
                role: identity.role,
                currentGuess: normalizeGuessSelection({
                    name: identity.current_guess_name,
                    avatar: identity.current_guess_avatar || "",
                    selectedAt: identity.current_guess_selected_at || null
                })
            },
            anonymousProfiles: runtimeState.aliasProfiles,
            activeAliasKey: runtimeState.aliasProfiles.find((profile) => profile.status === "active" && profile.id)?.key
                || runtimeState.aliasProfiles[0]?.key
                || defaultAnonymousProfiles[0]?.key
                || null,
            claimSelection,
            guessSelection: normalizeGuessSelection({
                name: identity.current_guess_name,
                avatar: identity.current_guess_avatar || "",
                selectedAt: identity.current_guess_selected_at || null
            })
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
                    .select(minimalChannelSelectFields)
                    .eq("visibility", "public")
                    .order("created_at", { ascending: true });

                if (fallbackResponse.error) {
                    throw fallbackResponse.error;
                }

                rows = (fallbackResponse.data || []).map(normalizeChannelRowCompatibility);
            } else {
                rows = (response.data || []).map(normalizeChannelRowCompatibility);
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
                    .select(legacyIdentitySelectFields)
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
        async registerWithPassword(email, password, displayName = "") {
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

            const { data, error } = await client.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        display_name: displayName
                    }
                }
            });

            if (error) {
                throw error;
            }

            if (!data.session?.user) {
                const confirmationError = new Error("Supabase email confirmation is still enabled.");
                confirmationError.code = "auth_email_confirmation_required";
                throw confirmationError;
            }

            const nextSnapshot = await getSessionSnapshot();
            await ensureProfile(displayName);
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

            return fetchPostById(runtimeState.channel.id, postId);
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
                    media: input.media || input.images || [],
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
            let response = await client
                .from("comments")
                .insert({
                    post_id: input.postId,
                    channel_id: channel.id,
                    parent_comment_id: input.parentCommentId || null,
                    body: input.body,
                    ...authorReference
                })
                .select(commentSelectFields)
                .single();

            if (response.error && isSchemaCompatibilityError(response.error)) {
                response = await client
                    .from("comments")
                    .insert({
                        post_id: input.postId,
                        channel_id: channel.id,
                        body: input.body,
                        ...authorReference
                    })
                    .select(legacyCommentSelectFields)
                    .single();
            }

            if (response.error) {
                throw response.error;
            }

            postCache.delete(input.postId);
            return normalizeCommentRow(response.data);
        },
        async anonymizeAnonymousDraft(input) {
            return tryInvokeAnonymousAnonymizer(input);
        },
        async createAliasProfile(aliasKey, profile) {
            const client = getSupabaseClient();
            const aliasProfile = runtimeState.aliasProfiles.find((item) => item.key === aliasKey);
            if (!runtimeState.identity?.id || !runtimeState.channel?.id) {
                throw new Error("匿名马甲尚未初始化完成。");
            }

            if (aliasProfile?.id) {
                const retireResponse = await client
                    .from("alias_sessions")
                    .update({
                        status: "retired",
                        last_used_at: new Date().toISOString()
                    })
                    .eq("id", aliasProfile.id);

                if (retireResponse.error) {
                    throw retireResponse.error;
                }
            }

            const nextSlotKey = createAliasSlotKey();
            const { error: insertError } = await client
                .from("alias_sessions")
                .insert({
                    channel_id: runtimeState.channel.id,
                    identity_id: runtimeState.identity.id,
                    slot_key: nextSlotKey,
                    display_name: profile.name,
                    avatar_url: profile.avatar,
                    status: "active",
                    last_used_at: new Date().toISOString()
                })
                .select(aliasSelectFields)
                .single();

            if (insertError) {
                throw insertError;
            }

            const { data: aliasRows, error: listError } = await client
                .from("alias_sessions")
                .select(aliasSelectFields)
                .eq("channel_id", runtimeState.channel.id)
                .eq("identity_id", runtimeState.identity.id)
                .order("last_used_at", { ascending: false });

            if (listError) {
                throw listError;
            }

            runtimeState.aliasProfiles = mapAliasProfiles(aliasRows || []);
            return {
                profiles: runtimeState.aliasProfiles.map((item) => ({ ...item })),
                activeAliasKey: nextSlotKey
            };
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
        async likeComment(commentId, postId) {
            const client = getSupabaseClient();
            const { data, error } = await client.rpc("increment_comment_like", {
                target_comment_id: commentId
            });

            if (error) {
                throw error;
            }

            if (postId) {
                postCache.delete(postId);
            }
            return Number(data || 0);
        },
        async deletePost(postId) {
            const client = getSupabaseClient();
            const { data, error } = await client.rpc("soft_delete_post", {
                target_post_id: postId
            });

            if (error) {
                throw error;
            }

            const result = Array.isArray(data) ? data[0] || {} : data || {};
            const targetPostId = result.post_id || postId;
            postCache.delete(targetPostId);
            return this.getPost(targetPostId);
        },
        async deleteComment(commentId) {
            const client = getSupabaseClient();
            const { data, error } = await client.rpc("soft_delete_comment", {
                target_comment_id: commentId
            });

            if (error) {
                throw error;
            }

            const result = Array.isArray(data) ? data[0] || {} : data || {};
            const targetPostId = result.post_id || null;
            if (!targetPostId) {
                throw new Error("删除评论后无法定位所属帖子。");
            }

            postCache.delete(targetPostId);
            return this.getPost(targetPostId);
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
        },
        async updateChannel(input) {
            const channel = ensureLoadedChannel();
            const client = getSupabaseClient();
            const nextName = String(input.name || channel.name || "").trim();
            const nextDescription = String(input.description ?? channel.description ?? "").trim();
            const nextLogoUrl = input.logoUrl === ""
                ? defaultChannelLogo
                : String(input.logoUrl || channel.logo_url || channel.logoUrl || defaultChannelLogo);
            const nextBackgroundUrl = input.backgroundUrl === ""
                ? defaultChannelBackground
                : String(input.backgroundUrl || channel.background_url || channel.backgroundUrl || defaultChannelBackground);

            if (!nextName) {
                throw new Error("请输入频道名称。");
            }

            let nextChannelRow = {
                ...channel,
                name: nextName,
                description: nextDescription,
                logo_url: nextLogoUrl,
                background_url: nextBackgroundUrl
            };

            if (channel.id) {
                const { data, error } = await client
                    .from("channels")
                    .update({
                        name: nextName,
                        description: nextDescription || null
                    })
                    .eq("id", channel.id)
                    .select(channelSelectFields)
                    .single();

                if (error && !isSchemaCompatibilityError(error)) {
                    throw error;
                }

                if (data) {
                    nextChannelRow = {
                        ...data,
                        logo_url: nextLogoUrl,
                        background_url: nextBackgroundUrl
                    };
                }
            }

            const syncedChannelRow = await syncChannelCaches(nextChannelRow);

            return normalizeChannel(syncedChannelRow);
        },
        async updateChannelRoundState(input) {
            const channel = ensureLoadedChannel();
            const client = getSupabaseClient();
            const nextTheme = input.theme === undefined
                ? String(channel.current_round_theme || channel.currentRoundTheme || "").trim()
                : String(input.theme || "").trim();
            const nextGodName = input.godProfile === undefined
                ? channel.current_round_god_name || channel.currentRoundGodName || null
                : String(input.godProfile?.name || "").trim() || null;
            const nextGodAvatar = input.godProfile === undefined
                ? channel.current_round_god_avatar || channel.currentRoundGodAvatar || ""
                : String(input.godProfile?.avatar || "").trim();
            const nextRevealMap = input.revealMap === undefined
                ? normalizeRevealMap(channel.current_reveal_map || channel.currentRevealMap)
                : normalizeRevealMap(input.revealMap);

            if (!channel.id) {
                throw new Error("频道还没有初始化到数据库。");
            }

            let nextChannelRow = {
                ...channel,
                current_round_theme: nextTheme,
                current_round_god_name: nextGodName,
                current_round_god_avatar: nextGodAvatar,
                current_reveal_map: nextRevealMap
            };

            const { data, error } = await client
                .from("channels")
                .update({
                    current_round_theme: nextTheme || null,
                    current_round_god_name: nextGodName,
                    current_round_god_avatar: nextGodAvatar || null,
                    current_reveal_map: nextRevealMap,
                    updated_at: new Date().toISOString()
                })
                .eq("id", channel.id)
                .select(channelSelectFields)
                .single();

            if (error) {
                if (isSchemaCompatibilityError(error)) {
                    throw new Error("频道轮次字段还没同步到数据库，请先应用最新 migration。");
                }
                throw error;
            }

            if (data) {
                nextChannelRow = {
                    ...channel,
                    ...data,
                    logo_url: channel.logo_url || channel.logoUrl || defaultChannelLogo,
                    background_url: channel.background_url || channel.backgroundUrl || defaultChannelBackground
                };
            }

            const syncedChannelRow = await syncChannelCaches(nextChannelRow);

            return normalizeChannel(syncedChannelRow);
        },
        async saveClaimSelection(post) {
            if (!runtimeState.channel?.id || !runtimeState.authUser?.id || !runtimeState.identity?.id) {
                throw new Error("频道成员状态还没有初始化完成。");
            }

            const channel = ensureLoadedChannel();
            const selectedWishPost = await fetchPostById(channel.id, post?.id);
            if (selectedWishPost.isDeleted || selectedWishPost.board !== "wish") {
                throw new Error("当前愿望内容无效，无法选择。");
            }

            if (selectedWishPost.authorUserId === runtimeState.authUser.id) {
                throw new Error("不能选择自己发的愿望。");
            }

            const client = getSupabaseClient();
            const { error } = await client
                .from("identities")
                .update({
                    current_claim_post_id: selectedWishPost.id,
                    current_claim_selected_at: new Date().toISOString()
                })
                .eq("id", runtimeState.identity.id);

            if (error) {
                if (isSchemaCompatibilityError(error)) {
                    throw new Error("选愿望字段还没同步到数据库，请先应用最新 migration。");
                }
                throw error;
            }

            runtimeState.identity = {
                ...runtimeState.identity,
                current_claim_post_id: selectedWishPost.id,
                current_claim_selected_at: new Date().toISOString()
            };

            const selection = normalizeClaimSelection(selectedWishPost);
            return selection;
        },
        async clearClaimSelection() {
            if (!runtimeState.channel?.id || !runtimeState.authUser?.id || !runtimeState.identity?.id) {
                return;
            }

            const client = getSupabaseClient();
            const { error } = await client
                .from("identities")
                .update({
                    current_claim_post_id: null,
                    current_claim_selected_at: null
                })
                .eq("id", runtimeState.identity.id);

            if (error && !isSchemaCompatibilityError(error)) {
                throw error;
            }

            runtimeState.identity = {
                ...runtimeState.identity,
                current_claim_post_id: null,
                current_claim_selected_at: null
            };
        },
        async saveGuessSelection(member) {
            if (!runtimeState.authUser?.id || !runtimeState.identity?.id) {
                throw new Error("频道成员状态还没有初始化完成。");
            }

            const selection = normalizeGuessSelection(member);
            if (!selection?.name) {
                throw new Error("先选择你猜的是谁。");
            }

            const currentName = String(runtimeState.identity.display_name || runtimeState.realIdentity?.name || "").trim();
            if (currentName && selection.name === currentName) {
                throw new Error("不能把自己设成猜测对象。");
            }

            const client = getSupabaseClient();
            const selectedAt = new Date().toISOString();
            const { error } = await client
                .from("identities")
                .update({
                    current_guess_name: selection.name,
                    current_guess_avatar: selection.avatar || null,
                    current_guess_selected_at: selectedAt
                })
                .eq("id", runtimeState.identity.id);

            if (error) {
                if (isSchemaCompatibilityError(error)) {
                    throw new Error("猜测字段还没同步到数据库，请先应用最新 migration。");
                }
                throw error;
            }

            runtimeState.identity = {
                ...runtimeState.identity,
                current_guess_name: selection.name,
                current_guess_avatar: selection.avatar || "",
                current_guess_selected_at: selectedAt
            };

            return {
                ...selection,
                selectedAt
            };
        },
        async clearGuessSelection() {
            if (!runtimeState.authUser?.id || !runtimeState.identity?.id) {
                return;
            }

            const client = getSupabaseClient();
            const { error } = await client
                .from("identities")
                .update({
                    current_guess_name: null,
                    current_guess_avatar: null,
                    current_guess_selected_at: null
                })
                .eq("id", runtimeState.identity.id);

            if (error && !isSchemaCompatibilityError(error)) {
                throw error;
            }

            runtimeState.identity = {
                ...runtimeState.identity,
                current_guess_name: null,
                current_guess_avatar: null,
                current_guess_selected_at: null
            };
        }
    };

    thisApi = api;
    return api;
};

export const channelDataService = createChannelDataService();
