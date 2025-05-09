import { create } from 'zustand';

// Types for behavioral metrics
interface BehavioralMetrics {
  mouseMovements: MouseEvent[];
  clicks: ClickEvent[];
  reactionTimes: number[];
  movementPaths: PathPoint[];
  resourceActions: ResourceAction[];
  combatActions: CombatAction[];
}

interface MouseEvent {
  x: number;
  y: number;
  timestamp: number;
  velocity: number;
  acceleration: number;
}

interface ClickEvent {
  x: number;
  y: number;
  timestamp: number;
  type: 'single' | 'double' | 'right';
  targetElement?: string;
}

interface PathPoint {
  x: number;
  y: number;
  timestamp: number;
  velocity: number;
  direction: number;
}

interface ResourceAction {
  type: string;
  timestamp: number;
  duration: number;
  efficiency: number;
}

interface CombatAction {
  type: string;
  timestamp: number;
  reactionTime: number;
  accuracy: number;
  targetSelection: string;
}

interface DetectionResult {
  riskScore: number;
  confidence: number;
  anomalies: string[];
  evidence: Evidence[];
}

interface Evidence {
  type: string;
  description: string;
  severity: number;
  data: any;
}

// AI Detection Store
interface DetectionState {
  metrics: BehavioralMetrics;
  baselineData: BehavioralMetrics[];
  detectionResults: DetectionResult[];
  thresholds: {
    riskScore: number;
    reactionTime: number;
    mouseAccuracy: number;
    patternRepetition: number;
  };
  isMonitoring: boolean;
  addMetrics: (metrics: Partial<BehavioralMetrics>) => void;
  analyze: () => DetectionResult;
  updateThresholds: (thresholds: Partial<DetectionState['thresholds']>) => void;
  startMonitoring: () => void;
  stopMonitoring: () => void;
}

export const useDetectionStore = create<DetectionState>((set, get) => ({
  metrics: {
    mouseMovements: [],
    clicks: [],
    reactionTimes: [],
    movementPaths: [],
    resourceActions: [],
    combatActions: [],
  },
  baselineData: [],
  detectionResults: [],
  thresholds: {
    riskScore: 75,
    reactionTime: 150, // milliseconds
    mouseAccuracy: 0.95,
    patternRepetition: 0.8,
  },
  isMonitoring: false,

  addMetrics: (newMetrics) => {
    set((state) => ({
      metrics: {
        ...state.metrics,
        ...newMetrics,
      },
    }));
  },

  analyze: () => {
    const state = get();
    const result: DetectionResult = {
      riskScore: 0,
      confidence: 0,
      anomalies: [],
      evidence: [],
    };

    // Analyze mouse movements
    const mouseAnalysis = analyzeMousePatterns(state.metrics.mouseMovements);
    if (mouseAnalysis.isAnomaly) {
      result.anomalies.push('Suspicious mouse movement patterns detected');
      result.evidence.push({
        type: 'mouse_movement',
        description: mouseAnalysis.description,
        severity: mouseAnalysis.severity,
        data: mouseAnalysis.data,
      });
      result.riskScore += mouseAnalysis.riskContribution;
    }

    // Analyze reaction times
    const reactionAnalysis = analyzeReactionTimes(state.metrics.reactionTimes, state.thresholds.reactionTime);
    if (reactionAnalysis.isAnomaly) {
      result.anomalies.push('Inhuman reaction times detected');
      result.evidence.push({
        type: 'reaction_time',
        description: reactionAnalysis.description,
        severity: reactionAnalysis.severity,
        data: reactionAnalysis.data,
      });
      result.riskScore += reactionAnalysis.riskContribution;
    }

    // Analyze movement paths
    const pathAnalysis = analyzeMovementPaths(state.metrics.movementPaths);
    if (pathAnalysis.isAnomaly) {
      result.anomalies.push('Suspicious movement patterns detected');
      result.evidence.push({
        type: 'movement_path',
        description: pathAnalysis.description,
        severity: pathAnalysis.severity,
        data: pathAnalysis.data,
      });
      result.riskScore += pathAnalysis.riskContribution;
    }

    // Calculate confidence based on evidence quantity and quality
    result.confidence = calculateConfidence(result.evidence);

    // Store detection result
    set((state) => ({
      detectionResults: [...state.detectionResults, result],
    }));

    return result;
  },

  updateThresholds: (newThresholds) => {
    set((state) => ({
      thresholds: {
        ...state.thresholds,
        ...newThresholds,
      },
    }));
  },

  startMonitoring: () => {
    set({ isMonitoring: true });
    initializeMonitoring(get().addMetrics);
  },

  stopMonitoring: () => {
    set({ isMonitoring: false });
    cleanupMonitoring();
  },
}));

