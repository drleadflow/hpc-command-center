import type { ScorecardEntry, ScorecardMetric, EmployeeDefinition } from './types.js';
export declare function getScorecardStatus(value: number, metric: ScorecardMetric): 'green' | 'yellow' | 'red';
export declare function recordMetric(employeeId: string, metricId: string, value: number): void;
export declare function getScorecard(employeeId: string): ScorecardEntry[];
export declare function formatScorecard(entries: ScorecardEntry[], employee: EmployeeDefinition): string;
//# sourceMappingURL=scorecard.d.ts.map