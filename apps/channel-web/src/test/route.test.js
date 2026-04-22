import { afterEach, describe, expect, it } from "vitest";
import { getAppRoute, navigateToDemo } from "../shared/lib/route.js";

describe("route helpers", () => {
    afterEach(() => {
        window.history.pushState({}, "", "/");
    });

    it("reads demo view from the query string", () => {
        window.history.pushState({}, "", "/?view=demo");

        expect(getAppRoute()).toEqual({
            view: "demo",
            channelSlug: ""
        });
    });

    it("navigates into the demo route in jsdom", () => {
        navigateToDemo();

        expect(window.location.search).toBe("?view=demo");
    });
});
