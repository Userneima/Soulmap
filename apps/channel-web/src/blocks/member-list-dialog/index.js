import "./styles.css";
import { attachMemberListDialogEvents } from "./events.js";
import { selectMemberListDialogVM } from "./selectors.js";
import { memberListDialogTemplate } from "./template.js";

export const mountMemberListDialogBlock = ({ root, store, actions }) => {
    let hasBoundEvents = false;

    return {
        render() {
            root.innerHTML = memberListDialogTemplate(selectMemberListDialogVM(store.getState()));
            if (!hasBoundEvents) {
                attachMemberListDialogEvents({ root, actions });
                hasBoundEvents = true;
            }
        }
    };
};
