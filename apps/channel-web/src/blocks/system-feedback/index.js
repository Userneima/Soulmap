import "./styles.css";
import { attachSystemFeedbackEvents } from "./events.js";
import { selectSystemFeedbackVM } from "./selectors.js";
import { systemFeedbackTemplate } from "./template.js";

export const mountSystemFeedbackBlock = ({ root, store, actions }) => {
    attachSystemFeedbackEvents({ root, actions });

    return {
        render() {
            root.innerHTML = systemFeedbackTemplate(selectSystemFeedbackVM(store.getState()));
        }
    };
};
