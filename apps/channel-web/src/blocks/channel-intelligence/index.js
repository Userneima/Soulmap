import "./styles.css";
import { attachChannelIntelligenceEvents } from "./events.js";
import { selectChannelIntelligenceVM } from "./selectors.js";
import { channelIntelligenceTemplate } from "./template.js";

export const mountChannelIntelligenceBlock = ({ root, store, actions }) => {
    let refs = null;
    let hasBoundEvents = false;
    let previousVM = null;
    let isComposing = false;

    const ensureRefs = () => {
        refs = {
            themeInput: root.querySelector("[data-channel-intelligence-ref='theme-input']")
        };

        if (!hasBoundEvents) {
            attachChannelIntelligenceEvents({ root, actions });
            root.addEventListener("compositionstart", (event) => {
                if (event.target.closest("[data-channel-intelligence-ref='theme-input']")) {
                    isComposing = true;
                }
            });
            root.addEventListener("compositionend", () => {
                isComposing = false;
            });
            hasBoundEvents = true;
        }
    };

    const getDigestSignature = (vm) => JSON.stringify({
        topThemes: vm.topThemes,
        representativePosts: vm.representativePosts,
        openQuestions: vm.openQuestions
    });

    const shouldRerender = (vm) => {
        if (!previousVM || root.innerHTML === "") {
            return true;
        }

        return previousVM.open !== vm.open
            || previousVM.godPickerOpen !== vm.godPickerOpen
            || previousVM.themeEditorOpen !== vm.themeEditorOpen
            || previousVM.revealEditorOpen !== vm.revealEditorOpen
            || previousVM.revealMemberPickerOpen !== vm.revealMemberPickerOpen
            || previousVM.revealAngelPickerOpen !== vm.revealAngelPickerOpen
            || previousVM.status !== vm.status
            || previousVM.metricsLine !== vm.metricsLine
            || previousVM.compactHint !== vm.compactHint
            || previousVM.currentTheme !== vm.currentTheme
            || previousVM.hasTheme !== vm.hasTheme
            || previousVM.canManageRound !== vm.canManageRound
            || previousVM.canEditTheme !== vm.canEditTheme
            || previousVM.currentStageLabel !== vm.currentStageLabel
            || previousVM.currentTaskLabel !== vm.currentTaskLabel
            || previousVM.currentDeadlineLabel !== vm.currentDeadlineLabel
            || previousVM.currentTaskStatus !== vm.currentTaskStatus
            || previousVM.currentTaskHint !== vm.currentTaskHint
            || previousVM.godProfile?.name !== vm.godProfile?.name
            || previousVM.godProfile?.avatar !== vm.godProfile?.avatar
            || previousVM.draftRevealMember?.name !== vm.draftRevealMember?.name
            || previousVM.draftRevealAngel?.name !== vm.draftRevealAngel?.name
            || previousVM.revealResult?.actualName !== vm.revealResult?.actualName
            || previousVM.revealResult?.guessedName !== vm.revealResult?.guessedName
            || getDigestSignature(previousVM) !== getDigestSignature(vm);
    };

    return {
        render() {
            const vm = selectChannelIntelligenceVM(store.getState());
            const shouldRefocus = refs?.themeInput && document.activeElement === refs.themeInput;
            const selectionStart = shouldRefocus ? refs.themeInput.selectionStart ?? vm.draftTheme.length : vm.draftTheme.length;
            const selectionEnd = shouldRefocus ? refs.themeInput.selectionEnd ?? vm.draftTheme.length : vm.draftTheme.length;

            if (shouldRerender(vm)) {
                root.innerHTML = channelIntelligenceTemplate(vm);
                ensureRefs();

                if (shouldRefocus && refs?.themeInput && vm.themeEditorOpen) {
                    refs.themeInput.focus();
                    refs.themeInput.setSelectionRange(selectionStart, selectionEnd);
                }

                previousVM = vm;
                return;
            }

            if (refs?.themeInput && document.activeElement !== refs.themeInput && !isComposing && refs.themeInput.value !== vm.draftTheme) {
                refs.themeInput.value = vm.draftTheme;
            }

            previousVM = vm;
        }
    };
};
