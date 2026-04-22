const fallbackCoverPreview = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='420' viewBox='0 0 1200 420' fill='none'%3E%3Crect width='1200' height='420' rx='28' fill='%231f2536'/%3E%3Cpath d='M0 302C156 242 269 225 399 242C535 259 634 330 774 330C901 330 989 286 1200 198V420H0V302Z' fill='%232d4a7c'/%3E%3Cpath d='M0 256C176 201 294 191 424 214C579 241 657 304 813 304C947 304 1048 251 1200 174V420H0V256Z' fill='%2339558d' fill-opacity='0.82'/%3E%3Ccircle cx='992' cy='126' r='74' fill='white' fill-opacity='0.08'/%3E%3Ccircle cx='1048' cy='116' r='20' fill='white' fill-opacity='0.14'/%3E%3C/svg%3E";

export const selectChannelSettingsDialogVM = (state) => {
    const overlay = state.overlayState.channelSettings;
    const channel = state.runtimeState.channel || {};
    const trimmedName = overlay.draftName.trim();
    const currentName = String(channel.name || "").trim();
    const currentLogo = String(channel.logoUrl || "");
    const currentBackground = String(channel.backgroundUrl || "");
    const hasChanged = trimmedName !== currentName
        || overlay.draftLogo !== currentLogo
        || overlay.draftBackground !== currentBackground;

    return {
        open: overlay.open,
        draftName: overlay.draftName,
        draftLogo: overlay.draftLogo,
        draftBackground: overlay.draftBackground,
        logoPreview: overlay.draftLogo || currentLogo,
        backgroundPreview: overlay.draftBackground || fallbackCoverPreview,
        saveStatus: overlay.saveStatus,
        error: typeof overlay.error === "string"
            ? overlay.error
            : overlay.error?.message || "",
        canClearLogo: Boolean(overlay.draftLogo),
        canClearBackground: Boolean(overlay.draftBackground),
        canSave: Boolean(trimmedName) && trimmedName.length <= 24 && hasChanged && overlay.saveStatus !== "saving",
        nameCount: `${trimmedName.length}/24`
    };
};
