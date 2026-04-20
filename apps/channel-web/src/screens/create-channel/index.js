import "./styles.css";
import { escapeHtml } from "../../shared/lib/helpers.js";
import { mountAuthGateBlock } from "../../blocks/auth-gate/index.js";
import { mountSystemFeedbackBlock } from "../../blocks/system-feedback/index.js";

const selectCreateChannelVM = (state) => ({
    authStatus: state.authState.status,
    userEmail: state.authState.user?.email || "",
    name: state.channelCreateState.name,
    description: state.channelCreateState.description,
    status: state.channelCreateState.status,
    error: typeof state.channelCreateState.error === "string"
        ? state.channelCreateState.error
        : state.channelCreateState.error?.message || "",
    submitLabel: state.channelCreateState.status === "submitting"
        ? "创建中"
        : state.authState.status === "authenticated"
            ? "创建频道"
            : "登录后创建",
    canSubmit: Boolean(state.channelCreateState.name.trim())
        && state.channelCreateState.status !== "submitting"
});

const createChannelTemplate = (vm) => `
    <div class="channel-create">
        <div class="channel-create__shell">
            <a class="channel-create__back" href="/">
                <span class="material-icons-outlined">arrow_back</span>
                <span>返回频道列表</span>
            </a>
            <section class="channel-create__hero">
                <div class="channel-create__eyebrow">创建频道</div>
                <h1>新建一个频道</h1>
                <p>第一版只保留最小字段：频道名称和简介。创建成功后，你会直接成为频道主并进入频道。</p>
            </section>
            <section class="channel-create__panel" data-screen-slot="create-channel-form"></section>
        </div>
        <div data-screen-slot="auth-gate"></div>
        <div data-screen-slot="system-feedback"></div>
    </div>
`;

const createChannelFormTemplate = (vm) => `
    <div class="channel-create__form">
        <label class="channel-create__field">
            <span>频道名称</span>
            <input data-create-channel-ref="name" maxlength="48" placeholder="例如：产品研发讨论区" type="text" value="${escapeHtml(vm.name)}" />
        </label>
        <label class="channel-create__field">
            <span>频道简介</span>
            <textarea data-create-channel-ref="description" maxlength="280" placeholder="简单说明这个频道讨论什么、适合谁进入。">${escapeHtml(vm.description)}</textarea>
        </label>
        <div class="channel-create__hint">
            ${vm.authStatus === "authenticated"
        ? `当前登录：${escapeHtml(vm.userEmail || "已登录用户")}。新频道默认公开浏览、审批加入。`
        : "需要先登录，才能创建频道。登录成功后会自动回到这里继续。"}
        </div>
        ${vm.error ? `<div class="channel-create__error">${escapeHtml(vm.error)}</div>` : ""}
        <div class="channel-create__actions">
            <div class="channel-create__actions-copy">创建后会自动补齐频道主身份和默认匿名马甲。</div>
            <button class="channel-create__submit" data-create-channel-action="submit" ${vm.canSubmit ? "" : "disabled"} type="button">${escapeHtml(vm.submitLabel)}</button>
        </div>
    </div>
`;

export const mountCreateChannelPage = ({ root, store, actions }) => {
    root.innerHTML = createChannelTemplate(selectCreateChannelVM(store.getState()));

    const formRoot = root.querySelector('[data-screen-slot="create-channel-form"]');
    const authGateRoot = root.querySelector('[data-screen-slot="auth-gate"]');
    const systemFeedbackRoot = root.querySelector('[data-screen-slot="system-feedback"]');

    const blocks = [
        mountAuthGateBlock({ root: authGateRoot, store, actions }),
        mountSystemFeedbackBlock({ root: systemFeedbackRoot, store, actions })
    ];

    let refs = null;
    let previousVM = null;

    const ensureRefs = () => {
        refs = {
            nameInput: formRoot.querySelector("[data-create-channel-ref='name']"),
            descriptionInput: formRoot.querySelector("[data-create-channel-ref='description']"),
            submitButton: formRoot.querySelector("[data-create-channel-action='submit']")
        };
    };

    const shouldRerenderForm = (vm) => {
        if (!refs || !previousVM) {
            return true;
        }

        return previousVM.authStatus !== vm.authStatus
            || previousVM.error !== vm.error
            || previousVM.status !== vm.status;
    };

    formRoot.addEventListener("input", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) {
            return;
        }

        if (target.matches("[data-create-channel-ref='name']")) {
            actions.setCreateChannelField({
                name: target.value
            });
            return;
        }

        if (target.matches("[data-create-channel-ref='description']")) {
            actions.setCreateChannelField({
                description: target.value
            });
        }
    });

    formRoot.addEventListener("click", (event) => {
        const button = event.target.closest("[data-create-channel-action='submit']");
        if (!button) {
            return;
        }

        void actions.submitCreateChannel();
    });

    const renderForm = () => {
        const vm = selectCreateChannelVM(store.getState());

        if (shouldRerenderForm(vm)) {
            formRoot.innerHTML = createChannelFormTemplate(vm);
            ensureRefs();
            previousVM = vm;
            return;
        }

        if (refs.nameInput && document.activeElement !== refs.nameInput) {
            refs.nameInput.value = vm.name;
        }
        if (refs.descriptionInput && document.activeElement !== refs.descriptionInput) {
            refs.descriptionInput.value = vm.description;
        }
        if (refs.submitButton) {
            refs.submitButton.textContent = vm.submitLabel;
            refs.submitButton.disabled = !vm.canSubmit;
        }

        previousVM = vm;
    };

    const renderAll = () => {
        renderForm();
        blocks.forEach((block) => {
            block.render();
        });
    };

    store.subscribe(() => {
        renderAll();
    });

    renderAll();
};
