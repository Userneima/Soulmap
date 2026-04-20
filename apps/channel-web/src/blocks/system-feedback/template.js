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
    <div class="system-feedback__toast ${vm.toast.visible ? "is-visible" : ""} is-${vm.toast.tone}">
        <div class="system-feedback__toast-copy">${escapeHtml(vm.toast.message || "")}</div>
        <button class="system-feedback__toast-close" data-system-action="hide-toast" type="button">
            <span class="material-icons-outlined">close</span>
        </button>
    </div>
`;
