import { channelShellConfig } from "../../entities/channel/config.js";

const DESKTOP_BREAKPOINT = 720;
const CHANNEL_MENU_WIDTH = 314;
const CHANNEL_MENU_HEIGHT = 284;
const VIEWPORT_MARGIN = 12;

const getChannelMenuPanelStyle = (overlayState) => {
    if (typeof window === "undefined" || window.innerWidth <= DESKTOP_BREAKPOINT) {
        return "";
    }

    const { anchorX, anchorY } = overlayState;
    if (typeof anchorX !== "number" || typeof anchorY !== "number") {
        return "";
    }

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const maxLeft = Math.max(VIEWPORT_MARGIN, viewportWidth - CHANNEL_MENU_WIDTH - VIEWPORT_MARGIN);
    const maxTop = Math.max(VIEWPORT_MARGIN, viewportHeight - CHANNEL_MENU_HEIGHT - VIEWPORT_MARGIN);
    const left = Math.min(maxLeft, Math.max(VIEWPORT_MARGIN, anchorX - CHANNEL_MENU_WIDTH));
    const top = Math.min(maxTop, Math.max(VIEWPORT_MARGIN, anchorY));

    return `top:${top}px;left:${left}px;right:auto;`;
};

export const selectChannelMenuDialogVM = (state) => ({
    open: state.overlayState.channelMenu.open,
    panelStyle: getChannelMenuPanelStyle(state.overlayState.channelMenu),
    channelName: state.runtimeState.channel?.name || "频道",
    channelSlug: state.runtimeState.channel?.slug || "",
    logoUrl: channelShellConfig.channelLogo,
    identityName: state.runtimeState.realIdentity.name,
    identityAvatar: state.runtimeState.realIdentity.avatar
});
