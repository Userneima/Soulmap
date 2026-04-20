import "./styles.css";
import { attachFeedListEvents } from "./events.js";
import { selectFeedListVM } from "./selectors.js";
import { feedListTemplate } from "./template.js";

export const mountFeedListBlock = ({ root, store, actions }) => {
    attachFeedListEvents({ root, store, actions });

    return {
        render() {
            root.innerHTML = feedListTemplate(selectFeedListVM(store.getState()));
        }
    };
};
