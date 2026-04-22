const { test, expect } = require("@playwright/test");
const {
    authChannelSlug,
    getRequiredEnv,
    hasMemberCredentials,
    hasOwnerCredentials,
    loginFromCreateChannel,
    waitForChannelSurface
} = require("./helpers.js");

test.describe("authenticated smoke", () => {
    test("member can log in and reopen the channel without auth gate", async ({ page }) => {
        test.skip(!hasMemberCredentials(), "E2E member credentials are not configured.");

        await loginFromCreateChannel(
            page,
            getRequiredEnv("E2E_MEMBER_EMAIL"),
            getRequiredEnv("E2E_MEMBER_PASSWORD")
        );

        await expect(page.locator(".auth-gate.is-open")).toHaveCount(0);
        await expect(page.locator(".channel-create__hint")).toContainText("当前登录");

        await page.goto(`/?channel=${encodeURIComponent(authChannelSlug)}`);
        await waitForChannelSurface(page);

        await expect(page.locator(".auth-gate.is-open")).toHaveCount(0);
        await page.locator("[data-channel-hero-action='menu']").click();
        await expect(page.locator(".channel-menu-dialog.is-open")).toBeVisible();
        await expect(page.locator(".channel-menu-dialog__row-label")).toContainText("本频道昵称和头像");
    });

    test("owner can open channel settings from the channel menu", async ({ page }) => {
        test.skip(!hasOwnerCredentials(), "E2E owner credentials are not configured.");

        await loginFromCreateChannel(
            page,
            getRequiredEnv("E2E_OWNER_EMAIL"),
            getRequiredEnv("E2E_OWNER_PASSWORD")
        );

        await page.goto(`/?channel=${encodeURIComponent(authChannelSlug)}`);
        await waitForChannelSurface(page);

        await page.locator("[data-channel-hero-action='menu']").click();
        await expect(page.locator(".channel-menu-dialog.is-open")).toBeVisible();
        await page.getByRole("button", { name: "编辑频道资料" }).click();
        await expect(page.locator(".channel-settings-dialog.is-open")).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(page.locator(".channel-settings-dialog.is-open")).not.toBeVisible();
    });
});
