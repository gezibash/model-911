export type StabilityStatus = "stable" | "warning" | "critical";

export interface FingerprintMetrics {
  modelId: string;
  provider: string;
  modelName: string;
  displayName: string;
  stabilityScore: number; // 0-100 (100 = most stable)
  uniqueFingerprints: number;
  totalEvaluations: number;
  changesPerDay: number;
  lastChange: Date | null;
  status: StabilityStatus;
  currentFingerprint: string | null;
  evaluationsPeriod: number; // days of data
}

export interface TimelineDataPoint {
  timestamp: Date;
  fingerprint: string;
  isChange: boolean;
  evaluationCount: number;
}

export interface FingerprintChangeEvent {
  timestamp: Date;
  previousFingerprint: string | null;
  newFingerprint: string;
  evaluationId: string | null;
}

export interface ModelTimelineData {
  modelId: string;
  modelName: string;
  provider: string;
  timeline: TimelineDataPoint[];
  changes: FingerprintChangeEvent[];
  stabilityTrend: Array<{
    date: Date;
    score: number;
  }>;
  currentFingerprint: string | null;
}

export interface DashboardSummary {
  totalModels: number;
  stableModels: number;
  warningModels: number;
  criticalModels: number;
  averageStabilityScore: number;
}
