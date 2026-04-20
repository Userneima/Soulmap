import { channelShellConfig } from "../../entities/channel/config.js";

export const selectChannelHeroVM = (state) => ({
    channelName: state.runtimeState.channel?.name || "频道初始化中",
    memberCountLabel: channelShellConfig.memberCountLabel,
    logoUrl: channelShellConfig.channelLogo,
    identityName: state.runtimeState.realIdentity.name
});
