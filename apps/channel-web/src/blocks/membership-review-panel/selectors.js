export const selectMembershipReviewPanelVM = (state) => ({
    visible: state.membershipState.status === "approved"
        && ["owner", "admin"].includes(state.runtimeState.realIdentity.role)
        && (state.membershipState.reviewStatus === "loading" || state.membershipState.reviewItems.length > 0),
    reviewStatus: state.membershipState.reviewStatus,
    items: state.membershipState.reviewItems,
    disabled: state.membershipState.reviewStatus === "submitting"
});
