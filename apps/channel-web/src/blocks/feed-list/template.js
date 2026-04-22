import { escapeHtml, formatComposerTextForPost } from "../../shared/lib/helpers.js";

const buildGuessPicker = (vm) => `
    <section class="guess-picker">
        <div class="guess-picker__header">
            <h3 class="guess-picker__title">选择你猜的天使</h3>
            <p class="guess-picker__subtitle">先锁定你最怀疑的人；不可能的人可以先排除，再在下方写你的推理依据。</p>
        </div>
        <div class="guess-picker__grid">
            ${vm.candidates.map((candidate) => `
                <article class="guess-picker__card ${candidate.isSelected ? "is-selected" : ""} ${candidate.isExcluded ? "is-excluded" : ""}">
                    <img alt="${escapeHtml(candidate.name)}" class="guess-picker__avatar" src="${candidate.avatar}" />
                    <span class="guess-picker__name">${escapeHtml(candidate.name)}</span>
                    <span class="guess-picker__meta">${candidate.isSelected ? "已锁定" : candidate.isExcluded ? "已排除" : "待判断"}</span>
                    <div class="guess-picker__actions">
                        <button class="guess-picker__action ${candidate.isSelected ? "is-active" : ""}" data-feed-action="select-guess-target" data-guess-name="${encodeURIComponent(candidate.name)}" data-guess-avatar="${encodeURIComponent(candidate.avatar || "")}" ${candidate.isExcluded ? "disabled" : ""} type="button">
                            ${candidate.isSelected ? "已选择" : "选这个人"}
                        </button>
                        <button class="guess-picker__action guess-picker__action--secondary ${candidate.isExcluded ? "is-active" : ""}" data-feed-action="toggle-guess-exclusion" data-guess-name="${encodeURIComponent(candidate.name)}" type="button">
                            ${candidate.isExcluded ? "取消排除" : "排除"}
                        </button>
                    </div>
                </article>
            `).join("")}
        </div>
        <div class="guess-picker__composer">
            <div class="guess-picker__composer-head">
                <div class="guess-picker__selection">
                    <span class="guess-picker__selection-label">当前锁定</span>
                    ${vm.selectedCandidate ? `
                        <span class="guess-picker__selection-chip">
                            <img alt="${escapeHtml(vm.selectedCandidate.name)}" class="guess-picker__selection-avatar" src="${vm.selectedCandidate.avatar || ""}" />
                            <span>${escapeHtml(vm.selectedCandidate.name)}</span>
                        </span>
                    ` : `<span class="guess-picker__selection-empty">还没选人</span>`}
                </div>
                ${vm.excludedNames.length ? `
                    <div class="guess-picker__excluded-summary">已排除 ${vm.excludedNames.length} 人</div>
                ` : ""}
            </div>
            <label class="guess-picker__field">
                <span class="guess-picker__field-label">推理依据</span>
                <textarea class="guess-picker__textarea" data-feed-input="guess-reason" placeholder="可以在这里输入你已经收集到的信息进行推理">${escapeHtml(vm.guessDraftText || "")}</textarea>
            </label>
            <div class="guess-picker__footer">
                <button class="guess-picker__submit" data-feed-action="submit-guess" ${vm.canSubmitGuess && vm.submitStatus !== "submitting" ? "" : "disabled"} type="button">
                    ${vm.submitStatus === "submitting" ? "提交中" : "提交猜测"}
                </button>
            </div>
        </div>
    </section>
`;

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
                    ${post.role === "admin" && !post.isAnonymous ? '<span class="feed-card__admin-tag">管理员</span>' : ""}
                    ${post.role === "owner" && !post.isAnonymous ? '<span class="feed-card__badge">频道主</span>' : ""}
                    </div>
                    <div class="feed-card__time">${escapeHtml(post.timeLabel)}</div>
                    ${post.showAdminReveal ? `
                        <div class="feed-card__admin-reveal">
                            <span class="feed-card__admin-reveal-label">真实身份</span>
                            <img alt="${escapeHtml(post.adminRevealIdentity.name)}" class="feed-card__admin-reveal-avatar" src="${post.adminRevealIdentity.avatar}" />
                            <span class="feed-card__admin-reveal-name">${escapeHtml(post.adminRevealIdentity.name)}</span>
                        </div>
                    ` : ""}
                </div>
                <div class="feed-card__header-actions">
                    ${post.canDelete ? '<button class="feed-card__header-action" data-feed-action="request-delete-post" type="button">删除</button>' : ""}
                </div>
        </div>
        <div class="feed-card__body">
            <div class="feed-card__body-text">${formatComposerTextForPost(post.previewText || "")}</div>
            ${post.showFullEntry ? '<button class="feed-card__full-entry" data-feed-action="open-post-body" type="button">全文</button>' : ""}
        </div>
        ${post.images.length ? `
            <div class="feed-card__media">
                ${post.images.map((image, index) => `
                    <button class="feed-card__image-shell" data-feed-action="open-image" data-image-index="${index}" type="button">
                        <img alt="${escapeHtml(image.name)}" class="feed-card__image" src="${image.url}" />
                    </button>
                `).join("")}
            </div>
        ` : ""}
        ${post.audioClips?.length ? `
            <div class="feed-card__audio-list">
                ${post.audioClips.map((clip) => `
                    <div class="feed-card__audio-shell">
                        <div class="feed-card__audio-meta">
                            <span class="material-icons-outlined">graphic_eq</span>
                            <span>${escapeHtml(clip.name || "语音")}</span>
                        </div>
                        <audio class="feed-card__audio-player" controls preload="metadata" src="${clip.url}"></audio>
                    </div>
                `).join("")}
            </div>
        ` : ""}
        ${post.canClaimWish ? `
            <div class="feed-card__claim-row">
                <button class="feed-card__claim-action ${post.isClaimedWish ? "is-selected" : ""}" data-feed-action="claim-wish" type="button">
                    ${escapeHtml(post.claimActionLabel)}
                </button>
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
    if (vm.mode === "guess-picker") {
        return buildGuessPicker(vm);
    }

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
