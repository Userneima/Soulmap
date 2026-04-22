import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
    root: "apps/channel-web",
    envDir: path.resolve(process.cwd()),
    test: {
        exclude: [
            "**/node_modules/**",
            "**/dist/**",
            "**/.{idea,git,cache,output,temp}/**",
            "**/e2e/**"
        ]
    }
});
