import { createHash } from "crypto";
import { readFile, stat } from "fs/promises";
import {
  type ScanResult,
  type InsertScanResult,
  type SystemStatus,
  type MalwareSignature,
  type NetworkEvent,
  type MaliciousUrl,
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

  // Network protection
  addNetworkEvent(event: NetworkEvent): Promise<void>;
  getNetworkEvents(): Promise<NetworkEvent[]>;
  isUrlMalicious(url: string): Promise<boolean>;
  scanUrl(url: string): Promise<{isMalicious: boolean; category?: string}>;
}

export class MemStorage implements IStorage {
  private scanResults: Map<number, ScanResult>;
  private systemStatus: SystemStatus;
  private malwareSignatures: Map<string, MalwareSignature>;
  private networkEvents: Map<number, NetworkEvent>;
  private maliciousUrls: Map<number, MaliciousUrl>;
  private currentId: number;
  private networkEventId: number;

  constructor() {
    this.scanResults = new Map();
    this.malwareSignatures = new Map();
    this.networkEvents = new Map();
    this.maliciousUrls = new Map();
    this.currentId = 1;
    this.networkEventId = 1;
    this.systemStatus = {
      id: 1,
      realtimeProtection: true,
      webProtection: true,
      downloadScanning: true,
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

  private async checkFileAgainstSignatures(fileContent: Buffer, filePath: string): Promise<{
    matches: string[];
    threatLevel: number;
  }> {
    const matches: string[] = [];
    let maxThreatLevel = 0;

    // Check against known malware signatures
    const signatures = await this.getMalwareSignatures();
    for (const signature of signatures) {
      const pattern = new RegExp(signature.detectionPattern, 'i');
      if (pattern.test(fileContent.toString())) {
        matches.push(signature.malwareType);
        maxThreatLevel = Math.max(maxThreatLevel, signature.threatLevel);
      }
    }

    // File extension checks
    const ext = filePath.toLowerCase().split('.').pop();
    const suspiciousExts = ['exe', 'dll', 'bat', 'cmd', 'ps1', 'vbs'];
    if (suspiciousExts.includes(ext)) {
      // Additional checks for executable files
      for (const importName of MALWARE_PATTERNS.DANGEROUS_IMPORTS) {
        if (fileContent.includes(Buffer.from(importName))) {
          matches.push(`suspicious_import_${importName}`);
          maxThreatLevel = Math.max(maxThreatLevel, THREAT_LEVELS.HIGH);
        }
      }
    }

    return {
      matches,
      threatLevel: maxThreatLevel
    };
  }

  private async scanForThreats(filePath: string, content: Buffer): Promise<{
    status: string;
    threatType?: string;
    threatLevel?: number;
  }> {
    // EICAR test virus pattern check
    if (MALWARE_PATTERNS.VIRUS.test(content.toString())) {
      return {
        status: "infected",
        threatType: "virus",
        threatLevel: THREAT_LEVELS.CRITICAL
      };
    }

    // Signature-based detection
    const signatureCheck = await this.checkFileAgainstSignatures(content, filePath);
    if (signatureCheck.matches.length > 0) {
      return {
        status: "infected",
        threatType: signatureCheck.matches.join(', '),
        threatLevel: signatureCheck.threatLevel
      };
    }

    // Heuristic pattern checks
    for (const pattern of MALWARE_PATTERNS.SUSPICIOUS_PATTERNS) {
      if (pattern.test(content.toString())) {
        return {
          status: "suspicious",
          threatType: "potential_malware",
          threatLevel: THREAT_LEVELS.MEDIUM
        };
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
    // Örnek imzalar ekliyoruz (gerçek bir sistemde bu imzalar bir veritabanından veya güncel bir API'den gelir)
    const sampleSignatures: MalwareSignature[] = [
      {
        id: 1,
        signatureHash: "sample_hash_1",
        malwareType: "trojan",
        threatLevel: THREAT_LEVELS.HIGH,
        description: "Generic Trojan Signature",
        detectionPattern: "(?i)(trojan|backdoor|rootkit)",
        createdAt: new Date()
      },
      {
        id: 2,
        signatureHash: "sample_hash_2",
        malwareType: "ransomware",
        threatLevel: THREAT_LEVELS.CRITICAL,
        description: "Ransomware Signature",
        detectionPattern: "(?i)(encrypt.*files|decrypt.*payment|bitcoin|wallet)",
        createdAt: new Date()
      },
      {
        id: 3,
        signatureHash: "sample_hash_3",
        malwareType: "keylogger",
        threatLevel: THREAT_LEVELS.HIGH,
        description: "Keylogger Signature",
        detectionPattern: "(?i)(keylog|getasynckeystate|keyboard.*hook)",
        createdAt: new Date()
      }
    ];

    // İmzaları hafızada saklıyoruz
    this.malwareSignatures.clear();
    for (const sig of sampleSignatures) {
      this.malwareSignatures.set(sig.signatureHash, sig);
    }

    // Sistem durumunu güncelliyoruz
    await this.updateSystemStatus({
      lastUpdateCheck: new Date(),
      signatureVersion: "1.0.1"
    });
  }

  async addNetworkEvent(event: NetworkEvent): Promise<void> {
    const id = this.networkEventId++;
    this.networkEvents.set(id, { ...event, id, timestamp: new Date() });
  }

  async getNetworkEvents(): Promise<NetworkEvent[]> {
    return Array.from(this.networkEvents.values());
  }

  async isUrlMalicious(url: string): Promise<boolean> {
    // Check against known malicious domains
    const domain = new URL(url).hostname;
    return MALWARE_PATTERNS.MALICIOUS_DOMAINS.some(maliciousDomain =>
      domain.includes(maliciousDomain)
    );
  }

  async scanUrl(url: string): Promise<{isMalicious: boolean; category?: string}> {
    // Check for suspicious protocols
    for (const protocol of MALWARE_PATTERNS.SUSPICIOUS_PROTOCOLS) {
      if (url.toLowerCase().startsWith(protocol)) {
        return { isMalicious: true, category: 'suspicious_protocol' };
      }
    }

    // Check known malicious domains
    if (await this.isUrlMalicious(url)) {
      return { isMalicious: true, category: 'malicious_domain' };
    }

    return { isMalicious: false };
  }
}

export const storage = new MemStorage();