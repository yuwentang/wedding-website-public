import { createServer } from "node:http";
import { readFile, realpath } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = await realpath(fileURLToPath(new URL("../", import.meta.url)));
const port = Number(process.env.WEDDING_PREVIEW_PORT || 4173);
const base = process.argv[2] || "/";

if (!/^\/(?:[a-zA-Z0-9._-]+\/)?$/.test(base)) {
  throw new Error("Use a base path such as /wedding-website/.");
}

const pages = new Set(["index.html", "css/style.css", "js/app.js", "data/site.json", "data/program.json"]);
const imageTypes = {
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp"
};
const contentTypes = {
  ...imageTypes,
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

const server = createServer(async (request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" }).end();
    return;
  }
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, "http://127.0.0.1").pathname);
  } catch {
    response.writeHead(400).end();
    return;
  }
  if (!pathname.startsWith(base)) {
    response.writeHead(404).end();
    return;
  }

  const relative = pathname.slice(base.length) || "index.html";
  const extension = extname(relative).toLowerCase();
  const publicImage = relative.startsWith("images/") && Object.hasOwn(imageTypes, extension);
  if (!pages.has(relative) && !publicImage) {
    response.writeHead(404).end();
    return;
  }

  try {
    if (relative.includes("\\") || relative.split("/").some(part => part === "." || part === "..")) {
      response.writeHead(404).end();
      return;
    }
    const file = await realpath(resolve(root, relative));
    const directory = publicImage ? resolve(root, "images") : root;
    if (!file.startsWith(directory + sep)) {
      response.writeHead(404).end();
      return;
    }
    const bytes = await readFile(file);
    response.writeHead(200, {
      "Content-Type": contentTypes[extension],
      "Cache-Control": "no-cache",
      "Content-Length": bytes.length
    });
    response.end(request.method === "HEAD" ? undefined : bytes);
  } catch (error) {
    if (error.code !== "ENOENT" && error.code !== "ENOTDIR") console.error(error);
    response.writeHead(404).end();
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Local: http://127.0.0.1:${server.address().port}${base}`);
});
