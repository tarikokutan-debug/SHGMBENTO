import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Set payload limits for large databases
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API Route - Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // CORS bypass API for Google Sheets GET requests (Reading)
  app.get("/api/google-pull", async (req, res) => {
    try {
      const targetUrl = req.query.url as string;
      if (!targetUrl) {
        return res.status(400).json({ error: "Missing url parameter" });
      }

      console.log(`[Proxy] Pulling from: ${targetUrl}`);

      const response = await fetch(targetUrl, {
        method: "GET",
        redirect: "follow",
      });

      if (!response.ok) {
        return res.status(response.status).json({ 
          error: `Google Sheets API returned an error: ${response.status} ${response.statusText}` 
        });
      }

      const text = await response.text();
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      return res.send(text);
    } catch (err: any) {
      console.error("[Proxy Error] Pull failed:", err);
      return res.status(500).json({ error: err.message || "Uzak sunucuya bağlanırken bir hata oluştu." });
    }
  });

  // CORS bypass API for Google Sheets POST requests (Writing / Saving)
  app.post("/api/google-push", async (req, res) => {
    try {
      const { url, data } = req.body;
      if (!url) {
        return res.status(400).json({ error: "Missing url parameter" });
      }

      console.log(`[Proxy] Pushing payload with ${Array.isArray(data) ? data.length : 0} items to: ${url}`);

      // Google Apps Script requires a simple Content-Type like text/plain to easily digest payload
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain",
        },
        body: typeof data === "string" ? data : JSON.stringify(data),
        redirect: "follow",
      });

      if (!response.ok) {
        return res.status(response.status).json({ 
          error: `Google Apps Script returned an error: ${response.status} ${response.statusText}` 
        });
      }

      const text = await response.text();
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      return res.send(text);
    } catch (err: any) {
      console.error("[Proxy Error] Push failed:", err);
      return res.status(500).json({ error: err.message || "Uzak sunucuya yazma işlemi sırasında bir hata oluştu." });
    }
  });

  // Vite integration middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log(`[System] Vite middleware loaded in development mode.`);
  } else {
    // Serve static files in production
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log(`[System] Static file serving loaded in production mode.`);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Web application running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("[Server] Bootstrapping failed:", err);
});
