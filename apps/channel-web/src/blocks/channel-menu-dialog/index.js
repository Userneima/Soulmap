import "./styles.css";
import { attachChannelMenuDialogEvents } from "./events.js";
import { selectChannelMenuDialogVM } from "./selectors.js";
import { channelMenuDialogTemplate } from "./template.js";

export const mountChannelMenuDialogBlock = ({ root, store, actions }) => {
    let hasBoundEvents = false;

    return {
        render() {
            const vm = selectChannelMenuDialogVM(store.getState());
            root.innerHTML = channelMenuDialogTemplate(vm);

            if (!hasBoundEvents) {
                attachChannelMenuDialogEvents({ root, actions });
                hasBoundEvents = true;
            }
        }
    };
};
