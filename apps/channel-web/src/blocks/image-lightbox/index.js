import "./styles.css";
import { attachImageLightboxEvents } from "./events.js";
import { selectImageLightboxVM } from "./selectors.js";
import { imageLightboxTemplate } from "./template.js";

export const mountImageLightboxBlock = ({ root, store, actions }) => {
    let hasBoundEvents = false;

    return {
        render() {
            root.innerHTML = imageLightboxTemplate(selectImageLightboxVM(store.getState()));

            if (!hasBoundEvents) {
                attachImageLightboxEvents({ root, actions });
                hasBoundEvents = true;
            }
        }
    };
};
