import { escapeHtml } from "../../shared/lib/helpers.js";

const buildNotificationItem = (item, showActions = true) => `
    <article class="notification-center__item">
        <img alt="${escapeHtml(item.userName)}" class="notification-center__avatar" src="${item.avatar}" />
        <div class="notification-center__item-body">
            <div class="notification-center__item-head">
                <span class="notification-center__name">${escapeHtml(item.userName)}</span>
                <span class="notification-center__date">${escapeHtml(item.dateLabel)}</span>
            </div>
            <div class="notification-center__item-action">${escapeHtml(item.actionLine)}</div>
            <div class="notification-center__quote">${escapeHtml(item.quoteLine)}</div>
            ${showActions ? `
                <div class="notification-center__actions">
                    <button class="notification-center__pill" type="button">
                        <span class="material-icons-outlined">favorite_border</span>
                        <span>${escapeHtml(item.primaryAction || "赞")}</span>
                    </button>
                    <button class="notification-center__pill" type="button">
                        <span class="material-icons-outlined">chat_bubble_outline</span>
                        <span>${escapeHtml(item.secondaryAction || "回复")}</span>
                    </button>
                </div>
            ` : ""}
        </div>
    </article>
`;

export const notificationCenterTemplate = (vm) => `
    <div class="notification-center ${vm.open ? "is-open" : ""}">
        <div class="notification-center__backdrop" data-notification-center-action="close"></div>
        <div class="notification-center__panel" style="${vm.panelStyle}">
            <div class="notification-center__tabs">
                ${vm.tabs.map((tab) => `
                    <button
                        class="notification-center__tab ${vm.activeTab === tab.key ? "is-active" : ""}"
                        data-notification-center-action="tab"
                        data-tab-key="${tab.key}"
                        type="button"
                    >
                        ${escapeHtml(tab.label)}
                    </button>
                `).join("")}
            </div>
            <div class="notification-center__list">
                ${vm.items.map((item) => buildNotificationItem(item, vm.activeTab === "interaction")).join("")}
            </div>
        </div>
    </div>
`;
