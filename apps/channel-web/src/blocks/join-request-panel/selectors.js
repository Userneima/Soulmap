export const selectJoinRequestPanelVM = (state) => {
    const authStatus = state.authState.status;
    const membershipStatus = state.membershipState.status;
    const joinRequest = state.membershipState.joinRequest;
    const isLoggedIn = authStatus === "authenticated";

    return {
        visible: state.runtimeState.status !== "loading" && state.runtimeState.status !== "error" && membershipStatus !== "approved",
        authStatus,
        membershipStatus,
        draftMessage: state.membershipState.draftMessage,
        submitStatus: state.membershipState.submitStatus,
        error: typeof state.membershipState.error === "string"
            ? state.membershipState.error
            : state.membershipState.error?.message || "",
        joinRequest,
        isLoggedIn,
        title: authStatus === "guest"
            ? "公开浏览已开启"
            : membershipStatus === "pending"
                    ? "加入申请审核中"
                    : membershipStatus === "rejected"
                        ? "申请暂未通过"
                        : "申请加入频道",
        description: authStatus === "guest"
            ? "你现在可以先看帖子和评论，登录后才能申请加入并互动。"
            : membershipStatus === "pending"
                    ? "管理员审核通过后，你就能发帖、评论，并使用匿名马甲。"
                    : membershipStatus === "rejected"
                        ? "你可以补充一句申请说明后重新提交。"
                        : "提交申请后，需要等待频道管理员审核。",
        primaryLabel: authStatus === "guest"
            ? "邮箱登录"
            : membershipStatus === "pending"
                    ? "等待审核"
                    : membershipStatus === "rejected"
                        ? "重新申请"
                        : "提交申请",
        canSubmit: authStatus === "authenticated" && membershipStatus !== "pending" && state.membershipState.submitStatus !== "submitting"
    };
};
