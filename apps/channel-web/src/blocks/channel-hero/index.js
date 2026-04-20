import "./styles.css";
import { attachChannelHeroEvents } from "./events.js";
import { selectChannelHeroVM } from "./selectors.js";
import { channelHeroTemplate } from "./template.js";

export const mountChannelHeroBlock = ({ root, store, actions }) => {
    attachChannelHeroEvents({ root, actions });

    return {
        render() {
            root.innerHTML = channelHeroTemplate(selectChannelHeroVM(store.getState()));
        }
    };
};
