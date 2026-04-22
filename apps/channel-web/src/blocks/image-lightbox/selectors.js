export const selectImageLightboxVM = (state) => ({
    open: state.overlayState.imageLightbox.open,
    image: state.overlayState.imageLightbox.image
});
