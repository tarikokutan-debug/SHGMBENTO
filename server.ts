import express from "express";
import path from "path";
import fs from "fs";
import os from "os";
import { createServer as createViteServer } from "vite";

// Default shared data path on server/disk
let serverConfiguredSharedPath = process.env.SHARED_DATA_PATH || path.join(process.cwd(), "shared_data", "shgmdata.json");

function resolveSharedPath(customPath?: string): string {
  if (customPath && typeof customPath === "string" && customPath.trim().length > 0) {
    const trimmed = customPath.trim();
    if (process.platform !== "win32") {
      if (trimmed.startsWith("\\\\") || /^[a-zA-Z]:[\\/]/.test(trimmed)) {
        return path.join(process.cwd(), "shared_data", "shgmdata.json");
      }
    }
    return path.isAbsolute(trimmed) ? trimmed : path.join(process.cwd(), trimmed);
  }
  return serverConfiguredSharedPath;
}

function ensureDirectoryExistence(filePath: string) {
  try {
    const dirname = path.dirname(filePath);
    if (!fs.existsSync(dirname)) {
      fs.mkdirSync(dirname, { recursive: true });
    }
  } catch (err) {
    console.warn("[FileSync] Directory check/creation warning:", err);
  }
}

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

  // --- LOCAL & SERVER SHARED FILE SYNC ENDPOINTS ---

  // Check file status (lightweight mtime check for 15s polling)
  app.get("/api/file-sync/status", (req, res) => {
    try {
      const targetPath = resolveSharedPath(req.query.filePath as string);
      if (!fs.existsSync(targetPath)) {
        return res.json({
          exists: false,
          lastModified: 0,
          size: 0,
          filePath: targetPath
        });
      }
      const stats = fs.statSync(targetPath);
      return res.json({
        exists: true,
        lastModified: Math.floor(stats.mtimeMs),
        size: stats.size,
        filePath: targetPath
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || "Dosya durumu kontrol edilemedi." });
    }
  });

  // Read dataset from shared local/server file
  app.get("/api/file-sync/read", async (req, res) => {
    try {
      const targetPath = resolveSharedPath(req.query.filePath as string);
      const exists = await fs.promises.access(targetPath).then(() => true).catch(() => false);
      if (!exists) {
        return res.json({
          exists: false,
          data: null,
          lastModified: 0,
          filePath: targetPath,
          message: "Henüz ortak veri dosyası oluşturulmadı."
        });
      }
      const stats = await fs.promises.stat(targetPath);
      const fileContent = await fs.promises.readFile(targetPath, "utf-8");
      const cleaned = fileContent.trim().replace(/^\uFEFF/, "");
      let parsed = null;
      try {
        parsed = JSON.parse(cleaned);
      } catch (pErr) {
        return res.status(400).json({ error: "Ortak dosya geçerli bir JSON formatında değil." });
      }
      return res.json({
        exists: true,
        success: true,
        data: parsed,
        lastModified: Math.floor(stats.mtimeMs),
        filePath: targetPath
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || "Ortak dosyadan okuma yapılırken hata oluştu." });
    }
  });

  // Write dataset to shared local/server file
  app.post("/api/file-sync/write", async (req, res) => {
    try {
      const { flights, stationEmails, appFees, filePath, clientTimestamp } = req.body;
      const targetPath = resolveSharedPath(filePath);

      ensureDirectoryExistence(targetPath);

      const incomingFlights = Array.isArray(flights) ? flights : [];

      // Safety guard against overwriting existing non-empty database with empty list
      const exists = await fs.promises.access(targetPath).then(() => true).catch(() => false);
      if (exists) {
        try {
          const existingRaw = (await fs.promises.readFile(targetPath, "utf-8")).trim().replace(/^\uFEFF/, "");
          if (existingRaw.length > 50) {
            const existingParsed = JSON.parse(existingRaw);
            const existingFlights = Array.isArray(existingParsed)
              ? existingParsed
              : (existingParsed?.flights || []);

            if (existingFlights.length > 0 && incomingFlights.length === 0) {
              console.warn(`[FileSync Guard] Overwrite blocked for ${targetPath}: Existing file has ${existingFlights.length} flights, incoming request was empty.`);
              return res.status(400).json({ error: "Güvenlik Engeli: Sunucudaki mevcut uçuş verileri boş bir liste ile ezilemez." });
            }
          }
          // Create backup before writing
          await fs.promises.copyFile(targetPath, targetPath + ".bak");
        } catch (guardErr) {
          console.warn("[FileSync Guard Warning]", guardErr);
        }
      }

      const payload = {
        version: "5.6.2",
        lastUpdated: clientTimestamp || Date.now(),
        updatedBy: req.ip || "Client",
        flights: incomingFlights,
        stationEmails: stationEmails || {},
        appFees: appFees || {}
      };

      const jsonStr = JSON.stringify(payload, null, 2);
      const tmpPath = targetPath + ".tmp";
      await fs.promises.writeFile(tmpPath, jsonStr, "utf-8");
      await fs.promises.rename(tmpPath, targetPath);

      const stats = await fs.promises.stat(targetPath);
      console.log(`[FileSync] Shared data updated successfully at: ${targetPath} (${payload.flights.length} flights)`);

      return res.json({
        success: true,
        lastModified: Math.floor(stats.mtimeMs),
        flightCount: payload.flights.length,
        filePath: targetPath
      });
    } catch (err: any) {
      console.error("[FileSync Error] Write failed:", err);
      return res.status(500).json({ error: err.message || "Ortak dosyaya yazılırken hata oluştu." });
    }
  });

  // Get or update server default shared path configuration
  app.get("/api/file-sync/config", (req, res) => {
    res.json({
      configuredPath: serverConfiguredSharedPath,
      defaultPath: path.join(process.cwd(), "shared_data", "shgm_database.json")
    });
  });

  // Get System User & OS Computer Owner Info automatically
  app.get("/api/system/user-info", (req, res) => {
    try {
      let rawUser = "";
      try {
        const uInfo = os.userInfo();
        rawUser = uInfo?.username || "";
      } catch {}

      if (!rawUser) {
        rawUser = process.env.USERNAME || process.env.USER || process.env.LOGNAME || "Operator";
      }

      const hostname = os.hostname ? os.hostname() : "PC";

      let formattedName = rawUser;
      if (rawUser.includes(".")) {
        formattedName = rawUser
          .split(".")
          .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
          .join(" ");
      } else if (rawUser.length > 2 && !rawUser.startsWith("user")) {
        formattedName = rawUser.charAt(0).toUpperCase() + rawUser.slice(1);
      }

      return res.json({
        success: true,
        username: rawUser,
        displayName: formattedName,
        hostname: hostname,
        platform: os.platform(),
      });
    } catch (err: any) {
      return res.json({
        success: false,
        username: "Operator",
        displayName: "Bilgisayar Sahibi",
        hostname: "PC",
        platform: "unknown"
      });
    }
  });

  // --- MULTI-USER COLLABORATION & AUDIT LOG API ---

  // Heartbeat endpoint to track active users
  app.post("/api/presence/heartbeat", async (req, res) => {
    try {
      const { user, clientAppPath } = req.body;
      if (!user || !user.id) return res.status(400).json({ error: "User info required" });

      const basePath = resolveSharedPath(clientAppPath);
      const activeUsersFile = path.join(path.dirname(basePath), "shgm_active_users.json");

      let activeUsersMap: Record<string, any> = {};
      const exists = await fs.promises.access(activeUsersFile).then(() => true).catch(() => false);
      if (exists) {
        try {
          const raw = await fs.promises.readFile(activeUsersFile, "utf-8");
          activeUsersMap = JSON.parse(raw) || {};
        } catch { activeUsersMap = {}; }
      }

      const now = Date.now();
      activeUsersMap[user.id] = {
        id: user.id,
        name: user.name || "Bilinmeyen Kullanıcı",
        role: user.role || "Operatör",
        hostname: user.hostname || "Web / PC",
        ip: req.ip || req.socket.remoteAddress || "127.0.0.1",
        lastSeen: now,
        currentView: user.currentView || "OPERATIONS"
      };

      // Clean up users inactive for > 2 minutes (120,000 ms)
      Object.keys(activeUsersMap).forEach(uid => {
        if (now - activeUsersMap[uid].lastSeen > 120000) {
          delete activeUsersMap[uid];
        }
      });

      const tmpFile = activeUsersFile + ".tmp";
      await fs.promises.writeFile(tmpFile, JSON.stringify(activeUsersMap, null, 2), "utf-8");
      await fs.promises.rename(tmpFile, activeUsersFile);

      return res.json({ success: true, activeUsers: Object.values(activeUsersMap) });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Get active users list
  app.get("/api/presence/active-users", async (req, res) => {
    try {
      const basePath = resolveSharedPath(req.query.filePath as string);
      const activeUsersFile = path.join(path.dirname(basePath), "shgm_active_users.json");
      const exists = await fs.promises.access(activeUsersFile).then(() => true).catch(() => false);
      if (!exists) return res.json({ activeUsers: [] });

      const raw = await fs.promises.readFile(activeUsersFile, "utf-8");
      const activeUsersMap = JSON.parse(raw) || {};
      const now = Date.now();

      const activeList = Object.values(activeUsersMap).filter(
        (u: any) => now - u.lastSeen < 120000
      );

      return res.json({ activeUsers: activeList });
    } catch (err: any) {
      return res.json({ activeUsers: [] });
    }
  });

  // Append or fetch Audit Activity Logs
  app.get("/api/audit/logs", async (req, res) => {
    try {
      const basePath = resolveSharedPath(req.query.filePath as string);
      const auditFile = path.join(path.dirname(basePath), "shgm_activity_logs.json");
      const exists = await fs.promises.access(auditFile).then(() => true).catch(() => false);
      if (!exists) return res.json({ logs: [] });

      const raw = await fs.promises.readFile(auditFile, "utf-8");
      const logs = JSON.parse(raw) || [];
      return res.json({ logs: logs.slice(-200).reverse() }); // Return last 200 logs
    } catch (err: any) {
      return res.json({ logs: [] });
    }
  });

  app.post("/api/audit/add", async (req, res) => {
    try {
      const { user, action, details, flightRef, filePath } = req.body;
      const basePath = resolveSharedPath(filePath);
      const auditFile = path.join(path.dirname(basePath), "shgm_activity_logs.json");

      let logs: any[] = [];
      const exists = await fs.promises.access(auditFile).then(() => true).catch(() => false);
      if (exists) {
        try {
          const raw = await fs.promises.readFile(auditFile, "utf-8");
          logs = JSON.parse(raw) || [];
        } catch { logs = []; }
      }

      const newLog = {
        id: "log_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
        timestamp: new Date().toISOString(),
        userName: user?.name || "Bilinmeyen Kullanıcı",
        userId: user?.id || "anon",
        action: action, // e.g. "FLIGHT_ADD", "AFTN_ENTERED", "STATUS_CHANGE", "FLIGHT_DELETE"
        details: details || "",
        flightRef: flightRef || "",
        hostname: user?.hostname || "PC"
      };

      logs.push(newLog);
      if (logs.length > 5000) logs = logs.slice(-5000); // keep max 5000 logs

      const tmpFile = auditFile + ".tmp";
      await fs.promises.writeFile(tmpFile, JSON.stringify(logs, null, 2), "utf-8");
      await fs.promises.rename(tmpFile, auditFile);

      return res.json({ success: true, log: newLog });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/file-sync/config", (req, res) => {
    const { customPath } = req.body;
    if (customPath && typeof customPath === "string") {
      serverConfiguredSharedPath = customPath.trim();
      return res.json({ success: true, configuredPath: serverConfiguredSharedPath });
    }
    return res.status(400).json({ error: "Geçersiz dosya yolu" });
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
        let errorMessage = `Google Sheets API hata döndürdü: ${response.status} ${response.statusText}`;
        if (response.status === 404) {
          errorMessage = "Girilen URL adresi veya Google Sheets kaynağı bulunamadı (404 Hatası). Lütfen girdiğiniz Google Sheets URL'sini kontrol edin.";
        }
        return res.status(response.status).json({ 
          error: errorMessage 
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
        let errorMessage = `Google Apps Script hata döndürdü: ${response.status} ${response.statusText}`;
        if (response.status === 404) {
          errorMessage = "Google Apps Script Web Uygulaması bulunamadı (404 Hatası).\nHATA SEBEPLERİ:\n1. Girdiğiniz her iki adresten birinde yazım veya kopyalama hatası olabilir.\n2. Google Apps Script projesinde 'Dağıt' > 'Yeni Dağıtım' adımlarını izleyip türü 'Web Uygulaması' olarak belirlememiş ya da URL'yi yanlış kopyalamış olabilirsiniz.\n3. Apps Script kodunda hata veya yetkilendirme eksiği olabilir.";
        }
        return res.status(response.status).json({ 
          error: errorMessage 
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
    const candidateDistPaths = [
      __dirname, // inside bundled dist/server.cjs, __dirname is already the dist folder
      path.join(__dirname, "dist"),
      path.join(process.cwd(), "dist")
    ];
    const distPath = candidateDistPaths.find((p) => fs.existsSync(path.join(p, "index.html"))) || path.join(process.cwd(), "dist");
    
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log(`[System] Static file serving loaded from: ${distPath}`);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Web application running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("[Server] Bootstrapping failed:", err);
});
