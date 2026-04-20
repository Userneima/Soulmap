import { escapeHtml } from "../../shared/lib/helpers.js";

export const boardTabsTemplate = (vm) => `
    <div class="board-tabs">
        <div class="board-tabs__main">
            <div class="board-tabs__filters">
                <button class="board-tabs__filter board-tabs__filter--icon" type="button">
                    <span class="material-icons-outlined">swap_vert</span>
                </button>
            </div>
            <div class="board-tabs__boards">
                ${vm.boards.map((board) => `
                    <button class="board-tabs__board ${board.value === vm.activeBoard ? "is-active" : ""}" data-board="${board.value}" type="button">
                        ${escapeHtml(board.label)}
                    </button>
                `).join("")}
            </div>
            <button class="board-tabs__quick-compose" data-board-tabs-action="compose" type="button">
                <span class="material-icons-outlined">edit</span>
                <span>发帖</span>
            </button>
        </div>
        <div class="board-tabs__subfilters">
            ${vm.filters.map((filter) => `
                <button class="board-tabs__filter ${filter.value === vm.activeFilter ? "is-active" : ""}" data-filter="${filter.value}" type="button">
                    ${escapeHtml(filter.label)}
                </button>
            `).join("")}
        </div>
    </div>
`;
