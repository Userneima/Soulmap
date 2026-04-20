import "./styles.css";
import { attachMembershipReviewPanelEvents } from "./events.js";
import { selectMembershipReviewPanelVM } from "./selectors.js";
import { membershipReviewPanelTemplate } from "./template.js";

export const mountMembershipReviewPanelBlock = ({ root, store, actions }) => {
    let hasBoundEvents = false;

    return {
        render() {
            root.innerHTML = membershipReviewPanelTemplate(selectMembershipReviewPanelVM(store.getState()));
            if (!hasBoundEvents) {
                attachMembershipReviewPanelEvents({ root, actions });
                hasBoundEvents = true;
            }
        }
    };
};
