import { escapeHtml } from "../../shared/lib/helpers.js";

export const systemFeedbackTemplate = (vm) => `
    ${vm.blockingStatus === "error" ? `
        <div class="system-feedback__blocking system-feedback__blocking--error is-open">
            <div class="system-feedback__card">
                <span class="material-icons-outlined">sync_problem</span>
                <h3>频道初始化失败</h3>
                <p>${escapeHtml(vm.blockingError || "频道初始化失败，请重新尝试。")}</p>
                <button class="system-feedback__retry" data-system-action="retry-runtime" type="button">重新尝试</button>
            </div>
        </div>
    ` : ""}
    ${vm.deleteConfirm.open ? `
        <div class="system-feedback__confirm is-open">
            <div class="system-feedback__confirm-backdrop" data-system-action="cancel-delete"></div>
            <div class="system-feedback__confirm-card" role="dialog" aria-modal="true" aria-label="${escapeHtml(vm.deleteConfirm.title || "删除确认")}">
                <h3>${escapeHtml(vm.deleteConfirm.title || "删除确认")}</h3>
                <p>${escapeHtml(vm.deleteConfirm.message || "")}</p>
                ${vm.deleteConfirm.error ? `<div class="system-feedback__confirm-error">${escapeHtml(vm.deleteConfirm.error?.message || vm.deleteConfirm.error || "")}</div>` : ""}
                <div class="system-feedback__confirm-actions">
                    <button class="system-feedback__confirm-button" data-system-action="cancel-delete" type="button">取消</button>
                    <button class="system-feedback__confirm-button system-feedback__confirm-button--danger" data-system-action="confirm-delete" type="button" ${vm.deleteConfirm.submitStatus === "submitting" ? "disabled" : ""}>${vm.deleteConfirm.submitStatus === "submitting" ? "删除中" : "确认删除"}</button>
                </div>
            </div>
        </div>
    ` : ""}
    <div class="system-feedback__toast ${vm.toast.visible ? "is-visible" : ""} is-${vm.toast.tone}">
        <div class="system-feedback__toast-copy">${escapeHtml(vm.toast.message || "")}</div>
        <button class="system-feedback__toast-close" data-system-action="hide-toast" type="button">
            <span class="material-icons-outlined">close</span>
        </button>
    </div>
`;
