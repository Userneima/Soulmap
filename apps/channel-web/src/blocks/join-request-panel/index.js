import "./styles.css";
import { attachJoinRequestPanelEvents } from "./events.js";
import { selectJoinRequestPanelVM } from "./selectors.js";
import { joinRequestPanelTemplate } from "./template.js";

export const mountJoinRequestPanelBlock = ({ root, store, actions }) => {
    let hasBoundEvents = false;

    return {
        render() {
            root.innerHTML = joinRequestPanelTemplate(selectJoinRequestPanelVM(store.getState()));
            if (!hasBoundEvents) {
                attachJoinRequestPanelEvents({ root, actions });
                hasBoundEvents = true;
            }
        }
    };
};
