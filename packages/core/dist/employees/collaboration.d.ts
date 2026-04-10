export interface HandoffRequest {
    id: string;
    fromEmployee: string;
    toEmployee: string;
    reason: string;
    context: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'pending' | 'accepted' | 'completed';
    createdAt: string;
}
export declare function requestHandoff(handoff: Omit<HandoffRequest, 'id' | 'status' | 'createdAt'>): HandoffRequest;
export declare function getHandoffsForEmployee(employeeId: string): HandoffRequest[];
export declare function acceptHandoff(handoffId: string): void;
export declare function completeHandoff(handoffId: string): void;
export declare function buildCollaborationContext(employeeId: string): string;
export declare function clearHandoffs(): void;
//# sourceMappingURL=collaboration.d.ts.map