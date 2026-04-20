import "./styles.css";
import { attachBoardTabsEvents } from "./events.js";
import { selectBoardTabsVM } from "./selectors.js";
import { boardTabsTemplate } from "./template.js";

export const mountBoardTabsBlock = ({ root, store, actions }) => {
    attachBoardTabsEvents({ root, actions });

    return {
        render() {
            root.innerHTML = boardTabsTemplate(selectBoardTabsVM(store.getState()));
        }
    };
};
