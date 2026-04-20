import { escapeHtml } from "../../shared/lib/helpers.js";

export const joinRequestPanelTemplate = (vm) => {
    if (!vm.visible) {
        return "";
    }

    return `
        <section class="join-request-panel">
            <div class="join-request-panel__copy">
                <h3>${escapeHtml(vm.title)}</h3>
                <p>${escapeHtml(vm.description)}</p>
                ${vm.joinRequest?.reviewNote ? `<div class="join-request-panel__note">${escapeHtml(vm.joinRequest.reviewNote)}</div>` : ""}
                ${vm.error ? `<div class="join-request-panel__error">${escapeHtml(vm.error)}</div>` : ""}
            </div>
            <div class="join-request-panel__actions">
                ${vm.isLoggedIn && vm.membershipStatus !== "pending" ? `
                    <label class="join-request-panel__field">
                        <span>申请说明</span>
                        <textarea data-join-request-ref="message" placeholder="可选，简单说明你为什么希望加入这个频道。">${escapeHtml(vm.draftMessage)}</textarea>
                    </label>
                ` : ""}
                <button
                    class="join-request-panel__primary"
                    data-join-request-action="${vm.authStatus === "guest" ? "login" : vm.authStatus === "upgrading_legacy_anonymous" ? "upgrade" : "submit"}"
                    ${vm.canSubmit || vm.authStatus !== "authenticated" ? "" : "disabled"}
                    type="button"
                >
                    ${vm.submitStatus === "submitting" ? "提交中" : escapeHtml(vm.primaryLabel)}
                </button>
            </div>
        </section>
    `;
};
