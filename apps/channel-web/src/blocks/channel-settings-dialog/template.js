import { escapeHtml } from "../../shared/lib/helpers.js";

export const channelSettingsDialogTemplate = (vm) => `
    <div class="channel-settings-dialog ${vm.open ? "is-open" : ""}">
        <div class="channel-settings-dialog__backdrop" data-channel-settings-action="close"></div>
        <div class="channel-settings-dialog__panel">
            <header class="channel-settings-dialog__header">
                <div class="channel-settings-dialog__header-copy">
                    <h3>编辑频道资料</h3>
                </div>
                <button class="channel-settings-dialog__ghost" data-channel-settings-action="close" type="button">
                    <span class="material-icons-outlined">close</span>
                </button>
            </header>
            <div class="channel-settings-dialog__body">
                <label class="channel-settings-dialog__cover-shell">
                    <img alt="${escapeHtml(vm.draftName || "频道背景图")}" class="channel-settings-dialog__cover" data-ref="channel-background-preview" src="${vm.backgroundPreview}" />
                    <span class="channel-settings-dialog__cover-overlay">
                        <span class="material-icons-outlined">photo_camera</span>
                        <span>更换背景图</span>
                    </span>
                    <input accept="image/*" class="sr-only" data-ref="channel-background-input" type="file" />
                </label>
                <div class="channel-settings-dialog__media-meta">
                    <span class="channel-settings-dialog__media-label">频道背景图</span>
                    ${vm.canClearBackground
        ? `<button class="channel-settings-dialog__clear" data-channel-settings-action="clear-background" type="button">移除背景图</button>`
        : ""}
                </div>
                <div class="channel-settings-dialog__logo-row">
                    <div class="channel-settings-dialog__logo-group">
                        <div class="channel-settings-dialog__logo-shell">
                            <img alt="${escapeHtml(vm.draftName || "频道头像")}" class="channel-settings-dialog__logo" data-ref="channel-logo-preview" src="${vm.logoPreview}" />
                            <label class="channel-settings-dialog__logo-trigger">
                                <span class="material-icons-outlined">photo_camera</span>
                                <input accept="image/*" class="sr-only" data-ref="channel-logo-input" type="file" />
                            </label>
                        </div>
                        ${vm.canClearLogo
        ? `<button class="channel-settings-dialog__clear" data-channel-settings-action="clear-logo" type="button">恢复默认头像</button>`
        : ""}
                    </div>
                    <label class="channel-settings-dialog__field">
                        <span class="channel-settings-dialog__inline-field">
                            <span class="channel-settings-dialog__inline-label">频道名称</span>
                            <input data-ref="channel-name-input" maxlength="24" type="text" value="${escapeHtml(vm.draftName)}" />
                            <span class="channel-settings-dialog__count" data-ref="channel-name-count">${vm.nameCount}</span>
                        </span>
                    </label>
                </div>
                ${vm.error ? `<div class="channel-settings-dialog__error">${escapeHtml(vm.error)}</div>` : ""}
            </div>
            <footer class="channel-settings-dialog__footer">
                <button class="channel-settings-dialog__secondary" data-channel-settings-action="close" type="button">取消</button>
                <button class="channel-settings-dialog__primary" data-channel-settings-action="save" ${vm.canSave ? "" : "disabled"} type="button">${vm.saveStatus === "saving" ? "保存中" : "保存"}</button>
            </footer>
        </div>
    </div>
`;
