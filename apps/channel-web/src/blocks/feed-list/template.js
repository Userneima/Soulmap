import { escapeHtml, formatComposerTextForPost } from "../../shared/lib/helpers.js";

const buildStateCard = (icon, title, message, actionLabel = "", action = "") => `
    <div class="feed-list__state">
        <div class="feed-list__state-icon"><span class="material-icons-outlined">${icon}</span></div>
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(message)}</p>
        ${actionLabel ? `<button class="feed-list__state-action" data-feed-action="${action}" type="button">${escapeHtml(actionLabel)}</button>` : ""}
    </div>
`;

const buildPostCard = (post) => `
    <article class="feed-card" data-post-id="${post.id}">
        <div class="feed-card__header">
            <img alt="${escapeHtml(post.authorName)}" class="feed-card__avatar" src="${post.authorAvatar}" />
            <div class="feed-card__meta">
                <div class="feed-card__author-row">
                    <span class="feed-card__author">${escapeHtml(post.authorName)}</span>
                    ${!post.isAnonymous ? '<span class="feed-card__admin-tag">管理员</span>' : ""}
                    ${post.role === "owner" && !post.isAnonymous ? '<span class="feed-card__badge">频道主</span>' : ""}
                </div>
                <div class="feed-card__time">${escapeHtml(post.timeLabel)}</div>
            </div>
        </div>
        <div class="feed-card__body">
            <div class="feed-card__body-text">${formatComposerTextForPost(post.previewText || "")}</div>
            ${post.showFullEntry ? '<button class="feed-card__full-entry" data-feed-action="open-post-body" type="button">全文</button>' : ""}
        </div>
        ${post.images.length ? `
            <div class="feed-card__media">
                ${post.images.map((image) => `
                    <div class="feed-card__image-shell">
                        <img alt="${escapeHtml(image.name)}" class="feed-card__image" src="${image.url}" />
                    </div>
                `).join("")}
            </div>
        ` : ""}
        <div class="feed-card__footer">
            <button class="feed-card__action ${post.isLiked ? "is-active" : ""}" data-feed-action="like-post" type="button">
                <span class="material-icons-outlined">${post.isLiked ? "favorite" : "favorite_border"}</span>
                <span>${post.likes > 0 ? post.likes : "点赞"}</span>
            </button>
            <button class="feed-card__action" data-feed-action="open-comments" type="button">
                <span class="material-icons-outlined">chat_bubble_outline</span>
                <span>${post.comments.length > 0 ? post.comments.length : "评论"}</span>
            </button>
            <button class="feed-card__action" type="button">
                <span class="material-icons-outlined">share</span>
                <span>${post.shares > 0 ? post.shares : "分享"}</span>
            </button>
        </div>
    </article>
`;

export const feedListTemplate = (vm) => {
    if (vm.status === "loading") {
        return buildStateCard("hourglass_top", "正在加载内容", "正在拉取频道内容，请稍候。");
    }

    if (vm.status === "error") {
        return buildStateCard("wifi_off", "内容加载失败", vm.error || "频道内容加载失败，请重试。", "重新加载", "retry");
    }

    if (vm.status === "empty") {
        return buildStateCard("forum", "频道里还没有内容", "第一条帖子还没出现，可以直接发一条把频道跑起来。");
    }

    if (vm.status === "search-empty") {
        return buildStateCard("search_off", "本频道内没有搜到内容", `没有找到和“${vm.searchQuery}”相关的帖子或评论。`);
    }

    return `
        <div class="feed-list__stack">
            ${vm.items.map((item) => buildPostCard(item)).join("")}
        </div>
    `;
};
