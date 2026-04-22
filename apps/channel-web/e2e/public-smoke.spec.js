const { test, expect } = require("@playwright/test");
const { waitForChannelSurface } = require("./helpers.js");

test("public directory can enter a channel and open core read-only overlays", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "选择一个频道" })).toBeVisible();
    const firstChannelCard = page.locator(".channel-directory__card").first();
    await expect(firstChannelCard).toBeVisible();

    const selectedChannelName = (await firstChannelCard.locator("h2").textContent())?.trim() || "";
    await firstChannelCard.click();
    await waitForChannelSurface(page);

    if (selectedChannelName) {
        await expect(page.locator(".channel-hero__title")).toContainText(selectedChannelName);
    } else {
        await expect(page.locator(".channel-hero__title")).toBeVisible();
    }

    await page.locator("[data-channel-hero-action='members']").click();
    await expect(page.getByRole("dialog", { name: "频道成员" })).toBeVisible();
    await page.getByRole("button", { name: "关闭成员名单" }).click();
    await expect(page.getByRole("dialog", { name: "频道成员" })).toBeHidden();

    await page.locator("[data-channel-hero-action='notifications']").click();
    await expect(page.locator(".notification-center.is-open")).toBeVisible();
    await page.locator(".notification-center__backdrop").click();
    await expect(page.locator(".notification-center.is-open")).not.toBeVisible();

    await page.locator("[data-channel-hero-action='menu']").click();
    await expect(page.locator(".channel-menu-dialog.is-open")).toBeVisible();
    await expect(page.locator(".channel-menu-dialog__row-label")).toContainText(["本频道昵称和头像", "消息通知"]);
    await page.locator(".channel-menu-dialog__backdrop").click();
    await expect(page.locator(".channel-menu-dialog.is-open")).not.toBeVisible();

    const guessPicker = page.locator(".guess-picker");
    if (await guessPicker.count()) {
        const firstCandidate = page.locator(".guess-picker__card").first();
        await expect(firstCandidate).toBeVisible();
        await firstCandidate.click();
        await expect(firstCandidate).toHaveClass(/is-selected/);
        return;
    }

    const firstFeedCard = page.locator(".feed-card").first();
    await expect(firstFeedCard).toBeVisible();
    await firstFeedCard.locator("[data-feed-action='open-comments']").click();
    await expect(page.getByRole("dialog", { name: "帖子详情" })).toBeVisible();
    await expect(page.locator(".comment-drawer__composer")).toBeVisible();
    await page.locator("[data-comments-action='close']").last().click();
    await expect(page.getByRole("dialog", { name: "帖子详情" })).toBeHidden();
});
