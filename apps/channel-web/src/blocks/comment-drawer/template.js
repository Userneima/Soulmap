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
        <aside class="comment-drawer__panel" role="dialog" aria-modal="true" aria-label="帖子详情">
            <header class="comment-drawer__header">
                <div class="comment-drawer__header-author">
                    ${vm.post ? `
                        <img alt="${escapeHtml(vm.post.authorName)}" class="comment-drawer__avatar comment-drawer__avatar--header" src="${vm.post.authorAvatar}" />
                        <div class="comment-drawer__title-group">
                            <h3>${escapeHtml(vm.post.authorName)}</h3>
                        </div>
                    ` : `
                        <div class="comment-drawer__title-group">
                            <h3>帖子详情</h3>
                        </div>
                    `}
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
                        <div class="comment-drawer__post-body" data-ref="post-body">${formatComposerTextForPost(vm.post.text)}</div>
                        <div class="comment-drawer__post-meta-row">
                            <span class="comment-drawer__post-time">${escapeHtml(vm.post.dateLabel)}</span>
                            <span class="comment-drawer__post-time">浏览${escapeHtml(vm.post.views)}</span>
                        </div>
                        ${vm.adminRevealAnonymous && vm.post.isAnonymous && vm.post.adminRevealIdentity ? `
                            <div class="comment-drawer__admin-reveal">
                                <span class="comment-drawer__admin-reveal-label">真实身份</span>
                                <img alt="${escapeHtml(vm.post.adminRevealIdentity.name)}" class="comment-drawer__admin-reveal-avatar" src="${vm.post.adminRevealIdentity.avatar}" />
                                <span>${escapeHtml(vm.post.adminRevealIdentity.name)}</span>
                            </div>
                        ` : ""}
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
                    <div class="comment-drawer__sorts" role="tablist" aria-label="评论排序">
                        ${vm.sortChoices.map((choice) => `
                            <button class="comment-drawer__sort ${choice.value === vm.sort ? "is-active" : ""}" aria-selected="${choice.value === vm.sort ? "true" : "false"}" data-comments-sort="${choice.value}" role="tab" type="button">${escapeHtml(choice.label)}</button>
                        `).join("")}
                    </div>
                    <div class="comment-drawer__comments" data-ref="comments-section">
                        ${vm.comments.length ? vm.comments.map((comment) => `
                            <article class="comment-drawer__comment ${comment.replyDepth > 0 ? "is-reply" : ""}">
                                <img alt="${escapeHtml(comment.authorName)}" class="comment-drawer__avatar comment-drawer__avatar--small" src="${comment.authorAvatar}" />
                                <div>
                                    <div class="comment-drawer__author-row">
                                        ${comment.replyTargetAuthorName
        ? `<span class="comment-drawer__reply-path">${escapeHtml(comment.authorName)} <span class="comment-drawer__reply-arrow">▸</span> ${escapeHtml(comment.replyTargetAuthorName)}</span>`
        : `<span>${escapeHtml(comment.authorName)}</span>`}
                                        <span class="comment-drawer__comment-time">${escapeHtml(comment.timeLabel)} · ${escapeHtml(comment.floorLabel)}</span>
                                    </div>
                                    ${comment.replyTargetPreview ? `<div class="comment-drawer__reply-quote">${escapeHtml(comment.replyTargetPreview)}</div>` : ""}
                                    <div class="comment-drawer__comment-body">${escapeHtml(comment.displayText || comment.text)}</div>
                                    ${comment.showAdminReveal ? `
                                        <div class="comment-drawer__admin-reveal comment-drawer__admin-reveal--comment">
                                            <span class="comment-drawer__admin-reveal-label">真实身份</span>
                                            <img alt="${escapeHtml(comment.adminRevealIdentity.name)}" class="comment-drawer__admin-reveal-avatar" src="${comment.adminRevealIdentity.avatar}" />
                                            <span>${escapeHtml(comment.adminRevealIdentity.name)}</span>
                                        </div>
                                    ` : ""}
                                    <div class="comment-drawer__comment-actions">
                                        <button class="comment-drawer__comment-action ${comment.isLiked ? "is-active" : ""}" data-comment-action="like" data-comment-id="${comment.id}" type="button">
                                            <span class="material-icons-outlined">favorite_border</span>
                                            <span>${comment.likes || 0}</span>
                                        </button>
                                        <button class="comment-drawer__comment-action" data-comment-action="reply" data-comment-author="${escapeHtml(comment.authorName)}" data-comment-text="${escapeHtml(comment.text)}" data-comment-id="${comment.id}" type="button">
                                            <span class="material-icons-outlined">chat_bubble_outline</span>
                                            <span>回复</span>
                                        </button>
                                    </div>
                                </div>
                            </article>
                        `).join("") : '<div class="comment-drawer__empty">还没有评论，第一条回复就从你开始。</div>'}
                    </div>
                ` : ""}
            </div>
            <footer class="comment-drawer__composer">
                ${vm.replyTarget ? `
                    <div class="comment-drawer__reply-chip">
                        <div class="comment-drawer__reply-chip-copy">
                            <span>回复 ${escapeHtml(vm.replyTarget.authorName)}</span>
                            ${vm.replyTarget.text ? `<span class="comment-drawer__reply-chip-preview">${escapeHtml(vm.replyTarget.text)}</span>` : ""}
                        </div>
                        <button class="comment-drawer__reply-clear" data-comments-action="clear-reply" type="button">
                            <span class="material-icons-outlined">close</span>
                        </button>
                    </div>
                ` : ""}
                ${vm.canInteract ? `
                    <div class="comment-drawer__composer-tools">
                        <button class="comment-drawer__composer-toggle ${vm.anonymousMode ? "is-active" : ""}" data-comments-action="toggle-anonymous" type="button">匿名</button>
                        ${vm.anonymousMode && vm.activeAlias ? `
                            <button class="comment-drawer__composer-alias" data-comments-action="regenerate-alias" type="button">
                                <img alt="${escapeHtml(vm.activeAlias.name)}" class="comment-drawer__composer-alias-avatar" src="${vm.activeAlias.avatar}" />
                                <span>${escapeHtml(vm.activeAlias.name)}</span>
                                <span class="material-icons-outlined">autorenew</span>
                            </button>
                        ` : ""}
                    </div>
                ` : ""}
                <input class="comment-drawer__input" data-ref="comment-input" placeholder="${vm.status === "loading" ? "正在加载评论..." : vm.status === "error" ? "评论暂时不可用" : escapeHtml(vm.accessHint)}" ${vm.status === "ready" && vm.canInteract ? "" : "disabled"} type="text" />
                <button class="comment-drawer__send" data-comments-action="send" ${vm.canSend ? "" : "disabled"} type="button">${vm.submitStatus === "submitting" ? "发送中" : "发送"}</button>
            </footer>
        </aside>
    </div>
`;
