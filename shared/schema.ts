import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const scanResults = pgTable("scan_results", {
  id: serial("id").primaryKey(),
  filePath: text("file_path").notNull(),
  fileHash: text("file_hash").notNull(),
  fileSize: integer("file_size").notNull(),
  status: text("status").notNull(), // clean, infected, suspicious
  threatType: text("threat_type"), // virus, malware, trojan, etc.
  scanTimestamp: timestamp("scan_timestamp").defaultNow().notNull(),
  metadata: jsonb("metadata"), // Additional file metadata
});

export const systemStatus = pgTable("system_status", {
  id: serial("id").primaryKey(),
  realtimeProtection: boolean("realtime_protection").notNull().default(true),
  lastFullScan: timestamp("last_full_scan"),
  lastQuickScan: timestamp("last_quick_scan"),
  threatsDetected: integer("threats_detected").notNull().default(0),
  systemHealth: integer("system_health").notNull().default(100), // 0-100
  lastUpdateCheck: timestamp("last_update_check"),
  signatureVersion: text("signature_version"),
});

export const malwareSignatures = pgTable("malware_signatures", {
  id: serial("id").primaryKey(),
  signatureHash: text("signature_hash").notNull().unique(),
  malwareType: text("malware_type").notNull(),
  threatLevel: integer("threat_level").notNull(), // 1-5
  description: text("description"),
  detectionPattern: text("detection_pattern").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertScanResultSchema = createInsertSchema(scanResults).omit({
  id: true,
  scanTimestamp: true,
});

export const insertMalwareSignatureSchema = createInsertSchema(malwareSignatures).omit({
  id: true,
  createdAt: true,
});

export type InsertScanResult = z.infer<typeof insertScanResultSchema>;
export type ScanResult = typeof scanResults.$inferSelect;
export type SystemStatus = typeof systemStatus.$inferSelect;
export type MalwareSignature = typeof malwareSignatures.$inferSelect;

// Malware detection patterns and signatures
export const MALWARE_PATTERNS = {
  VIRUS: /^X5O!P%@AP\[4\\PZX54\(P\^\)7CC\)7\}\$EICAR/,
  SUSPICIOUS_PATTERNS: [
    /WScript\.Shell/,
    /cmd\.exe/,
    /powershell\.exe/,
    /System\.Reflection/,
  ],
  DANGEROUS_IMPORTS: [
    "kernel32.dll",
    "user32.dll",
    "advapi32.dll",
  ],
};

export const THREAT_LEVELS = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
  SEVERE: 5,
} as const;