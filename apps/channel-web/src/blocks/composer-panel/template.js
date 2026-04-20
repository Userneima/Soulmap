import { escapeHtml } from "../../shared/lib/helpers.js";

export const composerPanelTemplate = (vm) => `
    <div class="composer-panel">
        ${!vm.canCompose ? `
            <div class="composer-panel__row composer-panel__row--disabled">
                <button class="composer-panel__identity" type="button">
                    <img alt="${escapeHtml(vm.identityDisplay.name)}" class="composer-panel__avatar" src="${vm.identityDisplay.avatar}" />
                </button>
                <label class="composer-panel__field">
                    <span class="sr-only">帖子内容</span>
                    <textarea class="composer-panel__textarea composer-panel__textarea--disabled" disabled placeholder="${escapeHtml(vm.gate.placeholder || vm.placeholder)}"></textarea>
                </label>
                <div class="composer-panel__icons composer-panel__icons--disabled">
                    <button class="composer-panel__icon-button" disabled type="button">
                        <span class="material-icons-outlined">sentiment_satisfied_alt</span>
                    </button>
                    <button class="composer-panel__icon-button" disabled type="button">
                        <span class="material-icons-outlined">alternate_email</span>
                    </button>
                    <button class="composer-panel__icon-button" disabled type="button">
                        <span class="material-icons-outlined">image</span>
                    </button>
                    <button class="composer-panel__icon-button" disabled type="button">
                        <span class="material-icons-outlined">campaign</span>
                    </button>
                </div>
            </div>
        ` : `
        <div class="composer-panel__compose-shell">
            <div class="composer-panel__topbar">
                <button class="composer-panel__identity" data-composer-action="open-identity" type="button">
                    <img alt="${escapeHtml(vm.identityDisplay.name)}" class="composer-panel__avatar" data-ref="identity-avatar" src="${vm.identityDisplay.avatar}" />
                    <span class="composer-panel__identity-name" data-ref="identity-name">${escapeHtml(vm.identityDisplay.name)}</span>
                </button>
                <div class="composer-panel__tools">
                    <button class="composer-panel__icon-button" type="button" title="表情">
                        <span class="material-icons-outlined">sentiment_satisfied_alt</span>
                    </button>
                    <button class="composer-panel__icon-button composer-panel__icon-button--toggle ${vm.anonymousMode ? "is-active" : ""}" data-composer-action="toggle-anonymous" type="button" title="匿名发言">
                        <span class="material-icons-outlined" data-ref="anonymous-icon">alternate_email</span>
                    </button>
                    <label class="composer-panel__icon-button composer-panel__file-trigger" title="插入图片">
                        <span class="material-icons-outlined">image</span>
                        <input accept="image/*" class="sr-only" data-ref="image-input" multiple type="file" />
                    </label>
                    <div class="composer-panel__disclosure-wrap">
                        <button class="composer-panel__icon-button composer-panel__icon-button--toggle ${vm.aiDisclosureOpen ? "is-active" : ""}" data-composer-action="toggle-ai-disclosure" type="button" title="自主声明">
                            <span class="material-icons-outlined">campaign</span>
                        </button>
                        <div class="composer-panel__disclosure-menu ${vm.aiDisclosureOpen ? "is-open" : ""}">
                            <div class="composer-panel__disclosure-title">自主声明</div>
                            ${vm.aiDisclosureChoices.map((choice) => `
                                <button class="composer-panel__disclosure-option ${choice.value === vm.aiDisclosure ? "is-active" : ""}" data-ai-disclosure-value="${choice.value}" type="button">
                                    <span>${escapeHtml(choice.label)}</span>
                                    ${choice.value === vm.aiDisclosure ? `<span class="material-icons-outlined">done</span>` : ""}
                                </button>
                            `).join("")}
                        </div>
                    </div>
                    ${vm.anonymousMode ? `
                        <button class="composer-panel__icon-button" data-composer-action="rotate-alias" type="button" title="换马甲">
                            <span class="material-icons-outlined">autorenew</span>
                        </button>
                    ` : ""}
                    <button class="composer-panel__icon-button" type="button" title="关闭">
                        <span class="material-icons-outlined">close</span>
                    </button>
                </div>
            </div>
            <div class="composer-panel__editor">
                <label class="composer-panel__field composer-panel__field--expanded">
                    <span class="sr-only">帖子内容</span>
                    <textarea class="composer-panel__textarea composer-panel__textarea--expanded" data-ref="draft-input" placeholder="${escapeHtml(vm.placeholder)}">${escapeHtml(vm.draftText)}</textarea>
                </label>
                <div class="composer-panel__media-row">
                    <label class="composer-panel__add-tile">
                        <span class="material-icons-outlined">add</span>
                        <input accept="image/*" class="sr-only" data-ref="image-input-secondary" multiple type="file" />
                    </label>
                    <div class="composer-panel__image-list" data-ref="image-list"></div>
                    <div class="composer-panel__footer composer-panel__footer--expanded">
                        <div class="composer-panel__footer-right">
                            <div class="composer-panel__count" data-ref="char-count">${vm.charCount}/1000</div>
                            <label class="composer-panel__select">
                                <select data-ref="board-select">
                                    ${vm.boardChoices.map((choice) => `
                                        <option value="${choice.value}" ${choice.value === vm.selectedBoard ? "selected" : ""}>${escapeHtml(choice.label)}</option>
                                    `).join("")}
                                </select>
                            </label>
                            <button class="composer-panel__submit" data-ref="submit-button" ${vm.canSubmit ? "" : "disabled"} type="button">${escapeHtml(vm.submitLabel)}</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `}
    </div>
`;
