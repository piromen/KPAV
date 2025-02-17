import { type ScanResult, type InsertScanResult, type SystemStatus } from "@shared/schema";

export interface IStorage {
  getScanResults(): Promise<ScanResult[]>;
  addScanResult(result: InsertScanResult): Promise<ScanResult>;
  getSystemStatus(): Promise<SystemStatus>;
  updateSystemStatus(status: Partial<SystemStatus>): Promise<SystemStatus>;
}

export class MemStorage implements IStorage {
  private scanResults: Map<number, ScanResult>;
  private systemStatus: SystemStatus;
  private currentId: number;

  constructor() {
    this.scanResults = new Map();
    this.currentId = 1;
    this.systemStatus = {
      id: 1,
      protection: true,
      lastScan: new Date(),
      threatsFound: 0
    };
  }

  async getScanResults(): Promise<ScanResult[]> {
    return Array.from(this.scanResults.values());
  }

  async addScanResult(result: InsertScanResult): Promise<ScanResult> {
    const id = this.currentId++;
    const scanResult: ScanResult = {
      ...result,
      id,
      timestamp: new Date()
    };
    this.scanResults.set(id, scanResult);
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
}

export const storage = new MemStorage();
