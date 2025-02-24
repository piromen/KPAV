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
  webProtection: boolean("web_protection").notNull().default(true),
  downloadScanning: boolean("download_scanning").notNull().default(true),
  lastFullScan: timestamp("last_full_scan"),
  lastQuickScan: timestamp("last_quick_scan"),
  threatsDetected: integer("threats_detected").notNull().default(0),
  systemHealth: integer("system_health").notNull().default(100), // 0-100
  lastUpdateCheck: timestamp("last_update_check"),
  signatureVersion: text("signature_version"),
});

export const networkEvents = pgTable("network_events", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  processName: text("process_name").notNull(),
  remoteAddress: text("remote_address").notNull(),
  remotePort: integer("remote_port").notNull(),
  protocol: text("protocol").notNull(),
  action: text("action").notNull(), // allowed, blocked
  reason: text("reason"),
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

export const maliciousUrls = pgTable("malicious_urls", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  category: text("category").notNull(), // phishing, malware, scam
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  active: boolean("active").notNull().default(true),
});

// Insert schemas
export const insertScanResultSchema = createInsertSchema(scanResults).omit({
  id: true,
  scanTimestamp: true,
});

export const insertMalwareSignatureSchema = createInsertSchema(malwareSignatures).omit({
  id: true,
  createdAt: true,
});

export const insertNetworkEventSchema = createInsertSchema(networkEvents).omit({
  id: true,
  timestamp: true,
});

export const insertMaliciousUrlSchema = createInsertSchema(maliciousUrls).omit({
    id: true,
    lastUpdated: true,
});

// Types
export type InsertScanResult = z.infer<typeof insertScanResultSchema>;
export type ScanResult = typeof scanResults.$inferSelect;
export type SystemStatus = typeof systemStatus.$inferSelect;
export type MalwareSignature = typeof malwareSignatures.$inferSelect;
export type NetworkEvent = typeof networkEvents.$inferSelect;
export type MaliciousUrl = typeof maliciousUrls.$inferSelect;


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
  MALICIOUS_DOMAINS: [
    "malware.example.com",
    "phishing.example.net",
    "suspicious.example.org"
  ],
  SUSPICIOUS_PROTOCOLS: [
    "irc:",
    "telnet:",
    "ftp:"
  ]
};

export const THREAT_LEVELS = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
  SEVERE: 5,
} as const;