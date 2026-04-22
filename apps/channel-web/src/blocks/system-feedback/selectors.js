export const selectSystemFeedbackVM = (state) => ({
    blockingStatus: state.runtimeState.phase,
    blockingError: state.runtimeState.blockingError,
    toast: state.overlayState.toast,
    deleteConfirm: state.overlayState.deleteConfirm
});
