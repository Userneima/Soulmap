export const selectIdentityDialogVM = (state) => {
    const overlay = state.overlayState.identity;
    const realIdentity = state.runtimeState.realIdentity;
    const trimmedName = overlay.draftName.trim();
    const hasChanged = trimmedName !== realIdentity.name || overlay.draftAvatar !== realIdentity.avatar;

    return {
        open: overlay.open,
        draftName: overlay.draftName,
        draftAvatar: overlay.draftAvatar,
        saveStatus: overlay.saveStatus,
        error: typeof overlay.error === "string"
            ? overlay.error
            : overlay.error?.message || "",
        canSave: Boolean(trimmedName) && trimmedName.length <= 12 && hasChanged && overlay.saveStatus !== "saving",
        nameCount: `${trimmedName.length}/12`
    };
};
