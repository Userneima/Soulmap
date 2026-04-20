import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const rootDir = path.resolve(process.cwd(), process.argv[2] || ".");
const port = Number(process.argv[3] || process.env.PORT || 43173);

const contentTypes = {
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".txt": "text/plain; charset=utf-8"
};

const resolveRequestPath = (requestUrl) => {
    const requestPath = decodeURIComponent(new URL(requestUrl, "http://localhost").pathname);
    const normalized = requestPath.endsWith("/") ? `${requestPath}index.html` : requestPath;
    return path.resolve(rootDir, `.${normalized}`);
};

const send = (response, statusCode, body, contentType = "text/plain; charset=utf-8") => {
    response.writeHead(statusCode, { "Content-Type": contentType });
    response.end(body);
};

const server = http.createServer(async (request, response) => {
    try {
        if ((request.url || "/") === "/__channel_health") {
            send(
                response,
                200,
                JSON.stringify({
                    app: "channel-web",
                    rootDir,
                    status: "ok"
                }),
                "application/json; charset=utf-8"
            );
            return;
        }

        const filePath = resolveRequestPath(request.url || "/");
        if (!filePath.startsWith(rootDir)) {
            send(response, 403, "Forbidden");
            return;
        }

        const fileStat = await stat(filePath);
        if (fileStat.isDirectory()) {
            send(response, 404, "Not Found");
            return;
        }

        const body = await readFile(filePath);
        const ext = path.extname(filePath);
        const contentType = contentTypes[ext] || "application/octet-stream";

        response.writeHead(200, {
            "Content-Length": body.length,
            "Content-Type": contentType
        });

        if (request.method === "HEAD") {
            response.end();
            return;
        }

        response.end(body);
    } catch (error) {
        send(response, 404, "Not Found");
    }
});

server.listen(port, () => {
    process.stdout.write(`Serving ${rootDir} at http://localhost:${port}\n`);
});
