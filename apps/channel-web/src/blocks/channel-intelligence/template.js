import { escapeHtml } from "../../shared/lib/helpers.js";

const buildEmptyContent = () => '<div class="channel-intelligence__empty">本周内容还不够，等帖子和评论跑起来后再生成周报。</div>';

const buildDetailContent = (vm) => {
    if (vm.status === "empty") {
        return buildEmptyContent();
    }

    return `
        <section class="channel-intelligence__section">
            <div class="channel-intelligence__section-title">高频议题</div>
            <div class="channel-intelligence__theme-list">
                ${vm.topThemes.length ? vm.topThemes.map((theme) => `
                    <div class="channel-intelligence__theme">
                        <span>${escapeHtml(theme.label)}</span>
                        <span>${escapeHtml(theme.mentionCount)}</span>
                    </div>
                `).join("") : '<div class="channel-intelligence__empty">目前还没有足够明显的重复议题。</div>'}
            </div>
        </section>
        <section class="channel-intelligence__section">
            <div class="channel-intelligence__section-title">代表帖子</div>
            <div class="channel-intelligence__post-list">
                ${vm.representativePosts.length ? vm.representativePosts.map((post) => `
                    <button class="channel-intelligence__post" data-channel-intelligence-post-id="${post.id}" type="button">
                        <div class="channel-intelligence__post-head">
                            <span>${escapeHtml(post.authorName)}</span>
                            <span>${escapeHtml(post.timeLabel)}</span>
                        </div>
                        <div class="channel-intelligence__post-body">${escapeHtml(post.previewText)}</div>
                    </button>
                `).join("") : '<div class="channel-intelligence__empty">还没有形成足够有代表性的帖子。</div>'}
            </div>
        </section>
        <section class="channel-intelligence__section">
            <div class="channel-intelligence__section-title">未解决问题</div>
            <div class="channel-intelligence__question-list">
                ${vm.openQuestions.length ? vm.openQuestions.map((item) => `
                    <div class="channel-intelligence__question">
                        <span class="channel-intelligence__question-author">${escapeHtml(item.authorName)}</span>
                        <p>${escapeHtml(item.text)}</p>
                    </div>
                `).join("") : '<div class="channel-intelligence__empty">目前没有特别突出的悬而未决问题。</div>'}
            </div>
        </section>
    `;
};

const buildGodPicker = (vm) => `
    <div class="channel-intelligence__picker ${vm.godPickerOpen ? "is-open" : ""}">
        ${vm.godOptions.map((member) => `
            <button class="channel-intelligence__picker-option" data-channel-intelligence-god="${escapeHtml(member.name)}" data-channel-intelligence-avatar="${escapeHtml(member.avatar || "")}" type="button">
                <img alt="${escapeHtml(member.name)}" class="channel-intelligence__picker-avatar" src="${member.avatar}" />
                <span>${escapeHtml(member.name)}</span>
            </button>
        `).join("")}
    </div>
`;

const buildThemeEditor = (vm) => `
    <div class="channel-intelligence__theme-editor ${vm.themeEditorOpen ? "is-open" : ""}">
        <input class="channel-intelligence__theme-input" data-channel-intelligence-ref="theme-input" maxlength="24" placeholder="输入本周主题" type="text" value="${escapeHtml(vm.draftTheme)}" />
        <div class="channel-intelligence__theme-actions">
            <button class="channel-intelligence__action-button is-quiet" data-channel-intelligence-action="cancel-theme" type="button">取消</button>
            <button class="channel-intelligence__action-button" data-channel-intelligence-action="save-theme" type="button">保存主题</button>
        </div>
    </div>
`;

const buildRevealSummary = (vm) => `
    <div class="channel-intelligence__reveal-block">
        <div class="channel-intelligence__round-row is-with-action">
            <div class="channel-intelligence__round-copy">
                <span class="channel-intelligence__round-label">揭晓结果</span>
                <div class="channel-intelligence__round-value">
                    ${vm.revealResult
        ? `你猜的是 ${escapeHtml(vm.revealResult.guessedName || "未提交猜测")}，实际天使是 ${escapeHtml(vm.revealResult.actualName)}。`
        : vm.revealPairs.length
            ? `已生成 ${escapeHtml(vm.revealPairs.length)} 对揭晓结果。`
            : "还没生成揭晓结果。"}
                </div>
            </div>
            ${vm.canManageRound ? `
                <button class="channel-intelligence__action-button is-quiet" data-channel-intelligence-action="generate-reveal-results" type="button">
                    ${vm.revealPairs.length ? "重新生成揭晓" : "一键生成揭晓"}
                </button>
            ` : ""}
        </div>
        ${vm.revealPairs.length ? `<div class="channel-intelligence__reveal-meta">系统会根据交付帖里的 To 对象和匿名作者真实身份自动生成配对。</div>` : ""}
    </div>
`;

