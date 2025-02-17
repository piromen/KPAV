import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertScanResultSchema, mockThreats } from "@shared/schema";

export async function registerRoutes(app: Express) {
  app.get("/api/status", async (req, res) => {
    const status = await storage.getSystemStatus();
    res.json(status);
  });

  app.post("/api/scan", async (req, res) => {
    const files = req.body.files as string[];
    
    // Simulate scanning with random results
    const results = await Promise.all(
      files.map(async (path) => {
        const isThreat = Math.random() < 0.2;
        const result = {
          path,
          status: isThreat ? "infected" : "clean",
          details: isThreat ? mockThreats[Math.floor(Math.random() * mockThreats.length)] : null
        };
        return await storage.addScanResult(result);
      })
    );

    const threatsFound = results.filter(r => r.status === "infected").length;
    await storage.updateSystemStatus({
      lastScan: new Date(),
      threatsFound: threatsFound
    });

    res.json(results);
  });

  app.get("/api/scan-history", async (req, res) => {
    const results = await storage.getScanResults();
    res.json(results);
  });

  const httpServer = createServer(app);
  return httpServer;
}
