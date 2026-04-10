export interface Prediction {
    id: string;
    employeeId: string;
    type: 'risk' | 'opportunity' | 'reminder' | 'trend' | 'milestone';
    title: string;
    detail: string;
    confidence: number;
    actionSuggestion: string;
    urgency: 'low' | 'medium' | 'high' | 'urgent';
    createdAt: string;
    expiresAt?: string;
}
export declare function generatePredictions(employeeId: string): Prediction[];
export declare function getAllPredictions(): Prediction[];
export declare function dismissPrediction(id: string): void;
export declare function formatPredictions(predictions: Prediction[], limit?: number): string;
//# sourceMappingURL=predictions.d.ts.map