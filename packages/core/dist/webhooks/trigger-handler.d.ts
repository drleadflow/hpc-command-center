export interface WebhookTrigger {
    id: string;
    name: string;
    path: string;
    employeeId: string;
    action: string;
    enabled: boolean;
}
export interface WebhookResult {
    triggerId: string;
    employeeId: string;
    success: boolean;
    response: string;
    timestamp: string;
}
export declare function loadTriggersFromFile(path: string): WebhookTrigger[];
export declare function getTriggerByPath(path: string): WebhookTrigger | undefined;
export declare function getAllTriggers(): WebhookTrigger[];
export declare function handleWebhookTrigger(triggerId: string, payload: unknown): Promise<WebhookResult>;
//# sourceMappingURL=trigger-handler.d.ts.map