import { createHash } from "crypto";
import { readFile, stat } from "fs/promises";
import { 
  type ScanResult, 
  type InsertScanResult, 
  type SystemStatus,
  type MalwareSignature,
  MALWARE_PATTERNS,
  THREAT_LEVELS
} from "@shared/schema";

export interface IStorage {
  // Scan operations
  scanFile(filePath: string): Promise<ScanResult>;
  getScanResults(): Promise<ScanResult[]>;
  addScanResult(result: InsertScanResult): Promise<ScanResult>;

  // System status
  getSystemStatus(): Promise<SystemStatus>;
  updateSystemStatus(status: Partial<SystemStatus>): Promise<SystemStatus>;

  // Malware signatures
  getMalwareSignatures(): Promise<MalwareSignature[]>;
  updateSignatures(): Promise<void>;
}

export class MemStorage implements IStorage {
  private scanResults: Map<number, ScanResult>;
  private systemStatus: SystemStatus;
  private malwareSignatures: Map<string, MalwareSignature>;
  private currentId: number;

  constructor() {
    this.scanResults = new Map();
    this.malwareSignatures = new Map();
    this.currentId = 1;
    this.systemStatus = {
      id: 1,
      realtimeProtection: true,
      lastFullScan: null,
      lastQuickScan: null,
      threatsDetected: 0,
      systemHealth: 100,
      lastUpdateCheck: new Date(),
      signatureVersion: "1.0.0"
    };
  }

  private async calculateFileHash(filePath: string): Promise<string> {
    const content = await readFile(filePath);
    return createHash('sha256').update(content).digest('hex');
  }

  private async scanForThreats(filePath: string, content: Buffer): Promise<{
    status: string;
    threatType?: string;
    threatLevel?: number;
  }> {
    // Check file against EICAR test virus pattern
    if (MALWARE_PATTERNS.VIRUS.test(content.toString())) {
      return {
        status: "infected",
        threatType: "virus",
        threatLevel: THREAT_LEVELS.CRITICAL
      };
    }

    // Check for suspicious patterns
    for (const pattern of MALWARE_PATTERNS.SUSPICIOUS_PATTERNS) {
      if (pattern.test(content.toString())) {
        return {
          status: "suspicious",
          threatType: "potential_malware",
          threatLevel: THREAT_LEVELS.MEDIUM
        };
      }
    }

    // Check for dangerous imports in executables
    if (filePath.endsWith('.exe') || filePath.endsWith('.dll')) {
      for (const importName of MALWARE_PATTERNS.DANGEROUS_IMPORTS) {
        if (content.includes(Buffer.from(importName))) {
          return {
            status: "suspicious",
            threatType: "suspicious_binary",
            threatLevel: THREAT_LEVELS.HIGH
          };
        }
      }
    }

    return { status: "clean" };
  }

  async scanFile(filePath: string): Promise<ScanResult> {
    try {
      const fileContent = await readFile(filePath);
      const fileStats = await stat(filePath);
      const fileHash = await this.calculateFileHash(filePath);

      const scanResult = await this.scanForThreats(filePath, fileContent);

      const result: InsertScanResult = {
        filePath,
        fileHash,
        fileSize: fileStats.size,
        status: scanResult.status,
        threatType: scanResult.threatType || null,
        metadata: {
          threatLevel: scanResult.threatLevel,
          permissions: fileStats.mode,
          lastModified: fileStats.mtime
        }
      };

      return await this.addScanResult(result);
    } catch (error) {
      console.error(`Error scanning file ${filePath}:`, error);
      throw new Error(`Failed to scan file: ${error.message}`);
    }
  }

  async getScanResults(): Promise<ScanResult[]> {
    return Array.from(this.scanResults.values());
  }

  async addScanResult(result: InsertScanResult): Promise<ScanResult> {
    const id = this.currentId++;
    const scanResult: ScanResult = {
      ...result,
      id,
      scanTimestamp: new Date()
    };
    this.scanResults.set(id, scanResult);

    if (result.status !== "clean") {
      await this.updateSystemStatus({
        threatsDetected: this.systemStatus.threatsDetected + 1,
        systemHealth: Math.max(0, this.systemStatus.systemHealth - 10)
      });
    }

    return scanResult;
  }

  async getSystemStatus(): Promise<SystemStatus> {
    return this.systemStatus;
  }

  async updateSystemStatus(status: Partial<SystemStatus>): Promise<SystemStatus> {
    this.systemStatus = {
      ...this.systemStatus,
      ...status,
      id: 1
    };
    return this.systemStatus;
  }

  async getMalwareSignatures(): Promise<MalwareSignature[]> {
    return Array.from(this.malwareSignatures.values());
  }

  async updateSignatures(): Promise<void> {
    // In a real implementation, this would download and update signatures
    // For now, we'll just update the version and timestamp
    await this.updateSystemStatus({
      lastUpdateCheck: new Date(),
      signatureVersion: "1.0.1"
    });
  }
}

export const storage = new MemStorage();