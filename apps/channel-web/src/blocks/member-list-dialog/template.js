import { escapeHtml } from "../../shared/lib/helpers.js";

const buildMemberItem = (member) => `
    <div class="member-list-dialog__item">
        <img alt="${escapeHtml(member.name)}" class="member-list-dialog__avatar" src="${member.avatar}" />
        <div class="member-list-dialog__copy">
            <div class="member-list-dialog__name">${escapeHtml(member.name)}</div>
            <div class="member-list-dialog__meta">社区成员</div>
        </div>
    </div>
`;

export const memberListDialogTemplate = (vm) => `
    <div class="member-list-dialog ${vm.open ? "is-open" : ""}" aria-hidden="${vm.open ? "false" : "true"}">
        <div class="member-list-dialog__backdrop" data-member-list-action="close"></div>
        <section class="member-list-dialog__panel" role="dialog" aria-modal="true" aria-label="频道成员">
            <header class="member-list-dialog__header">
                <div class="member-list-dialog__header-copy">
                    <h3>频道成员</h3>
                    <p>${escapeHtml(vm.subtitle)}</p>
                </div>
                <button class="member-list-dialog__ghost" data-member-list-action="close" type="button" aria-label="关闭成员名单">
                    <span class="material-icons-outlined">close</span>
                </button>
            </header>
            <div class="member-list-dialog__body">
                ${vm.members.length
        ? vm.members.map(buildMemberItem).join("")
        : '<div class="member-list-dialog__empty">当前还没有可展示的成员。</div>'}
            </div>
        </section>
    </div>
`;
