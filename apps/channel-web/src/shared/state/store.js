import { boardTabs, feedFilterChoices } from "../../entities/channel/config.js";
import { defaultAnonymousProfiles, defaultRealIdentity } from "../../entities/identity/config.js";

const firstBoard = boardTabs[0]?.value || "all";
const firstFilter = feedFilterChoices[0]?.value || "hot";
const firstAliasKey = defaultAnonymousProfiles[0]?.key || null;

const cloneSimple = (value) => (value ? { ...value } : value);

export const createInitialState = () => ({
    runtimeState: {
        status: "idle",
        phase: "idle",
        hydrationSource: "runtime-config",
        blockingError: null,
        channel: null,
        realIdentity: { ...defaultRealIdentity },
        anonymousProfiles: defaultAnonymousProfiles.map((profile) => ({ ...profile })),
        activeAliasKey: firstAliasKey
    },
    authState: {
        status: "unknown",
        user: null,
        isAnonymous: false,
        email: "",
        password: "",
        error: null
    },
    membershipState: {
        status: "unknown",
        joinRequest: null,
        reviewItems: [],
        reviewStatus: "idle",
        submitStatus: "idle",
        draftMessage: "",
        error: null
    },
    channelCreateState: {
        name: "",
        description: "",
        status: "idle",
        error: null
    },
    feedState: {
        status: "idle",
        items: [],
        error: null,
        activeBoard: firstBoard,
        activeFilter: firstFilter,
        searchQuery: "",
        likedPostIds: []
    },
    composerState: {
        expanded: false,
        draftText: "",
        images: [],
        nextImageId: 1,
        aiDisclosure: "none",
        board: "none",
        anonymousMode: false,
        autoRotate: false,
        aiImageReshape: false,
        submitStatus: "idle",
        error: null,
        mentionOpen: false,
        aiDisclosureOpen: false,
        boardOpen: false
    },
    overlayState: {
        comments: {
            open: false,
            postId: null,
            openSource: "comments",
            post: null,
            status: "idle",
            error: null,
            sort: "hot",
            likedCommentIds: [],
            replyTarget: null,
            draftText: "",
            anonymousMode: false,
            submitStatus: "idle",
            initialFocusTarget: null
        },
        channelMenu: {
            open: false,
            anchorX: null,
            anchorY: null,
            anchorSource: ""
        },
        notificationCenter: {
            open: false,
            tab: "interaction",
            anchorX: null,
            anchorY: null,
            anchorSource: ""
        },
        identity: {
            open: false,
            draftName: defaultRealIdentity.name,
            draftAvatar: defaultRealIdentity.avatar,
            saveStatus: "idle",
            error: null
        },
        authGate: {
            open: false,
            mode: "login"
        },
        toast: {
            visible: false,
            tone: "info",
            message: ""
        }
    },
    uiState: {
        sidebarOpen: false,
        topRegion: "expanded",
        accountMenuOpen: false,
        searchFocusNonce: 0,
        adminRevealAnonymous: false
    }
});

const cloneState = (state) => ({
    ...state,
    runtimeState: {
        ...state.runtimeState,
        channel: cloneSimple(state.runtimeState.channel),
        realIdentity: { ...state.runtimeState.realIdentity },
        anonymousProfiles: state.runtimeState.anonymousProfiles.map((profile) => ({ ...profile }))
    },
    authState: {
        ...state.authState,
        user: cloneSimple(state.authState.user)
    },
    membershipState: {
        ...state.membershipState,
        joinRequest: cloneSimple(state.membershipState.joinRequest),
        reviewItems: state.membershipState.reviewItems.map((item) => ({ ...item }))
    },
    channelCreateState: {
        ...state.channelCreateState
    },
    feedState: {
        ...state.feedState,
        likedPostIds: [...state.feedState.likedPostIds],
        items: state.feedState.items.map((post) => ({
            ...post,
            images: [...(post.images || [])],
            comments: (post.comments || []).map((comment) => ({ ...comment }))
        }))
    },
    composerState: {
        ...state.composerState,
        images: state.composerState.images.map((image) => ({ ...image }))
    },
    overlayState: {
        comments: {
            ...state.overlayState.comments,
            likedCommentIds: [...state.overlayState.comments.likedCommentIds],
            replyTarget: cloneSimple(state.overlayState.comments.replyTarget),
            post: state.overlayState.comments.post
                ? {
                    ...state.overlayState.comments.post,
                    images: [...(state.overlayState.comments.post.images || [])],
                    comments: (state.overlayState.comments.post.comments || []).map((comment) => ({ ...comment }))
                }
                : null
        },
        channelMenu: { ...state.overlayState.channelMenu },
        notificationCenter: { ...state.overlayState.notificationCenter },
        identity: { ...state.overlayState.identity },
        authGate: { ...state.overlayState.authGate },
        toast: { ...state.overlayState.toast }
    },
    uiState: { ...state.uiState }
});

