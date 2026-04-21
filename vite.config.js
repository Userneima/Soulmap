import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
    root: "apps/channel-web",
    envDir: path.resolve(process.cwd())
});
