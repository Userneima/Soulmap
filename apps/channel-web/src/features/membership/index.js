import { getChannelActionErrorMessage } from "../../shared/lib/helpers.js";

export const createMembershipActions = ({ store, dataService, showToast, runtimeActions }) => ({
    setMembershipField(partial) {
        store.dispatch({
            type: "membership/set-field",
            payload: partial
        });
    },
    async submitJoinRequest(
        channelId = store.getState().runtimeState.channel?.id,
        message = store.getState().membershipState.draftMessage.trim()
    ) {
        const authState = store.getState().authState;
        if (!channelId) {
            return;
        }

        if (authState.status === "guest") {
            store.dispatch({
                type: "auth-gate/open",
                payload: { mode: "login" }
            });
            return;
        }

        if (authState.status === "upgrading_legacy_anonymous") {
            store.dispatch({
                type: "auth-gate/open",
                payload: { mode: "upgrade" }
            });
            return;
        }

        store.dispatch({
            type: "membership/set-submit-status",
            payload: { status: "submitting" }
        });
        store.dispatch({
            type: "membership/set-field",
            payload: { error: null }
        });

        try {
            const joinRequest = await dataService.submitJoinRequest(channelId, message);
            store.dispatch({
                type: "membership/set-state",
                payload: {
                    status: "pending",
                    joinRequest,
                    draftMessage: "",
                    submitStatus: "idle",
                    error: null
                }
            });
            showToast({
                tone: "success",
                message: "申请已提交，等待管理员审核。"
            });
        } catch (error) {
            const message = getChannelActionErrorMessage("submit_join_request", error);
            store.dispatch({
                type: "membership/set-state",
                payload: {
                    submitStatus: "idle",
                    error: message
                }
            });
            showToast({
                tone: "error",
                message
            });
        }
    },
    async refreshMembershipReviews(channelId = store.getState().runtimeState.channel?.id) {
        if (!channelId) {
            return [];
        }

        store.dispatch({
            type: "membership/set-review-status",
            payload: { status: "loading" }
        });

        try {
            const reviewItems = await dataService.listPendingJoinRequests(channelId);
            store.dispatch({
                type: "membership/set-state",
                payload: {
                    reviewItems,
                    reviewStatus: "idle",
                    error: null
                }
            });
            return reviewItems;
        } catch (error) {
            const message = getChannelActionErrorMessage("load_membership_reviews", error);
            store.dispatch({
                type: "membership/set-state",
                payload: {
                    reviewStatus: "idle",
                    error: message
                }
            });
            showToast({
                tone: "error",
                message
            });
            return [];
        }
    },
    async approveJoinRequest(requestId) {
        store.dispatch({
            type: "membership/set-review-status",
            payload: { status: "submitting" }
        });

        try {
            await dataService.approveJoinRequest(requestId);
            await runtimeActions.loadMembershipState();
            await this.refreshMembershipReviews();
            showToast({
                tone: "success",
                message: "成员申请已通过。"
            });
        } catch (error) {
            const message = getChannelActionErrorMessage("approve_join_request", error);
            store.dispatch({
                type: "membership/set-review-status",
                payload: { status: "idle" }
            });
            showToast({
                tone: "error",
                message
            });
        }
    },
    async rejectJoinRequest(requestId, reason = "") {
        store.dispatch({
            type: "membership/set-review-status",
            payload: { status: "submitting" }
        });

        try {
            await dataService.rejectJoinRequest(requestId, reason);
            await runtimeActions.loadMembershipState();
            await this.refreshMembershipReviews();
            showToast({
                tone: "success",
                message: "成员申请已拒绝。"
            });
        } catch (error) {
            const message = getChannelActionErrorMessage("reject_join_request", error);
            store.dispatch({
                type: "membership/set-review-status",
                payload: { status: "idle" }
            });
            showToast({
                tone: "error",
                message
            });
        }
    }
});
