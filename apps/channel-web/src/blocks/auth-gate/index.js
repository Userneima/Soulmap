import "./styles.css";
import { attachAuthGateEvents } from "./events.js";
import { selectAuthGateVM } from "./selectors.js";
import { authGateTemplate } from "./template.js";

export const mountAuthGateBlock = ({ root, store, actions }) => {
    let refs = null;
    let previousVM = null;
    let hasBoundEvents = false;

    const ensureRefs = () => {
        refs = {
            displayNameInput: root.querySelector("[data-auth-gate-ref='display-name']"),
            emailInput: root.querySelector("[data-auth-gate-ref='email']"),
            passwordInput: root.querySelector("[data-auth-gate-ref='password']"),
            submitButton: root.querySelector("[data-auth-gate-action='submit']")
        };
    };

    const shouldRerender = (vm) => {
        if (!refs || root.innerHTML === "") {
            return true;
        }

        if (!previousVM) {
            return true;
        }

        return previousVM.open !== vm.open
            || previousVM.mode !== vm.mode
            || previousVM.error !== vm.error
            || previousVM.title !== vm.title
            || previousVM.description !== vm.description
            || previousVM.showDisplayName !== vm.showDisplayName
            || previousVM.canClose !== vm.canClose;
    };

    return {
        render() {
            const vm = selectAuthGateVM(store.getState());

            if (shouldRerender(vm)) {
                root.innerHTML = authGateTemplate(vm);
                ensureRefs();
                if (!hasBoundEvents) {
                    attachAuthGateEvents({ root, actions });
                    hasBoundEvents = true;
                }
                previousVM = vm;
                return;
            }

            if (refs.emailInput && document.activeElement !== refs.emailInput) {
                refs.emailInput.value = vm.email;
            }
            if (refs.displayNameInput && document.activeElement !== refs.displayNameInput) {
                refs.displayNameInput.value = vm.displayName;
            }
            if (refs.passwordInput && document.activeElement !== refs.passwordInput) {
                refs.passwordInput.value = vm.password;
            }
            if (refs.submitButton) {
                refs.submitButton.textContent = vm.submitLabel;
                refs.submitButton.disabled = !vm.canSubmit;
            }

            previousVM = vm;
        }
    };
};
