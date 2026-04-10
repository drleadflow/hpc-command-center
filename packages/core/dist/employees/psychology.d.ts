export declare function detectBuyerArchetype(messages: string[]): 'validator' | 'investigator' | 'skeptic' | null;
export declare function detectMotivation(messages: string[]): 'achievement' | 'security' | 'growth' | null;
export declare function detectEmotionalState(message: string): 'stressed' | 'excited' | 'frustrated' | 'neutral';
export declare function getClarityCompass(decision: string, context: {
    companyGoals: string;
    customerProfile: string;
    values: string;
    advantages: string;
}): string;
export declare function getValueEquation(offer: {
    dreamOutcome: string;
    likelihood: string;
    timeDelay: string;
    effort: string;
}): string;
//# sourceMappingURL=psychology.d.ts.map