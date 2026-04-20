import { createAuthActions } from "./auth/index.js";
import { createChannelCreateActions } from "./channel-create/index.js";
import { createComposerActions } from "./composer/index.js";
import { createFeedActions } from "./feed/index.js";
import { createMembershipActions } from "./membership/index.js";
import { createRuntimeActions } from "./runtime/index.js";
import { createShellActions } from "./shell/index.js";

export const createAppActions = ({ store, dataService }) => {
    let toastTimer = null;

    const showToast = ({ tone = "info", message }) => {
        store.dispatch({
            type: "toast/show",
            payload: { tone, message }
        });

        if (toastTimer) {
            window.clearTimeout(toastTimer);
        }

        toastTimer = window.setTimeout(() => {
            store.dispatch({ type: "toast/hide" });
        }, 3200);
    };

    const hideToast = () => {
        if (toastTimer) {
            window.clearTimeout(toastTimer);
            toastTimer = null;
        }
        store.dispatch({ type: "toast/hide" });
    };

    const shellActions = createShellActions({ store });
    const feedActions = createFeedActions({ store, dataService, showToast });
    const runtimeActions = createRuntimeActions({ store, dataService, showToast, feedActions });
    const channelCreateActions = createChannelCreateActions({ store, dataService, showToast });
    const composerActions = createComposerActions({ store, dataService, showToast, feedActions });
    const authActions = createAuthActions({ store, dataService, showToast, runtimeActions });
    const membershipActions = createMembershipActions({ store, dataService, showToast, runtimeActions });

    return {
        ...shellActions,
        ...feedActions,
        ...composerActions,
        ...authActions,
        ...membershipActions,
        ...runtimeActions,
        ...channelCreateActions,
        openOverlay(name, payload = {}) {
            if (name === "comments" && payload.postId) {
                this.openComments(payload.postId, payload.source || "comments");
                return;
            }
            if (name === "channel-menu") {
                this.openChannelMenu(payload);
                return;
            }
            if (name === "notification-center") {
                this.openNotificationCenter(payload.tab || "interaction", payload);
                return;
            }
            if (name === "identity") {
                this.openIdentityDialog();
                return;
            }
            if (name === "auth-gate") {
                this.openAuthGate(payload.mode || "login");
            }
        },
        closeOverlay(name) {
            if (name === "comments") {
                this.closeComments();
                return;
            }
            if (name === "channel-menu") {
                this.closeChannelMenu();
                return;
            }
            if (name === "notification-center") {
                this.closeNotificationCenter();
                return;
            }
            if (name === "identity") {
                this.closeIdentityDialog();
                return;
            }
            if (name === "auth-gate") {
                this.closeAuthGate();
            }
        },
        showToast,
        hideToast
    };
};