export const channelIntelligenceTemplate = (vm) => `
    <section class="channel-intelligence">
        <header class="channel-intelligence__header">
            <section class="channel-intelligence__round">
                <div class="channel-intelligence__round-head">
                    <div>
                        <h3>本周回合</h3>
                        <p>国王与天使</p>
                    </div>
                    ${vm.canManageRound ? `
                        <button class="channel-intelligence__open-button" data-channel-intelligence-action="toggle-god-picker" type="button" aria-label="指定本周上帝">
                            <span class="material-icons-outlined">admin_panel_settings</span>
                        </button>
                    ` : ""}
                </div>
                <div class="channel-intelligence__round-row">
                    <span class="channel-intelligence__round-label">本周上帝</span>
                    <div class="channel-intelligence__round-value ${vm.godProfile ? "has-avatar" : ""}">
                        ${vm.godProfile ? `<img alt="${escapeHtml(vm.godProfile.name)}" class="channel-intelligence__round-avatar" src="${vm.godProfile.avatar}" />` : ""}
                        <span>${escapeHtml(vm.godProfile?.name || "待指定")}</span>
                    </div>
                </div>
                ${vm.canManageRound ? buildGodPicker(vm) : ""}
                <div class="channel-intelligence__round-row ${vm.canEditTheme ? "is-with-action" : ""}">
                    <div class="channel-intelligence__round-copy">
                        <span class="channel-intelligence__round-label">当前主题</span>
                        <div class="channel-intelligence__round-value">${escapeHtml(vm.currentTheme)}</div>
                    </div>
                    ${vm.canEditTheme ? `
                        <button class="channel-intelligence__action-button is-quiet" data-channel-intelligence-action="toggle-theme-editor" type="button">${vm.hasTheme ? "修改主题" : "设定主题"}</button>
                    ` : ""}
                </div>
                ${vm.canEditTheme ? buildThemeEditor(vm) : ""}
                <div class="channel-intelligence__round-row">
                    <span class="channel-intelligence__round-label">当前阶段</span>
                    <div class="channel-intelligence__round-value">${escapeHtml(vm.currentStageLabel)}</div>
                </div>
                <div class="channel-intelligence__round-row">
                    <span class="channel-intelligence__round-label">截止时间</span>
                    <div class="channel-intelligence__round-value">${escapeHtml(vm.currentDeadlineLabel)}</div>
                </div>
                ${vm.currentStageLabel === "揭晓" || vm.revealPairs.length ? buildRevealSummary(vm) : ""}
            </section>
            <section class="channel-intelligence__task">
                <div class="channel-intelligence__task-head">
                    <span>我的待办</span>
                    <span>${escapeHtml(vm.currentTaskStatus)}</span>
                </div>
                <div class="channel-intelligence__task-title">${escapeHtml(vm.currentStageLabel)}阶段</div>
            </section>
        </header>
        <div class="channel-intelligence-dialog ${vm.open ? "is-open" : ""}">
            <div class="channel-intelligence-dialog__backdrop" data-channel-intelligence-action="close"></div>
            <section class="channel-intelligence-dialog__panel" role="dialog" aria-modal="true" aria-label="频道周报详情">
                <header class="channel-intelligence-dialog__header">
                    <div>
                        <h3>${escapeHtml(vm.title)}</h3>
                        <p>${escapeHtml(vm.subtitle)}</p>
                        <div class="channel-intelligence-dialog__metrics">${escapeHtml(vm.metricsLine)}</div>
                    </div>
                    <button class="channel-intelligence-dialog__close" data-channel-intelligence-action="close" type="button" aria-label="关闭频道周报详情">
                        <span class="material-icons-outlined">close</span>
                    </button>
                </header>
                <div class="channel-intelligence-dialog__body">
                    ${buildDetailContent(vm)}
                </div>
            </section>
        </div>
    </section>
`;
