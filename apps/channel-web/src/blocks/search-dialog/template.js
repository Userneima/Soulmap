import { escapeHtml } from "../../shared/lib/helpers.js";

const buildState = (title, description) => `
    <div class="search-dialog__state">
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(description)}</p>
    </div>
`;

const buildResults = (vm) => {
    if (vm.status === "loading") {
        return buildState("正在搜索频道内容", "正在整理频道里的帖子和评论，请稍候。");
    }

    if (vm.status === "error") {
        return buildState("搜索暂时不可用", vm.error || "这次搜索没有成功，请稍后再试。");
    }

    if (vm.empty) {
        return buildState(
            "没有找到匹配内容",
            vm.query ? `没有找到和“${vm.query}”相关的帖子或评论。` : "这个频道里还没有可供搜索的内容。"
        );
    }

    return `
        <div class="search-dialog__results">
            ${vm.items.map((item) => `
                <button class="search-dialog__result" data-search-dialog-action="open-result" data-post-id="${escapeHtml(item.id)}" type="button">
                    <div class="search-dialog__result-meta">
                        <div class="search-dialog__result-author">
                            <img alt="${escapeHtml(item.authorName)}" class="search-dialog__result-avatar" src="${item.authorAvatar}" />
                            <span>${escapeHtml(item.authorName)}</span>
                        </div>
                        <div class="search-dialog__result-tags">
                            <span>${escapeHtml(item.boardLabel)}</span>
                            <span>${escapeHtml(item.createdAtLabel)}</span>
                        </div>
                    </div>
                    <div class="search-dialog__result-body">${escapeHtml(item.previewText)}</div>
                    <div class="search-dialog__result-footer">
                        <span>${item.likes > 0 ? `${item.likes}赞` : "未点赞"}</span>
                        <span>${item.commentCount > 0 ? `${item.commentCount}评` : "暂无评论"}</span>
                    </div>
                </button>
            `).join("")}
        </div>
    `;
};

export const searchDialogTemplate = (vm) => `
    <div class="search-dialog ${vm.open ? "is-open" : ""}">
        <div class="search-dialog__backdrop" data-search-dialog-action="close"></div>
        <div class="search-dialog__panel" role="dialog" aria-modal="true" aria-label="${escapeHtml(vm.title)}">
            <div class="search-dialog__header">
                <div class="search-dialog__title">${escapeHtml(vm.title)}</div>
                <button class="search-dialog__close" data-search-dialog-action="close" type="button" aria-label="关闭搜索">
                    <span class="material-icons-outlined">close</span>
                </button>
            </div>
            <div class="search-dialog__search-shell">
                <input
                    class="search-dialog__input"
                    data-search-dialog-ref="input"
                    placeholder="搜索频道内容"
                    type="text"
                    value="${escapeHtml(vm.query)}"
                />
                <span class="material-icons-outlined search-dialog__input-icon">search</span>
            </div>
            <div class="search-dialog__toolbar">
                <select class="search-dialog__select" data-search-dialog-ref="sort">
                    ${vm.sortChoices.map((choice) => `
                        <option ${choice.value === vm.sort ? "selected" : ""} value="${escapeHtml(choice.value)}">${escapeHtml(choice.label)}</option>
                    `).join("")}
                </select>
                <select class="search-dialog__select" data-search-dialog-ref="board">
                    ${vm.boardChoices.map((choice) => `
                        <option ${choice.value === vm.board ? "selected" : ""} value="${escapeHtml(choice.value)}">${escapeHtml(choice.label)}</option>
                    `).join("")}
                </select>
            </div>
            ${buildResults(vm)}
        </div>
    </div>
`;
