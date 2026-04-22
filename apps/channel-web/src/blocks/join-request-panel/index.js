import "./styles.css";
import { attachJoinRequestPanelEvents } from "./events.js";
import { selectJoinRequestPanelVM } from "./selectors.js";
import { joinRequestPanelTemplate } from "./template.js";

export const mountJoinRequestPanelBlock = ({ root, store, actions }) => {
    let refs = null;
    let hasBoundEvents = false;

    const ensureRefs = () => {
        refs = {
            messageInput: root.querySelector("[data-join-request-ref='message']"),
            submitButton: root.querySelector("[data-join-request-action]")
        };
    };

    const shouldRerender = (previousVM, nextVM) => {
        if (!previousVM || root.innerHTML === "") {
            return true;
        }

        return previousVM.visible !== nextVM.visible
            || previousVM.authStatus !== nextVM.authStatus
            || previousVM.membershipStatus !== nextVM.membershipStatus
            || previousVM.submitStatus !== nextVM.submitStatus
            || previousVM.error !== nextVM.error
            || previousVM.title !== nextVM.title
            || previousVM.description !== nextVM.description
            || previousVM.primaryLabel !== nextVM.primaryLabel
            || previousVM.isLoggedIn !== nextVM.isLoggedIn
            || previousVM.joinRequest?.reviewNote !== nextVM.joinRequest?.reviewNote;
    };

    let previousVM = null;
    let isComposing = false;

    return {
        render() {
            const vm = selectJoinRequestPanelVM(store.getState());
            const shouldRefocus = refs?.messageInput && document.activeElement === refs.messageInput;
            const selectionStart = shouldRefocus ? refs.messageInput.selectionStart ?? vm.draftMessage.length : vm.draftMessage.length;
            const selectionEnd = shouldRefocus ? refs.messageInput.selectionEnd ?? vm.draftMessage.length : vm.draftMessage.length;

            if (shouldRerender(previousVM, vm)) {
                root.innerHTML = joinRequestPanelTemplate(vm);
                ensureRefs();
                if (shouldRefocus && refs?.messageInput) {
                    refs.messageInput.focus();
                    refs.messageInput.setSelectionRange(selectionStart, selectionEnd);
                }
                previousVM = vm;
            } else {
                if (refs?.messageInput && document.activeElement !== refs.messageInput && !isComposing && refs.messageInput.value !== vm.draftMessage) {
                    refs.messageInput.value = vm.draftMessage;
                }

                if (refs?.submitButton) {
                    refs.submitButton.disabled = !(vm.canSubmit || vm.authStatus !== "authenticated");
                    refs.submitButton.textContent = vm.submitStatus === "submitting" ? "提交中" : vm.primaryLabel;
                }

                previousVM = vm;
            }

            if (!hasBoundEvents) {
                attachJoinRequestPanelEvents({ root, actions });
                root.addEventListener("compositionstart", (event) => {
                    if (event.target.closest("[data-join-request-ref='message']")) {
                        isComposing = true;
                    }
                });
                root.addEventListener("compositionend", () => {
                    isComposing = false;
                });
                hasBoundEvents = true;
            }
        }
    };
};
