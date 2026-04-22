const { defineConfig, devices } = require("@playwright/test");

const port = Number(process.env.E2E_PORT || 4173);
const baseURL = process.env.E2E_BASE_URL || `http://127.0.0.1:${port}`;

module.exports = defineConfig({
    testDir: "./apps/channel-web/e2e",
    timeout: 60_000,
    expect: {
        timeout: 10_000
    },
    fullyParallel: false,
    forbidOnly: Boolean(process.env.CI),
    retries: process.env.CI ? 2 : 0,
    reporter: process.env.CI ? [["html"], ["list"]] : [["list"]],
    use: {
        baseURL,
        headless: true,
        trace: "retain-on-failure",
        screenshot: "only-on-failure",
        video: "retain-on-failure"
    },
    projects: [
        {
            name: "chromium",
            use: {
                ...devices["Desktop Chrome"]
            }
        }
    ],
    webServer: {
        command: `npm run build:web && npx vite preview --host 127.0.0.1 --port ${port}`,
        url: `${baseURL}/`,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000
    }
});
