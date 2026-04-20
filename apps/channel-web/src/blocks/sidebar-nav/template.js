import { escapeHtml } from "../../shared/lib/helpers.js";

export const sidebarNavTemplate = (vm) => `
    <div class="sidebar-nav__mobile-bar">
        <button class="sidebar-nav__mobile-trigger" data-sidebar-action="toggle" type="button">
            <span class="material-icons-outlined">menu</span>
        </button>
        <div class="sidebar-nav__brand">${escapeHtml(vm.brandName)}</div>
    </div>
    <div class="sidebar-nav__overlay ${vm.sidebarOpen ? "is-open" : ""}" data-sidebar-action="close"></div>
    <div class="sidebar-nav__panel ${vm.sidebarOpen ? "is-open" : ""}">
        <div class="sidebar-nav__header">
            <div class="sidebar-nav__brand-mark">
                <span class="material-icons-outlined">tag</span>
                <span>${escapeHtml(vm.brandName)}</span>
            </div>
        </div>
        <div class="sidebar-nav__search">
            <span class="material-icons-outlined">search</span>
            <input
                class="sidebar-nav__search-input"
                data-sidebar-ref="search-input"
                placeholder="在本频道搜索"
                type="text"
                value="${escapeHtml(vm.searchQuery)}"
            />
        </div>
        <div class="sidebar-nav__section">
            <div class="sidebar-nav__section-title">主页导航</div>
            <nav class="sidebar-nav__links">
                ${vm.navItems.map((item) => `
                    <a class="sidebar-nav__link" href="#">
                        <span class="material-icons-outlined">${item.icon}</span>
                        <span>${escapeHtml(item.label)}</span>
                    </a>
                `).join("")}
            </nav>
        </div>
        ${vm.unjoinedItems.length ? `
            <div class="sidebar-nav__section">
                <div class="sidebar-nav__section-title">未加入的频道</div>
                <nav class="sidebar-nav__links">
                    ${vm.unjoinedItems.map((item) => `
                        <a class="sidebar-nav__channel" href="${escapeHtml(item.href || "#")}">
                            <img alt="${escapeHtml(item.name)}" class="sidebar-nav__channel-avatar" src="${item.avatar}" />
                            <div class="sidebar-nav__channel-text">${escapeHtml(item.name)}</div>
                        </a>
                    `).join("")}
                </nav>
            </div>
        ` : ""}
        <div class="sidebar-nav__section">
            <div class="sidebar-nav__section-head">
                <div class="sidebar-nav__section-title">我的频道</div>
                <button class="sidebar-nav__create" data-sidebar-action="create-channel" type="button">
                    <span class="material-icons-outlined">add</span>
                    <span>创建</span>
                </button>
            </div>
            <nav class="sidebar-nav__links">
                ${vm.channelItems.map((item) => `
                    <a class="sidebar-nav__channel ${item.active ? "is-active" : ""}" href="${escapeHtml(item.href || "#")}">
                        ${item.avatar
        ? `<img alt="${escapeHtml(item.name)}" class="sidebar-nav__channel-avatar" src="${item.avatar}" />`
        : `<div class="sidebar-nav__channel-badge">${escapeHtml(item.badge)}</div>`}
                        <div class="sidebar-nav__channel-text">${escapeHtml(item.name)}</div>
                    </a>
                `).join("")}
            </nav>
        </div>
        <div class="sidebar-nav__footer" data-sidebar-ref="account-shell">
            <button
                aria-expanded="${vm.accountMenuOpen ? "true" : "false"}"
                class="sidebar-nav__identity"
                data-sidebar-action="toggle-account-menu"
                type="button"
            >
                <img alt="${escapeHtml(vm.currentIdentity.name)}" class="sidebar-nav__identity-avatar" src="${vm.currentIdentity.avatar}" />
                <span class="sidebar-nav__identity-text">
                    <span class="sidebar-nav__identity-name">${escapeHtml(vm.currentIdentity.name)}</span>
                    ${vm.currentUserEmail ? `<span class="sidebar-nav__identity-email">${escapeHtml(vm.currentUserEmail)}</span>` : ""}
                </span>
                <span class="material-icons-outlined sidebar-nav__identity-arrow">${vm.accountMenuOpen ? "expand_less" : "expand_more"}</span>
            </button>
            ${vm.accountMenuOpen ? `
                <div class="sidebar-nav__account-menu">
                    <button class="sidebar-nav__account-action" data-sidebar-action="identity" type="button">
                        <span class="material-icons-outlined">badge</span>
                        <span>身份设置</span>
                    </button>
                    ${vm.canLogout ? `
                        <button class="sidebar-nav__account-action" data-sidebar-action="logout" type="button">
                            <span class="material-icons-outlined">logout</span>
                            <span>退出登录</span>
                        </button>
                    ` : ""}
                </div>
            ` : ""}
        </div>
    </div>
`;
