export const selectAuthGateVM = (state) => {
    const mode = state.overlayState.authGate.mode;
    const open = state.overlayState.authGate.open;

    return {
        open,
        mode,
        email: state.authState.email,
        password: state.authState.password,
        error: typeof state.authState.error === "string"
            ? state.authState.error
            : state.authState.error?.message || "",
        isVerifying: state.authState.status === "verifying",
        title: "登录后继续",
        description: "用邮箱和密码登录后，你就可以继续浏览并申请加入频道。",
        submitLabel: state.authState.status === "verifying" ? "登录中" : "登录",
        canSubmit: Boolean(state.authState.email.trim())
            && Boolean(state.authState.password.trim())
            && state.authState.status !== "verifying",
        canClose: true
    };
};
