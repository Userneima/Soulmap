import { boardTabs, feedFilterChoices } from "../../entities/channel/config.js";

export const selectBoardTabsVM = (state) => ({
    boards: boardTabs,
    filters: feedFilterChoices,
    activeBoard: state.feedState.activeBoard,
    activeFilter: state.feedState.activeFilter,
    topRegion: state.uiState.topRegion
});
