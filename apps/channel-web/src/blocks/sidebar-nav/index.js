import "./styles.css";
import { selectSidebarNavVM } from "./selectors.js";
import { sidebarNavTemplate } from "./template.js";
import { attachSidebarNavEvents } from "./events.js";

export const mountSidebarNavBlock = ({ root, store, actions }) => {
    let refs = null;
    let previousVM = null;
    let hasBoundEvents = false;
    let hasBoundDocumentEvents = false;

    const ensureRefs = () => {
        refs = {
            searchInput: root.querySelector("[data-sidebar-ref='search-input']"),
            accountShell: root.querySelector("[data-sidebar-ref='account-shell']")
        };
    };

    const shouldRerender = (vm) => {
        if (!previousVM || root.innerHTML === "") {
            return true;
        }

        return previousVM.sidebarOpen !== vm.sidebarOpen
            || previousVM.accountMenuOpen !== vm.accountMenuOpen
            || previousVM.brandName !== vm.brandName
            || previousVM.searchChannelName !== vm.searchChannelName
            || previousVM.searchChannelBadge !== vm.searchChannelBadge
            || previousVM.searchFocusNonce !== vm.searchFocusNonce
            || previousVM.currentIdentity.name !== vm.currentIdentity.name
            || previousVM.currentIdentity.avatar !== vm.currentIdentity.avatar
            || previousVM.currentUserEmail !== vm.currentUserEmail
            || previousVM.canLogout !== vm.canLogout
            || JSON.stringify(previousVM.navItems) !== JSON.stringify(vm.navItems)
            || JSON.stringify(previousVM.channelItems) !== JSON.stringify(vm.channelItems)
            || JSON.stringify(previousVM.unjoinedItems) !== JSON.stringify(vm.unjoinedItems);
    };

    return {
        render() {
            const vm = selectSidebarNavVM(store.getState());

            if (shouldRerender(vm)) {
                root.innerHTML = sidebarNavTemplate(vm);
                ensureRefs();
                if (!hasBoundEvents) {
                    attachSidebarNavEvents({ root, actions });
                    hasBoundEvents = true;
                }
                if (!hasBoundDocumentEvents) {
                    document.addEventListener("click", (event) => {
                        const shell = refs?.accountShell;
                        if (!shell) {
                            return;
                        }

                        if (!store.getState().uiState.accountMenuOpen) {
                            return;
                        }

                        if (shell.contains(event.target)) {
                            return;
                        }

                        actions.setAccountMenuOpen(false);
                    });
                    hasBoundDocumentEvents = true;
                }
                if (refs?.searchInput && vm.searchFocusNonce) {
                    refs.searchInput.focus();
                    refs.searchInput.select();
                }
                previousVM = vm;
                return;
            }

            if (refs?.searchInput && document.activeElement !== refs.searchInput) {
                refs.searchInput.value = vm.searchQuery;
            }

            if (refs?.searchInput && previousVM?.searchFocusNonce !== vm.searchFocusNonce) {
                refs.searchInput.focus();
                refs.searchInput.select();
            }

            previousVM = vm;
        }
    };
};
