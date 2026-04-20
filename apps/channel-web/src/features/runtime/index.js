import { getChannelActionErrorMessage } from "../../shared/lib/helpers.js";
import { runtimeConfig } from "../../shared/config/runtime-config.js";

const getChannelSlug = () => new URLSearchParams(window.location.search).get("channel")
    || runtimeConfig.channelSlug
    || "";

const getGuestMembershipState = () => ({
    status: "guest",
    joinRequest: null,
    reviewItems: [],
    reviewStatus: "idle",
    submitStatus: "idle",
    error: null
});

const applyBootstrapSnapshot = ({ store, bootstrap, source = "network", phase = "ready" }) => {
    const auth = bootstrap.auth || { user: null, isAnonymous: false };
    const isGuest = !auth.user || auth.isAnonymous;

    if (isGuest) {
        store.dispatch({
            type: "auth/set-state",
            payload: {
                status: "guest",
                user: null,
                isAnonymous: false,
                error: null,
                password: ""
            }
        });
        store.dispatch({
            type: "membership/set-state",
            payload: getGuestMembershipState()
        });
        store.dispatch({
            type: "runtime/preview-ready",
            payload: {
                channel: bootstrap.channel,
                source,
                phase
            }
        });
        return;
    }

    store.dispatch({
        type: "auth/set-state",
        payload: {
            status: "authenticated",
            user: auth.user,
            isAnonymous: false,
            error: null
        }
    });

    const membership = bootstrap.membership || getGuestMembershipState();
    store.dispatch({
        type: "membership/set-state",
        payload: {
            status: membership.status,
            joinRequest: membership.joinRequest,
            reviewItems: membership.reviewItems || [],
            reviewStatus: "idle",
            submitStatus: "idle",
            error: null
        }
    });

    if (membership.status === "approved" && bootstrap.memberRuntime) {
        store.dispatch({
            type: "runtime/member-ready",
            payload: {
                ...bootstrap.memberRuntime,
                source,
                phase
            }
        });
        return;
    }

    store.dispatch({
        type: "runtime/preview-ready",
        payload: {
            channel: bootstrap.channel,
            source,
            phase
        }
    });
};

export const createRuntimeActions = ({ store, dataService, showToast, feedActions }) => ({
    async loadPublicChannelPreview(slug = getChannelSlug()) {
        const channel = await dataService.loadPublicChannelPreview(slug);
        store.dispatch({
            type: "runtime/preview-ready",
            payload: { channel }
        });
        return channel;
    },
    async loadMembershipState(channelId = store.getState().runtimeState.channel?.id) {
        if (!channelId) {
            return {
                status: "guest",
                joinRequest: null,
                reviewItems: [],
                role: null
            };
        }

        const membership = await dataService.loadMembershipState(channelId);
        store.dispatch({
            type: "membership/set-state",
            payload: {
                status: membership.status,
                joinRequest: membership.joinRequest,
                reviewItems: membership.reviewItems || [],
                reviewStatus: "idle",
                submitStatus: "idle",
                error: null
            }
        });
        return membership;
    },
    async loadApprovedMemberRuntime(channelId = store.getState().runtimeState.channel?.id) {
        if (!channelId) {
            throw new Error("频道还没有初始化完成。");
        }

        const runtime = await dataService.loadApprovedMemberRuntime(channelId);
        store.dispatch({
            type: "runtime/member-ready",
            payload: runtime
        });
        return runtime;
    },
    async refreshChannelAccessState({ reloadFeed = false, channel = null } = {}) {
        const slug = channel?.slug || store.getState().runtimeState.channel?.slug || getChannelSlug();
        const bootstrap = await dataService.loadChannelBootstrap(slug);
        applyBootstrapSnapshot({
            store,
            bootstrap,
            source: "network",
            phase: "ready"
        });
        store.dispatch({ type: "auth-gate/close" });

        if (reloadFeed) {
            await feedActions.loadFeed(store.getState().feedState.activeBoard);
        }
    },
    async initializeChannelRuntime() {
        const slug = getChannelSlug();
        const shellChannel = dataService.getChannelShell(slug);
        store.dispatch({
            type: "runtime/shell-ready",
            payload: {
                channel: shellChannel,
                source: shellChannel?.id ? "cache" : "runtime-config"
            }
        });
        store.dispatch({ type: "runtime/hydrate-start" });

        try {
            const cachedBootstrap = await dataService.getCachedChannelBootstrap(slug);
            let feedPromise = null;

            if (cachedBootstrap) {
                applyBootstrapSnapshot({
                    store,
                    bootstrap: cachedBootstrap,
                    source: "cache",
                    phase: "hydrating"
                });
                if (cachedBootstrap.channel?.id) {
                    feedPromise = feedActions.loadFeed(store.getState().feedState.activeBoard);
                }
            } else if (shellChannel?.id) {
                feedPromise = feedActions.loadFeed(store.getState().feedState.activeBoard);
            }

            const bootstrap = await dataService.loadChannelBootstrap(slug);
            applyBootstrapSnapshot({
                store,
                bootstrap,
                source: "network",
                phase: "ready"
            });

            if (feedPromise) {
                await feedPromise;
            } else if (bootstrap.channel?.id) {
                await feedActions.loadFeed(store.getState().feedState.activeBoard);
            }

            store.dispatch({ type: "auth-gate/close" });
        } catch (error) {
            const message = getChannelActionErrorMessage("init_runtime", error);
            store.dispatch({
                type: "runtime/initialize-error",
                payload: { error: message }
            });
            showToast({
                tone: "error",
                message
            });
        }
    }
});
