import { escapeHtml } from "../../shared/lib/helpers.js";

export const membershipReviewPanelTemplate = (vm) => {
    if (!vm.visible) {
        return "";
    }

    return `
        <section class="membership-review-panel">
            <header class="membership-review-panel__header">
                <div>
                    <h3>待审核成员</h3>
                </div>
                ${vm.reviewStatus === "loading" ? "<span>加载中...</span>" : `<span>${vm.items.length} 条申请</span>`}
            </header>
            <div class="membership-review-panel__list">
                ${vm.items.map((item) => `
                    <article class="membership-review-panel__item">
                        <div class="membership-review-panel__identity">
                            <img alt="${escapeHtml(item.applicantName)}" class="membership-review-panel__avatar" src="${item.applicantAvatar}" />
                            <div>
                                <div class="membership-review-panel__name">${escapeHtml(item.applicantName)}</div>
                                <div class="membership-review-panel__meta">${escapeHtml(item.message || "没有填写申请说明")}</div>
                            </div>
                        </div>
                        <div class="membership-review-panel__actions">
                            <button class="membership-review-panel__reject" data-membership-review-action="reject" data-request-id="${item.id}" ${vm.disabled ? "disabled" : ""} type="button">拒绝</button>
                            <button class="membership-review-panel__approve" data-membership-review-action="approve" data-request-id="${item.id}" ${vm.disabled ? "disabled" : ""} type="button">通过</button>
                        </div>
                    </article>
                `).join("")}
            </div>
        </section>
    `;
};