// Analysis helper functions
function analyzeMousePatterns(movements: MouseEvent[]): any {
  const velocities = movements.map(m => m.velocity);
  const accelerations = movements.map(m => m.acceleration);
  
  const avgVelocity = mean(velocities);
  const stdVelocity = standardDeviation(velocities);
  const avgAcceleration = mean(accelerations);
  
  const isAnomaly = detectMouseAnomalies(avgVelocity, stdVelocity, avgAcceleration);
  
  return {
    isAnomaly,
    description: isAnomaly ? 'Unusual mouse movement patterns detected' : '',
    severity: calculateSeverity(avgVelocity, stdVelocity),
    data: { avgVelocity, stdVelocity, avgAcceleration },
    riskContribution: isAnomaly ? 25 : 0,
  };
}

function analyzeReactionTimes(times: number[], threshold: number): any {
  const avgReactionTime = mean(times);
  const minReactionTime = Math.min(...times);
  
  const isAnomaly = minReactionTime < threshold || avgReactionTime < threshold * 1.2;
  
  return {
    isAnomaly,
    description: isAnomaly ? 'Reaction times below human capability detected' : '',
    severity: calculateSeverity(threshold - minReactionTime, threshold - avgReactionTime),
    data: { avgReactionTime, minReactionTime, threshold },
    riskContribution: isAnomaly ? 30 : 0,
  };
}

function analyzeMovementPaths(paths: PathPoint[]): any {
  const patterns = findMovementPatterns(paths);
  const repetitionRate = calculateRepetitionRate(patterns);
  
  const isAnomaly = repetitionRate > 0.8;
  
  return {
    isAnomaly,
    description: isAnomaly ? 'Highly repetitive movement patterns detected' : '',
    severity: calculateSeverity(repetitionRate, patterns.length),
    data: { patterns, repetitionRate },
    riskContribution: isAnomaly ? 20 : 0,
  };
}

// Statistical utility functions
function mean(values: number[]): number {
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

function standardDeviation(values: number[]): number {
  const avg = mean(values);
  const squareDiffs = values.map(value => Math.pow(value - avg, 2));
  return Math.sqrt(mean(squareDiffs));
}

function calculateSeverity(...factors: number[]): number {
  return Math.min(1, Math.max(0, mean(factors)));
}

function calculateConfidence(evidence: Evidence[]): number {
  if (evidence.length === 0) return 0;
  
  const totalSeverity = evidence.reduce((sum, e) => sum + e.severity, 0);
  const avgSeverity = totalSeverity / evidence.length;
  const evidenceWeight = Math.min(1, evidence.length / 3);
  
  return avgSeverity * evidenceWeight * 100;
}

// Pattern detection helpers
function findMovementPatterns(paths: PathPoint[]): any[] {
  // Implement pattern detection algorithm
  return [];
}

function calculateRepetitionRate(patterns: any[]): number {
  // Implement repetition rate calculation
  return 0;
}

function detectMouseAnomalies(avgVelocity: number, stdVelocity: number, avgAcceleration: number): boolean {
  // Implement mouse anomaly detection
  return false;
}

// Monitoring setup
function initializeMonitoring(addMetrics: DetectionState['addMetrics']): void {
  // Set up event listeners for mouse movements
  document.addEventListener('mousemove', (e) => {
    const mouseEvent: MouseEvent = {
      x: e.clientX,
      y: e.clientY,
      timestamp: Date.now(),
      velocity: 0, // Calculate based on previous position
      acceleration: 0, // Calculate based on previous velocity
    };
    addMetrics({ mouseMovements: [mouseEvent] });
  });

  // Set up click monitoring
  document.addEventListener('click', (e) => {
    const clickEvent: ClickEvent = {
      x: e.clientX,
      y: e.clientY,
      timestamp: Date.now(),
      type: 'single',
      targetElement: (e.target as HTMLElement).tagName,
    };
    addMetrics({ clicks: [clickEvent] });
  });
}

function cleanupMonitoring(): void {
  // Remove event listeners
  document.removeEventListener('mousemove', () => {});
  document.removeEventListener('click', () => {});
}