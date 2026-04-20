const readWindowRuntimeConfig = () => {
    if (typeof window === "undefined") {
        return {};
    }

    return window.channelRuntimeConfig || {};
};

const readEnvValue = (key) => {
    const value = import.meta.env[key];
    return typeof value === "string" ? value.trim() : "";
};

const envRuntimeConfig = {
    channelSlug: readEnvValue("VITE_CHANNEL_SLUG"),
    channelName: readEnvValue("VITE_CHANNEL_NAME"),
    supabaseUrl: readEnvValue("VITE_SUPABASE_URL"),
    supabasePublishableKey: readEnvValue("VITE_SUPABASE_PUBLISHABLE_KEY")
};

const windowRuntimeConfig = readWindowRuntimeConfig();

export const runtimeConfig = {
    channelSlug: envRuntimeConfig.channelSlug || windowRuntimeConfig.channelSlug || "",
    channelName: envRuntimeConfig.channelName || windowRuntimeConfig.channelName || "",
    supabaseUrl: envRuntimeConfig.supabaseUrl || windowRuntimeConfig.supabaseUrl || "",
    supabasePublishableKey: envRuntimeConfig.supabasePublishableKey || windowRuntimeConfig.supabasePublishableKey || ""
};
