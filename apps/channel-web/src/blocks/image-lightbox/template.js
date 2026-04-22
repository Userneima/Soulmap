import { escapeHtml } from "../../shared/lib/helpers.js";

export const imageLightboxTemplate = (vm) => `
    <div class="image-lightbox ${vm.open ? "is-open" : ""}">
        <div class="image-lightbox__backdrop" data-image-lightbox-action="close"></div>
        <div class="image-lightbox__panel">
            <button class="image-lightbox__close" data-image-lightbox-action="close" type="button" aria-label="关闭图片查看">
                <span class="material-icons-outlined">close</span>
            </button>
            ${vm.image ? `
                <div class="image-lightbox__frame">
                    <img alt="${escapeHtml(vm.image.name)}" class="image-lightbox__image" src="${vm.image.url}" />
                </div>
            ` : ""}
        </div>
    </div>
`;
