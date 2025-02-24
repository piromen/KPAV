import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { readdir } from "fs/promises";
import { join, resolve } from "path";

async function* walkDirectory(dir: string): AsyncGenerator<string> {
  const dirents = await readdir(dir, { withFileTypes: true });
  for (const dirent of dirents) {
    const res = resolve(dir, dirent.name);
    if (dirent.isDirectory()) {
      yield* walkDirectory(res);
    } else {
      yield res;
    }
  }
}

// Önceden belirlenmiş önemli sistem klasörleri
const QUICK_SCAN_PATHS = [
  "/usr/bin",
  "/usr/local/bin",
  "/home",
  "/tmp",
  "/var/tmp"
];

export async function registerRoutes(app: Express) {
  // Get system status
  app.get("/api/status", async (req, res) => {
    const status = await storage.getSystemStatus();
    res.json(status);
  });

  // Update system settings
  app.post("/api/settings", async (req, res) => {
    const { realtimeProtection, webProtection, downloadScanning } = req.body;
    const status = await storage.updateSystemStatus({
      realtimeProtection,
      webProtection,
      downloadScanning
    });
    res.json(status);
  });

  // Web protection endpoints
  app.post("/api/check-url", async (req, res) => {
    const { url } = req.body;
    try {
      const result = await storage.scanUrl(url);

      await storage.addNetworkEvent({
        processName: "web_browser",
        remoteAddress: new URL(url).hostname,
        remotePort: 80,
        protocol: new URL(url).protocol.slice(0, -1),
        action: result.isMalicious ? "blocked" : "allowed",
        reason: result.category || "safe",
      });

      res.json(result);
    } catch (error) {
      res.status(400).json({ error: "Invalid URL or scanning failed" });
    }
  });

  // Network monitoring
  app.get("/api/network-events", async (req, res) => {
    const events = await storage.getNetworkEvents();
    res.json(events);
  });

  // Hızlı Sistem Taraması - Önceden belirlenmiş klasörleri tarar
  app.post("/api/quick-scan", async (req, res) => {
    const results = [];
    const errors = [];

    for (const basePath of QUICK_SCAN_PATHS) {
      try {
        for await (const filePath of walkDirectory(basePath)) {
          try {
            const result = await storage.scanFile(filePath);
            results.push(result);
          } catch (error) {
            errors.push({ path: filePath, error: error.message });
          }
        }
      } catch (error) {
        errors.push({ path: basePath, error: "Directory access denied" });
      }
    }

    await storage.updateSystemStatus({
      lastQuickScan: new Date()
    });

    res.json({ results, errors });
  });

  // Özel Tarama - Seçilen dosyaları tarar
  app.post("/api/custom-scan", async (req, res) => {
    const { paths } = req.body;
    const results = [];
    const errors = [];

    for (const path of paths) {
      try {
        const result = await storage.scanFile(path);
        results.push(result);
      } catch (error) {
        errors.push({ path, error: error.message });
      }
    }

    res.json({ results, errors });
  });

  // Tam Sistem Taraması
  app.post("/api/full-scan", async (req, res) => {
    const results = [];
    const errors = [];
    const startTime = Date.now();

    try {
      for await (const filePath of walkDirectory("/")) {
        try {
          const result = await storage.scanFile(filePath);
          results.push(result);
        } catch (error) {
          errors.push({ path: filePath, error: error.message });
        }
      }

      await storage.updateSystemStatus({
        lastFullScan: new Date()
      });

      const duration = Date.now() - startTime;
      res.json({
        results,
        errors,
        duration,
        filesScanned: results.length + errors.length
      });
    } catch (error) {
      res.status(500).json({
        error: "Failed to complete full system scan",
        message: error.message
      });
    }
  });

  // Get scan history
  app.get("/api/scan-history", async (req, res) => {
    const results = await storage.getScanResults();
    res.json(results);
  });

  // Update virus definitions
  app.post("/api/update-signatures", async (req, res) => {
    try {
      await storage.updateSignatures();
      res.json({ success: true, message: "Signatures updated successfully" });
    } catch (error) {
      res.status(500).json({
        error: "Failed to update signatures",
        message: error.message
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}