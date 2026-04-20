import "./styles.css";
import { attachComposerPanelEvents } from "./events.js";
import { selectComposerPanelVM } from "./selectors.js";
import { composerPanelTemplate } from "./template.js";

const renderImages = (container, images) => {
    container.innerHTML = images.map((image) => `
        <div class="composer-panel__image" data-image-id="${image.id}">
            <img alt="${image.name}" src="${image.url}" />
            <button class="composer-panel__remove-image" data-remove-image="${image.id}" type="button">
                <span class="material-icons-outlined">close</span>
            </button>
        </div>
    `).join("");
};

export const mountComposerPanelBlock = ({ root, store, actions }) => {
    let refs = null;
    let previousCanCompose = null;

    const ensureRefs = () => {
        refs = {
            draftInput: root.querySelector("[data-ref='draft-input']"),
            imageList: root.querySelector("[data-ref='image-list']"),
            identityAvatar: root.querySelector("[data-ref='identity-avatar']"),
            identityName: root.querySelector("[data-ref='identity-name']"),
            identityMeta: root.querySelector("[data-ref='identity-meta']"),
            anonymousIcon: root.querySelector("[data-ref='anonymous-icon']"),
            aiDisclosureSelect: root.querySelector("[data-ref='ai-disclosure-select']"),
            boardSelect: root.querySelector("[data-ref='board-select']"),
            autoRotate: root.querySelector("[data-ref='auto-rotate']"),
            charCount: root.querySelector("[data-ref='char-count']"),
            submitButton: root.querySelector("[data-ref='submit-button']")
        };
        const fileInput = root.querySelector("[data-ref='image-input']");
        const submitButton = refs.submitButton;

        attachComposerPanelEvents({ root, actions });
        root.addEventListener("click", (event) => {
            const removeButton = event.target.closest("[data-remove-image]");
            if (removeButton) {
                actions.removeComposerImage(Number(removeButton.dataset.removeImage));
                return;
            }

            if (submitButton && event.target.closest("[data-ref='submit-button']")) {
                void actions.submitPost();
            }
        });

        if (fileInput) {
            fileInput.addEventListener("change", () => {});
        }
    };

    return {
        render() {
            const vm = selectComposerPanelVM(store.getState());
            const shouldRerenderShell = !refs
                || root.innerHTML === ""
                || previousCanCompose !== vm.canCompose;

            if (shouldRerenderShell) {
                root.innerHTML = composerPanelTemplate(vm);
                ensureRefs();
                previousCanCompose = vm.canCompose;
                if (!vm.canCompose) {
                    return;
                }
            }

            if (refs.identityAvatar) {
                refs.identityAvatar.src = vm.identityDisplay.avatar;
                refs.identityAvatar.alt = vm.identityDisplay.name;
            }
            if (refs.identityName) {
                refs.identityName.textContent = vm.identityDisplay.name;
            }
            if (refs.draftInput && document.activeElement !== refs.draftInput) {
                refs.draftInput.value = vm.draftText;
            }
            if (refs.draftInput) {
                refs.draftInput.placeholder = vm.placeholder;
            }
            if (refs.boardSelect) {
                refs.boardSelect.value = vm.selectedBoard;
            }
            if (refs.charCount) {
                refs.charCount.textContent = `${vm.charCount}/1000`;
            }
            if (refs.submitButton) {
                refs.submitButton.textContent = vm.submitLabel;
                refs.submitButton.disabled = !vm.canSubmit;
            }
            if (refs.imageList) {
                renderImages(refs.imageList, vm.images);
            }

            const anonymousToggle = root.querySelector("[data-composer-action='toggle-anonymous']");
            if (anonymousToggle) {
                anonymousToggle.classList.toggle("is-active", vm.anonymousMode);
            }
            if (refs.anonymousIcon) {
                refs.anonymousIcon.textContent = "alternate_email";
            }

            previousCanCompose = vm.canCompose;
        }
    };
};
