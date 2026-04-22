export const attachImageLightboxEvents = ({ root, actions }) => {
    root.addEventListener("click", (event) => {
        const button = event.target.closest("[data-image-lightbox-action='close']");
        if (!button) {
            return;
        }

        actions.closeOverlay("image-lightbox");
    });
};
