export interface EmotionalContext {
    state: 'calm' | 'stressed' | 'frustrated' | 'excited' | 'overwhelmed' | 'burned_out';
    confidence: number;
    suggestedArchetypeShift?: 'coach' | 'operator';
    supportMessage?: string;
}
export declare function detectEmotionalContext(recentMessages: string[]): EmotionalContext;
//# sourceMappingURL=emotional-awareness.d.ts.map