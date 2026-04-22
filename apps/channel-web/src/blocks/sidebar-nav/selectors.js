import { channelShellConfig } from "../../entities/channel/config.js";

export const selectSidebarNavVM = (state) => {
    const currentChannel = state.runtimeState.channel;
    const activeSlug = currentChannel?.slug;
    const baseChannels = channelShellConfig.channelItems.map((item) => ({
        ...item,
        active: item.name === currentChannel?.name,
        href: item.name === currentChannel?.name && activeSlug ? `?channel=${encodeURIComponent(activeSlug)}` : "#"
    }));

    if (currentChannel && !baseChannels.some((item) => item.name === currentChannel.name)) {
        baseChannels.unshift({
            name: currentChannel.name,
            badge: (currentChannel.name || "频").slice(0, 1),
            avatar: currentChannel.logoUrl || channelShellConfig.channelLogo,
            active: true,
            href: `?channel=${encodeURIComponent(currentChannel.slug)}`
        });
    }

    return {
        brandName: channelShellConfig.brandName,
        navItems: channelShellConfig.primaryNavItems,
        unjoinedItems: [],
        channelItems: baseChannels,
        sidebarOpen: state.uiState.sidebarOpen,
        accountMenuOpen: state.uiState.accountMenuOpen,
        currentIdentity: state.runtimeState.realIdentity,
        currentUserEmail: state.authState.user?.email || "",
        canLogout: state.authState.status === "authenticated" && Boolean(state.authState.user?.id),
        searchChannelName: currentChannel?.name || "频道",
        searchChannelBadge: (currentChannel?.name || "频").slice(0, 1),
        searchQuery: state.feedState.searchQuery || "",
        searchFocusNonce: state.uiState.searchFocusNonce || 0
    };
};
