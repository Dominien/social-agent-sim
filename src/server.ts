import "dotenv/config";
import { createServer } from "http";
import { readFileSync, readdirSync, existsSync } from "fs";
import { join, extname } from "path";

const DATA_DIR = join(process.cwd(), "data");
const PUBLIC_DIR = join(process.cwd(), "public");
const PORT = 3333;

const MIME: Record<string, string> = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".md": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
};

function cors(headers: Record<string, string>) {
  headers["Access-Control-Allow-Origin"] = "*";
  headers["Access-Control-Allow-Methods"] = "GET";
}

const server = createServer((req, res) => {
  const url = new URL(req.url || "/", `http://localhost:${PORT}`);
  const path = url.pathname;
  const headers: Record<string, string> = {};
  cors(headers);

  try {
    // ─── API routes ──────────────────────────────
    if (path === "/api/state") {
      const data = readFileSync(join(DATA_DIR, "world_state.json"), "utf-8");
      headers["Content-Type"] = "application/json";
      res.writeHead(200, headers);
      res.end(data);
      return;
    }

    if (path === "/api/objects") {
      const data = readFileSync(join(DATA_DIR, "world_state.json"), "utf-8");
      const state = JSON.parse(data);
      headers["Content-Type"] = "application/json";
      res.writeHead(200, headers);
      res.end(JSON.stringify(state.objects || []));
      return;
    }

    if (path === "/api/memories") {
      const memDir = join(DATA_DIR, "memory");
      const memories: Record<string, string> = {};
      for (const file of readdirSync(memDir)) {
        if (file.endsWith(".md")) {
          const name = file.replace(".md", "");
          memories[name] = readFileSync(join(memDir, file), "utf-8");
        }
      }
      headers["Content-Type"] = "application/json";
      res.writeHead(200, headers);
      res.end(JSON.stringify(memories));
      return;
    }

    if (path === "/api/profiles") {
      const profDir = join(DATA_DIR, "profiles");
      const profiles: Record<string, string> = {};
      for (const file of readdirSync(profDir)) {
        if (file.endsWith(".md")) {
          const name = file.replace(".md", "");
          profiles[name] = readFileSync(join(profDir, file), "utf-8");
        }
      }
      headers["Content-Type"] = "application/json";
      res.writeHead(200, headers);
      res.end(JSON.stringify(profiles));
      return;
    }

    if (path === "/api/ticks") {
      const logsDir = join(DATA_DIR, "logs");
      if (!existsSync(logsDir)) {
        headers["Content-Type"] = "application/json";
        res.writeHead(200, headers);
        res.end("[]");
        return;
      }
      const files = readdirSync(logsDir)
        .filter(f => f.endsWith(".json"))
        .sort();
      headers["Content-Type"] = "application/json";
      res.writeHead(200, headers);
      res.end(JSON.stringify(files.map(f => f.replace(".json", ""))));
      return;
    }

    if (path.startsWith("/api/tick/")) {
      const tickId = path.replace("/api/tick/", "");
      const filePath = join(DATA_DIR, "logs", `${tickId}.json`);
      if (!existsSync(filePath)) {
        res.writeHead(404, headers);
        res.end("Not found");
        return;
      }
      const data = readFileSync(filePath, "utf-8");
      headers["Content-Type"] = "application/json";
      res.writeHead(200, headers);
      res.end(data);
      return;
    }

    // ─── Static files ────────────────────────────
    const filePath = join(PUBLIC_DIR, path === "/" ? "index.html" : path);
    if (!existsSync(filePath)) {
      res.writeHead(404, headers);
      res.end("Not found");
      return;
    }

    const ext = extname(filePath);
    headers["Content-Type"] = MIME[ext] || "application/octet-stream";
    res.writeHead(200, headers);
    res.end(readFileSync(filePath));
  } catch (err) {
    console.error("Server error:", err);
    res.writeHead(500, headers);
    res.end("Internal server error");
  }
});

server.listen(PORT, () => {
  console.log(`\n  Hauswelt Viewer: http://localhost:${PORT}\n`);
});
