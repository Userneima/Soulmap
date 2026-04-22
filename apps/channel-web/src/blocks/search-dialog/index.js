import "./styles.css";
import { attachSearchDialogEvents } from "./events.js";
import { selectSearchDialogVM } from "./selectors.js";
import { searchDialogTemplate } from "./template.js";

export const mountSearchDialogBlock = ({ root, store, actions }) => {
    let refs = null;
    let hasBoundEvents = false;
    let previousVm = null;
    let isScrollLocked = false;

    const syncScrollLock = (open) => {
        if (typeof document === "undefined") {
            return;
        }

        if (open && !isScrollLocked) {
            document.body.classList.add("app-scroll-locked");
            document.documentElement.classList.add("app-scroll-locked");
            isScrollLocked = true;
            return;
        }

        if (!open && isScrollLocked) {
            document.body.classList.remove("app-scroll-locked");
            document.documentElement.classList.remove("app-scroll-locked");
            isScrollLocked = false;
        }
    };

    const ensureRefs = () => {
        refs = {
            input: root.querySelector("[data-search-dialog-ref='input']")
        };

        if (!hasBoundEvents) {
            attachSearchDialogEvents({ root, actions });
            hasBoundEvents = true;
        }
    };

    return {
        render() {
            const vm = selectSearchDialogVM(store.getState());
            const shouldRerender = !previousVm
                || root.innerHTML === ""
                || previousVm.open !== vm.open
                || previousVm.status !== vm.status
                || previousVm.query !== vm.query
                || previousVm.sort !== vm.sort
                || previousVm.board !== vm.board
                || previousVm.error !== vm.error
                || JSON.stringify(previousVm.items) !== JSON.stringify(vm.items);

            if (shouldRerender) {
                root.innerHTML = searchDialogTemplate(vm);
                ensureRefs();
            }

            syncScrollLock(vm.open);

            if (vm.open && refs?.input && document.activeElement !== refs.input) {
                refs.input.focus();
                refs.input.select();
            }

            previousVm = vm;
        }
    };
};
