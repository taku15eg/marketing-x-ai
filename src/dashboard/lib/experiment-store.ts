// Experiment Log Store - localStorage management
// MOAT形成の中核: 施策のBefore/After・数値変化を記録

import type { ExperimentLog } from './types';

const STORAGE_KEY = 'publish_gate_experiment_logs';
const MAX_LOGS = 20; // Free tier limit

export function getExperimentLogs(): ExperimentLog[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function addExperimentLog(log: ExperimentLog): void {
  const logs = getExperimentLogs();
  logs.unshift(log);
  if (logs.length > MAX_LOGS) {
    logs.pop();
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
}

export function updateExperimentLog(id: string, updates: Partial<ExperimentLog>): void {
  const logs = getExperimentLogs();
  const index = logs.findIndex(l => l.id === id);
  if (index !== -1) {
    logs[index] = { ...logs[index], ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  }
}

export function deleteExperimentLog(id: string): void {
  const logs = getExperimentLogs();
  const filtered = logs.filter(l => l.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}
