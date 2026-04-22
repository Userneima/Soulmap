import { escapeHtml } from "../../shared/lib/helpers.js";

export const authGateTemplate = (vm) => `
    <div class="auth-gate ${vm.open ? "is-open" : ""}">
        <div class="auth-gate__backdrop" ${vm.canClose ? 'data-auth-gate-action="close"' : ""}></div>
        <div class="auth-gate__panel" aria-hidden="${vm.open ? "false" : "true"}">
            <header class="auth-gate__header">
                <div>
                    <h3>${escapeHtml(vm.title)}</h3>
                    <p>${escapeHtml(vm.description)}</p>
                </div>
                ${vm.canClose ? `
                    <button class="auth-gate__ghost" data-auth-gate-action="close" type="button">
                        <span class="material-icons-outlined">close</span>
                    </button>
                ` : ""}
            </header>
            <div class="auth-gate__body">
                ${vm.showDisplayName ? `
                    <label class="auth-gate__field">
                        <span>昵称</span>
                        <input autocomplete="nickname" data-auth-gate-ref="display-name" maxlength="24" placeholder="例如：海屿" type="text" value="${escapeHtml(vm.displayName)}" />
                    </label>
                ` : ""}
                <label class="auth-gate__field">
                    <span>邮箱</span>
                    <input autocomplete="email" data-auth-gate-ref="email" placeholder="name@example.com" type="email" value="${escapeHtml(vm.email)}" />
                </label>
                <label class="auth-gate__field">
                    <span>密码</span>
                    <input autocomplete="current-password" data-auth-gate-ref="password" placeholder="请输入密码" type="password" value="${escapeHtml(vm.password)}" />
                </label>
                ${vm.error ? `<div class="auth-gate__error">${escapeHtml(vm.error)}</div>` : ""}
            </div>
            <footer class="auth-gate__footer">
                ${vm.showModeSwitch ? `
                    <div class="auth-gate__mode-switch">
                        <button class="auth-gate__text-button ${vm.mode === "login" ? "is-active" : ""}" data-auth-gate-action="switch-login" type="button">登录</button>
                        <button class="auth-gate__text-button ${vm.mode === "register" ? "is-active" : ""}" data-auth-gate-action="switch-register" type="button">注册</button>
                    </div>
                ` : '<div></div>'}
                <button class="auth-gate__primary" data-auth-gate-action="submit" ${vm.canSubmit ? "" : "disabled"} type="button">${escapeHtml(vm.submitLabel)}</button>
            </footer>
        </div>
    </div>
`;
