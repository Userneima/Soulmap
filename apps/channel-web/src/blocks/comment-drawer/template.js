import { escapeHtml, formatComposerTextForPost } from "../../shared/lib/helpers.js";

const buildStatusMarkup = (vm) => {
    if (vm.status === "loading") {
        return `<div class="comment-drawer__status">正在加载帖子和评论...</div>`;
    }
    if (vm.status === "error") {
        return `
            <div class="comment-drawer__status">
                <div>${escapeHtml(vm.error || "评论加载失败，请稍后重试。")}</div>
                <button class="comment-drawer__retry" data-comments-action="retry" type="button">重新加载</button>
            </div>
        `;
    }
    return "";
};

export const commentDrawerTemplate = (vm) => `
    <div class="comment-drawer ${vm.open ? "is-open" : ""}">
        <div class="comment-drawer__backdrop" data-comments-action="close"></div>
        <aside class="comment-drawer__panel">
            <header class="comment-drawer__header">
                <div class="comment-drawer__title-group">
                    <h3>帖子详情</h3>
                    <p>${vm.post ? `${vm.post.authorName} · ${vm.post.timeLabel}` : "查看完整内容和评论"}</p>
                </div>
                <div class="comment-drawer__header-actions">
                    <button class="comment-drawer__ghost" ${vm.copyEnabled ? "" : "disabled"} data-comments-action="copy" type="button">
                        <span class="material-icons-outlined">content_copy</span>
                    </button>
                    <button class="comment-drawer__ghost" data-comments-action="close" type="button">
                        <span class="material-icons-outlined">close</span>
                    </button>
                </div>
            </header>
            <div class="comment-drawer__body">
                ${buildStatusMarkup(vm)}
                ${vm.post && vm.status === "ready" ? `
                    <article class="comment-drawer__post">
                        <div class="comment-drawer__post-author">
                            <img alt="${escapeHtml(vm.post.authorName)}" class="comment-drawer__avatar" src="${vm.post.authorAvatar}" />
                            <div class="comment-drawer__post-meta">
                                <div class="comment-drawer__author-row">
                                    <span>${escapeHtml(vm.post.authorName)}</span>
                                    ${vm.post.role === "owner" && !vm.post.isAnonymous ? '<span class="comment-drawer__badge">频道主</span>' : ""}
                                </div>
                                <div class="comment-drawer__post-time">${escapeHtml(vm.post.dateLabel)} · 浏览${escapeHtml(vm.post.views)}</div>
                            </div>
                        </div>
                        <div class="comment-drawer__post-body" data-ref="post-body">${formatComposerTextForPost(vm.post.text)}</div>
                        ${vm.post.images?.length ? `
                            <div class="comment-drawer__media">
                                ${vm.post.images.map((image) => `
                                    <div class="comment-drawer__image-shell">
                                        <img alt="${escapeHtml(image.name)}" class="comment-drawer__image" src="${image.url}" />
                                    </div>
                                `).join("")}
                            </div>
                        ` : ""}
                    </article>
                    <div class="comment-drawer__sorts">
                        ${vm.sortChoices.map((choice) => `
                            <button class="comment-drawer__sort ${choice.value === vm.sort ? "is-active" : ""}" data-comments-sort="${choice.value}" type="button">${escapeHtml(choice.label)}</button>
                        `).join("")}
                    </div>
                    <div class="comment-drawer__comments" data-ref="comments-section">
                        ${vm.comments.length ? vm.comments.map((comment) => `
                            <article class="comment-drawer__comment">
                                <img alt="${escapeHtml(comment.authorName)}" class="comment-drawer__avatar comment-drawer__avatar--small" src="${comment.authorAvatar}" />
                                <div>
                                    <div class="comment-drawer__author-row">
                                        <span>${escapeHtml(comment.authorName)}</span>
                                        <span class="comment-drawer__comment-time">${escapeHtml(comment.timeLabel)}</span>
                                    </div>
                                    <div class="comment-drawer__comment-body">${escapeHtml(comment.text)}</div>
                                </div>
                            </article>
                        `).join("") : '<div class="comment-drawer__empty">还没有评论，第一条回复就从你开始。</div>'}
                    </div>
                ` : ""}
            </div>
            <footer class="comment-drawer__composer">
                <input class="comment-drawer__input" data-ref="comment-input" placeholder="${vm.status === "loading" ? "正在加载评论..." : vm.status === "error" ? "评论暂时不可用" : escapeHtml(vm.accessHint)}" ${vm.status === "ready" && vm.canInteract ? "" : "disabled"} type="text" value="${escapeHtml(vm.draftText)}" />
                <button class="comment-drawer__send" data-comments-action="send" ${vm.canSend ? "" : "disabled"} type="button">${vm.submitStatus === "submitting" ? "发送中" : "发送"}</button>
            </footer>
        </aside>
    </div>
`;