const resetMemberRuntime = (draft) => {
    draft.runtimeState.realIdentity = { ...defaultRealIdentity };
    draft.runtimeState.anonymousProfiles = defaultAnonymousProfiles.map((profile) => ({ ...profile }));
    draft.runtimeState.activeAliasKey = firstAliasKey;
    draft.composerState.expanded = false;
    draft.composerState.anonymousMode = false;
    draft.composerState.autoRotate = false;
    draft.composerState.aiImageReshape = false;
};

const applyAction = (draft, action) => {
    switch (action.type) {
    case "runtime/initialize-start":
        draft.runtimeState.phase = "hydrating";
        draft.runtimeState.blockingError = null;
        return;
    case "runtime/shell-ready":
        draft.runtimeState.status = "preview";
        draft.runtimeState.phase = "shell";
        draft.runtimeState.hydrationSource = action.payload.source || "runtime-config";
        draft.runtimeState.blockingError = null;
        draft.runtimeState.channel = cloneSimple(action.payload.channel);
        resetMemberRuntime(draft);
        return;
    case "runtime/hydrate-start":
        draft.runtimeState.phase = "hydrating";
        draft.runtimeState.blockingError = null;
        return;
    case "runtime/preview-ready":
        draft.runtimeState.status = "preview";
        draft.runtimeState.phase = action.payload.phase || "ready";
        draft.runtimeState.hydrationSource = action.payload.source || draft.runtimeState.hydrationSource;
        draft.runtimeState.blockingError = null;
        draft.runtimeState.channel = cloneSimple(action.payload.channel);
        resetMemberRuntime(draft);
        return;
    case "runtime/member-ready":
        draft.runtimeState.status = "ready";
        draft.runtimeState.phase = action.payload.phase || "ready";
        draft.runtimeState.hydrationSource = action.payload.source || draft.runtimeState.hydrationSource;
        draft.runtimeState.blockingError = null;
        draft.runtimeState.channel = cloneSimple(action.payload.channel);
        draft.runtimeState.realIdentity = { ...action.payload.realIdentity };
        draft.runtimeState.anonymousProfiles = action.payload.anonymousProfiles.map((profile) => ({ ...profile }));
        draft.runtimeState.activeAliasKey = action.payload.activeAliasKey
            || action.payload.anonymousProfiles[0]?.key
            || firstAliasKey;
        draft.overlayState.identity.draftName = action.payload.realIdentity.name;
        draft.overlayState.identity.draftAvatar = action.payload.realIdentity.avatar;
        return;
    case "runtime/initialize-error":
        draft.runtimeState.phase = "error";
        draft.runtimeState.blockingError = action.payload.error;
        return;
    case "runtime/set-alias-key":
        draft.runtimeState.activeAliasKey = action.payload.key;
        return;
    case "runtime/set-alias-profiles":
        draft.runtimeState.anonymousProfiles = action.payload.profiles.map((profile) => ({ ...profile }));
        if (!draft.runtimeState.anonymousProfiles.some((profile) => profile.key === draft.runtimeState.activeAliasKey)) {
            draft.runtimeState.activeAliasKey = draft.runtimeState.anonymousProfiles[0]?.key || null;
        }
        return;
    case "runtime/update-identity":
        draft.runtimeState.realIdentity = { ...draft.runtimeState.realIdentity, ...action.payload.identity };
        draft.overlayState.identity.draftName = draft.runtimeState.realIdentity.name;
        draft.overlayState.identity.draftAvatar = draft.runtimeState.realIdentity.avatar;
        return;
    case "auth/set-state":
        draft.authState = {
            ...draft.authState,
            ...action.payload,
            user: action.payload.user === undefined ? draft.authState.user : cloneSimple(action.payload.user)
        };
        return;
    case "auth/set-field":
        Object.assign(draft.authState, action.payload);
        return;
    case "auth/reset-flow":
        draft.authState.email = "";
        draft.authState.password = "";
        draft.authState.error = null;
        if (action.payload?.status) {
            draft.authState.status = action.payload.status;
        }
        return;
    case "membership/set-state":
        draft.membershipState = {
            ...draft.membershipState,
            ...action.payload,
            joinRequest: action.payload.joinRequest === undefined
                ? draft.membershipState.joinRequest
                : cloneSimple(action.payload.joinRequest),
            reviewItems: action.payload.reviewItems === undefined
                ? draft.membershipState.reviewItems.map((item) => ({ ...item }))
                : action.payload.reviewItems.map((item) => ({ ...item }))
        };
        return;
    case "membership/set-field":
        Object.assign(draft.membershipState, action.payload);
        return;
    case "membership/set-submit-status":
        draft.membershipState.submitStatus = action.payload.status;
        return;
    case "membership/set-review-status":
        draft.membershipState.reviewStatus = action.payload.status;
        return;
    case "channel-create/set-field":
        Object.assign(draft.channelCreateState, action.payload);
        return;
    case "channel-create/submit-start":
        draft.channelCreateState.status = "submitting";
        draft.channelCreateState.error = null;
        return;
    case "channel-create/submit-error":
        draft.channelCreateState.status = "idle";
        draft.channelCreateState.error = action.payload.error;
        return;
    case "channel-create/reset":
        draft.channelCreateState.name = "";
        draft.channelCreateState.description = "";
        draft.channelCreateState.status = "idle";
        draft.channelCreateState.error = null;
        return;
    case "feed/set-board":
        draft.feedState.activeBoard = action.payload.board;
        return;
    case "feed/set-filter":
        draft.feedState.activeFilter = action.payload.filter;
        return;
    case "feed/set-search-query":
        draft.feedState.searchQuery = action.payload.searchQuery;
        return;
    case "feed/load-start":
        draft.feedState.status = "loading";
        draft.feedState.error = null;
        return;
    case "feed/load-success":
        draft.feedState.status = action.payload.items.length ? "ready" : "empty";
        draft.feedState.error = null;
        draft.feedState.items = action.payload.items.map((item) => ({ ...item }));
        return;
    case "feed/load-error":
        draft.feedState.status = "error";
        draft.feedState.error = action.payload.error;
        return;
    case "feed/mark-liked":
        if (!draft.feedState.likedPostIds.includes(action.payload.postId)) {
            draft.feedState.likedPostIds.push(action.payload.postId);
        }
        draft.feedState.items = draft.feedState.items.map((item) => (
            item.id === action.payload.postId
                ? { ...item, likes: action.payload.likes }
                : item
        ));
        if (draft.overlayState.comments.post?.id === action.payload.postId) {
            draft.overlayState.comments.post = {
                ...draft.overlayState.comments.post,
                likes: action.payload.likes
            };
        }
        return;
    case "composer/set-field":
        Object.assign(draft.composerState, action.payload);
        return;
    case "composer/expand":
        draft.composerState.expanded = true;
        return;
    case "composer/collapse":
        draft.composerState.expanded = false;
        draft.composerState.aiDisclosureOpen = false;
        return;
    case "composer/add-images":
        draft.composerState.images.push(...action.payload.images.map((image) => ({ ...image })));
        draft.composerState.nextImageId = action.payload.nextImageId;
        draft.composerState.expanded = true;
        return;
    case "composer/remove-image":
        draft.composerState.images = draft.composerState.images.filter((image) => image.id !== action.payload.id);
        return;
    case "composer/reset":
        draft.composerState.expanded = false;
        draft.composerState.draftText = "";
        draft.composerState.images = [];
        draft.composerState.aiDisclosure = "none";
        draft.composerState.board = "none";
        draft.composerState.aiImageReshape = false;
        draft.composerState.submitStatus = "idle";
        draft.composerState.error = null;
        draft.composerState.mentionOpen = false;
        draft.composerState.aiDisclosureOpen = false;
        draft.composerState.boardOpen = false;
        return;
    case "composer/toggle-anonymous":
        draft.composerState.anonymousMode = !draft.composerState.anonymousMode;
        if (draft.composerState.anonymousMode) {
            draft.composerState.aiDisclosure = "none";
            draft.composerState.aiDisclosureOpen = false;
        } else {
            draft.composerState.autoRotate = false;
            draft.composerState.aiImageReshape = false;
        }
        return;
    case "composer/submit-start":
        draft.composerState.submitStatus = "submitting";
        draft.composerState.error = null;
        return;
    case "composer/submit-error":
        draft.composerState.submitStatus = "idle";
        draft.composerState.error = action.payload.error;
        return;
    case "comments/open":
        draft.overlayState.comments.open = true;
        draft.overlayState.comments.postId = action.payload.postId;
        draft.overlayState.comments.openSource = action.payload.source || "comments";
        draft.overlayState.comments.initialFocusTarget = action.payload.source === "comments" ? "comment-input" : "post-body";
        draft.overlayState.comments.status = "loading";
        draft.overlayState.comments.error = null;
        draft.overlayState.comments.post = null;
        draft.overlayState.comments.likedCommentIds = [];
        draft.overlayState.comments.replyTarget = null;
        draft.overlayState.comments.draftText = "";
        draft.overlayState.comments.anonymousMode = false;
        draft.overlayState.comments.submitStatus = "idle";
        return;
    case "comments/close":
        draft.overlayState.comments.open = false;
        draft.overlayState.comments.postId = null;
        draft.overlayState.comments.openSource = "comments";
        draft.overlayState.comments.initialFocusTarget = null;
        draft.overlayState.comments.post = null;
        draft.overlayState.comments.status = "idle";
        draft.overlayState.comments.error = null;
        draft.overlayState.comments.draftText = "";
        draft.overlayState.comments.likedCommentIds = [];
        draft.overlayState.comments.replyTarget = null;
        draft.overlayState.comments.anonymousMode = false;
        draft.overlayState.comments.submitStatus = "idle";
        return;
    case "comments/load-success":
        draft.overlayState.comments.status = "ready";
        draft.overlayState.comments.error = null;
        draft.overlayState.comments.post = { ...action.payload.post };
        return;
    case "comments/load-error":
        draft.overlayState.comments.status = "error";
        draft.overlayState.comments.error = action.payload.error;
        draft.overlayState.comments.post = null;
        return;
    case "comments/set-field":
        Object.assign(draft.overlayState.comments, action.payload);
        return;
    case "comments/like":
        if (!draft.overlayState.comments.likedCommentIds.includes(action.payload.commentId)) {
            draft.overlayState.comments.likedCommentIds.push(action.payload.commentId);
        }
        if (draft.overlayState.comments.post) {
            draft.overlayState.comments.post = {
                ...draft.overlayState.comments.post,
                comments: draft.overlayState.comments.post.comments.map((comment) => (
                    comment.id === action.payload.commentId
                        ? { ...comment, likes: action.payload.likes ?? ((comment.likes || 0) + 1) }
                        : comment
                ))
            };
        }
        return;
    case "comments/submit-start":
        draft.overlayState.comments.submitStatus = "submitting";
        return;
    case "comments/submit-finish":
        draft.overlayState.comments.submitStatus = "idle";
        if (action.payload?.clearDraft) {
            draft.overlayState.comments.draftText = "";
            draft.overlayState.comments.replyTarget = null;
        }
        return;
    case "channel-menu/open":
        draft.overlayState.channelMenu.open = true;
        draft.overlayState.channelMenu.anchorX = action.payload?.anchorX ?? null;
        draft.overlayState.channelMenu.anchorY = action.payload?.anchorY ?? null;
        draft.overlayState.channelMenu.anchorSource = action.payload?.anchorSource || "";
        return;
    case "channel-menu/close":
        draft.overlayState.channelMenu.open = false;
        draft.overlayState.channelMenu.anchorX = null;
        draft.overlayState.channelMenu.anchorY = null;
        draft.overlayState.channelMenu.anchorSource = "";
        return;
    case "notification-center/open":
        draft.overlayState.notificationCenter.open = true;
        draft.overlayState.notificationCenter.tab = action.payload?.tab || draft.overlayState.notificationCenter.tab;
        draft.overlayState.notificationCenter.anchorX = action.payload?.anchorX ?? null;
        draft.overlayState.notificationCenter.anchorY = action.payload?.anchorY ?? null;
        draft.overlayState.notificationCenter.anchorSource = action.payload?.anchorSource || "";
        return;
    case "notification-center/close":
        draft.overlayState.notificationCenter.open = false;
        draft.overlayState.notificationCenter.anchorX = null;
        draft.overlayState.notificationCenter.anchorY = null;
        draft.overlayState.notificationCenter.anchorSource = "";
        return;
    case "notification-center/set-tab":
        draft.overlayState.notificationCenter.tab = action.payload.tab;
        return;
    case "identity/open":
        draft.overlayState.identity.open = true;
        draft.overlayState.identity.saveStatus = "idle";
        draft.overlayState.identity.error = null;
        draft.overlayState.identity.draftName = draft.runtimeState.realIdentity.name;
        draft.overlayState.identity.draftAvatar = draft.runtimeState.realIdentity.avatar;
        return;
    case "identity/close":
        draft.overlayState.identity.open = false;
        draft.overlayState.identity.saveStatus = "idle";
        draft.overlayState.identity.error = null;
        draft.overlayState.identity.draftName = draft.runtimeState.realIdentity.name;
        draft.overlayState.identity.draftAvatar = draft.runtimeState.realIdentity.avatar;
        return;
    case "identity/set-field":
        Object.assign(draft.overlayState.identity, action.payload);
        return;
    case "identity/save-start":
        draft.overlayState.identity.saveStatus = "saving";
        draft.overlayState.identity.error = null;
        return;
    case "identity/save-error":
        draft.overlayState.identity.saveStatus = "idle";
        draft.overlayState.identity.error = action.payload.error;
        return;
    case "identity/save-finish":
        draft.overlayState.identity.saveStatus = "idle";
        draft.overlayState.identity.open = false;
        draft.overlayState.identity.error = null;
        return;
    case "auth-gate/open":
        draft.overlayState.authGate.open = true;
        draft.overlayState.authGate.mode = action.payload.mode || "login";
        draft.authState.error = null;
        return;
    case "auth-gate/close":
        draft.overlayState.authGate.open = false;
        draft.authState.error = null;
        return;
    case "toast/show":
        draft.overlayState.toast = {
            visible: true,
            tone: action.payload.tone || "info",
            message: action.payload.message
        };
        return;
    case "toast/hide":
        draft.overlayState.toast.visible = false;
        return;
    case "ui/set-sidebar":
        draft.uiState.sidebarOpen = action.payload.open;
        return;
    case "ui/set-top-region":
        draft.uiState.topRegion = action.payload.value;
        return;
    case "ui/set-account-menu":
        draft.uiState.accountMenuOpen = action.payload.open;
        return;
    case "ui/request-search-focus":
        draft.uiState.searchFocusNonce += 1;
        return;
    case "ui/toggle-admin-reveal-anonymous":
        draft.uiState.adminRevealAnonymous = !draft.uiState.adminRevealAnonymous;
        return;
    default:
        return;
    }
};

export const createStore = (initialState = createInitialState()) => {
    let state = cloneState(initialState);
    const listeners = new Set();

    return {
        getState() {
            return state;
        },
        dispatch(action) {
            const nextState = cloneState(state);
            applyAction(nextState, action);
            state = nextState;
            listeners.forEach((listener) => {
                listener(state, action);
            });
        },
        subscribe(listener) {
            listeners.add(listener);
            return () => {
                listeners.delete(listener);
            };
        }
    };
};
