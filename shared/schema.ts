import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const scanResults = pgTable("scan_results", {
  id: serial("id").primaryKey(),
  path: text("path").notNull(),
  status: text("status").notNull(), // clean, infected, suspicious
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  details: text("details"),
});

export const systemStatus = pgTable("system_status", {
  id: serial("id").primaryKey(),
  protection: boolean("protection").notNull().default(true),
  lastScan: timestamp("last_scan"),
  threatsFound: integer("threats_found").notNull().default(0),
});

export const insertScanResultSchema = createInsertSchema(scanResults).omit({ 
  id: true,
  timestamp: true 
});

export type InsertScanResult = z.infer<typeof insertScanResultSchema>;
export type ScanResult = typeof scanResults.$inferSelect;
export type SystemStatus = typeof systemStatus.$inferSelect;

export const mockThreats = [
  "Trojan.Win32.Generic",
  "Adware.Win32.WebCompanion",
  "Spyware.Cookie.Tracker",
  "PUA.Win32.Optimizer",
  "Malware.Script.Generic"
];
