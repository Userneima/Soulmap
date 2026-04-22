import "./styles.css";
import { attachChannelSettingsDialogEvents } from "./events.js";
import { selectChannelSettingsDialogVM } from "./selectors.js";
import { channelSettingsDialogTemplate } from "./template.js";

export const mountChannelSettingsDialogBlock = ({ root, store, actions }) => {
    let refs = null;
    let previousVM = null;
    let hasBoundEvents = false;
    let isComposing = false;

    const ensureRefs = () => {
        refs = {
            nameInput: root.querySelector("[data-ref='channel-name-input']"),
            nameCount: root.querySelector("[data-ref='channel-name-count']"),
            logoPreview: root.querySelector("[data-ref='channel-logo-preview']"),
            backgroundPreview: root.querySelector("[data-ref='channel-background-preview']"),
            saveButton: root.querySelector("[data-channel-settings-action='save']")
        };

        if (!hasBoundEvents) {
            attachChannelSettingsDialogEvents({ root, actions });
            root.addEventListener("compositionstart", (event) => {
                if (event.target.closest("[data-ref='channel-name-input']")) {
                    isComposing = true;
                }
            });
            root.addEventListener("compositionend", () => {
                isComposing = false;
            });
            hasBoundEvents = true;
        }
    };

    const shouldRerender = (vm) => {
        if (!previousVM || root.innerHTML === "") {
            return true;
        }

        return previousVM.open !== vm.open
            || previousVM.error !== vm.error
            || previousVM.saveStatus !== vm.saveStatus
            || previousVM.draftLogo !== vm.draftLogo
            || previousVM.draftBackground !== vm.draftBackground
            || previousVM.canClearLogo !== vm.canClearLogo
            || previousVM.canClearBackground !== vm.canClearBackground;
    };

    return {
        render() {
            const vm = selectChannelSettingsDialogVM(store.getState());
            const shouldRefocus = refs?.nameInput && document.activeElement === refs.nameInput;

            if (shouldRerender(vm)) {
                root.innerHTML = channelSettingsDialogTemplate(vm);
                ensureRefs();

                if (shouldRefocus && refs?.nameInput) {
                    refs.nameInput.focus();
                    refs.nameInput.setSelectionRange(vm.draftName.length, vm.draftName.length);
                }

                previousVM = vm;
                return;
            }

            if (refs?.logoPreview) {
                refs.logoPreview.src = vm.logoPreview;
                refs.logoPreview.alt = vm.draftName || "频道头像";
            }

            if (refs?.backgroundPreview) {
                refs.backgroundPreview.src = vm.backgroundPreview;
                refs.backgroundPreview.alt = vm.draftName || "频道背景图";
            }

            if (refs?.nameCount) {
                refs.nameCount.textContent = vm.nameCount;
            }

            if (refs?.saveButton) {
                refs.saveButton.disabled = !vm.canSave;
                refs.saveButton.textContent = vm.saveStatus === "saving" ? "保存中" : "保存";
            }

            if (refs?.nameInput && document.activeElement !== refs.nameInput && !isComposing) {
                refs.nameInput.value = vm.draftName;
            }

            previousVM = vm;
        }
    };
};
