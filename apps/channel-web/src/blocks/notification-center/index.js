import "./styles.css";
import { attachNotificationCenterEvents } from "./events.js";
import { selectNotificationCenterVM } from "./selectors.js";
import { notificationCenterTemplate } from "./template.js";

export const mountNotificationCenterBlock = ({ root, store, actions }) => {
    let hasBoundEvents = false;

    return {
        render() {
            const vm = selectNotificationCenterVM(store.getState());
            root.innerHTML = notificationCenterTemplate(vm);

            if (!hasBoundEvents) {
                attachNotificationCenterEvents({ root, actions });
                hasBoundEvents = true;
            }
        }
    };
};
