const FLASH_TOAST_KEY = "channel.flash-toast";
const isJsdomEnvironment = () => window.navigator.userAgent.toLowerCase().includes("jsdom");

export const getAppRoute = () => {
    const params = new URLSearchParams(window.location.search);

    return {
        view: params.get("view") || "directory",
        channelSlug: params.get("channel") || ""
    };
};

export const navigateToCreateChannel = () => {
    if (isJsdomEnvironment()) {
        window.history.pushState({}, "", "?view=create-channel");
        return;
    }
    window.location.assign("?view=create-channel");
};

export const navigateToChannel = (slug) => {
    if (isJsdomEnvironment()) {
        window.history.pushState({}, "", `?channel=${encodeURIComponent(slug)}`);
        return;
    }
    window.location.assign(`?channel=${encodeURIComponent(slug)}`);
};

export const navigateToDemo = () => {
    if (isJsdomEnvironment()) {
        window.history.pushState({}, "", "?view=demo");
        return;
    }
    window.location.assign("?view=demo");
};

export const queueFlashToast = (payload) => {
    window.sessionStorage.setItem(FLASH_TOAST_KEY, JSON.stringify(payload));
};

export const consumeFlashToast = () => {
    const rawValue = window.sessionStorage.getItem(FLASH_TOAST_KEY);
    if (!rawValue) {
        return null;
    }

    window.sessionStorage.removeItem(FLASH_TOAST_KEY);

    try {
        return JSON.parse(rawValue);
    } catch {
        return null;
    }
};
