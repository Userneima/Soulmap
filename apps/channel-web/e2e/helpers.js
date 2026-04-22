const authChannelSlug = String(process.env.E2E_AUTH_CHANNEL_SLUG || process.env.E2E_CHANNEL_SLUG || "").trim();

const getRequiredEnv = (name) => String(process.env[name] || "").trim();

const hasMemberCredentials = () => Boolean(
    getRequiredEnv("E2E_MEMBER_EMAIL")
    && getRequiredEnv("E2E_MEMBER_PASSWORD")
    && authChannelSlug
);

const hasOwnerCredentials = () => Boolean(
    getRequiredEnv("E2E_OWNER_EMAIL")
    && getRequiredEnv("E2E_OWNER_PASSWORD")
    && authChannelSlug
);

const waitForChannelSurface = async (page) => {
    await page.waitForLoadState("networkidle");
    await page.locator(".channel-hero__title").waitFor();
    await page.locator(".composer-panel, .feed-list__stack, .feed-list__state, .guess-picker").first().waitFor();
};

const loginFromCreateChannel = async (page, email, password) => {
    await page.goto("/?view=create-channel");
    await page.locator(".auth-gate.is-open").waitFor();
    await page.getByLabel("邮箱").fill(email);
    await page.getByLabel("密码").fill(password);
    await page.getByRole("button", { name: "登录" }).click();
    await page.locator(".channel-create__form").waitFor();
    await page.waitForLoadState("networkidle");
};

module.exports = {
    authChannelSlug,
    getRequiredEnv,
    hasMemberCredentials,
    hasOwnerCredentials,
    waitForChannelSurface,
    loginFromCreateChannel
};
