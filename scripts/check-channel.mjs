import { execFileSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const appRoot = path.resolve(process.cwd(), "apps/channel-web");

const collectJavaScriptFiles = (dir) => {
    return readdirSync(dir)
        .flatMap((entry) => {
            const fullPath = path.join(dir, entry);
            const stats = statSync(fullPath);
            if (stats.isDirectory()) {
                return collectJavaScriptFiles(fullPath);
            }
            return fullPath.endsWith(".js") ? [fullPath] : [];
        });
};

const files = collectJavaScriptFiles(path.join(appRoot, "src"));
files.forEach((file) => {
    execFileSync(process.execPath, ["--check", file], { stdio: "inherit" });
});

process.stdout.write(`Checked ${files.length} JavaScript files under ${appRoot}\n`);
