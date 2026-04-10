export declare const conversations: {
    create(title?: string): {
        id: string;
        title?: string;
        createdAt: string;
        updatedAt: string;
    };
    get(id: string): {
        id: string;
        title?: string;
        createdAt: string;
        updatedAt: string;
    } | undefined;
    list(limit?: number): {
        id: string;
        title?: string;
        createdAt: string;
        updatedAt: string;
    }[];
    updateTitle(id: string, title: string): void;
};
export declare const messages: {
    create(params: {
        conversationId: string;
        role: string;
        content: string;
        model?: string;
        inputTokens?: number;
        outputTokens?: number;
    }): {
        id: string;
    };
    listByConversation(conversationId: string, limit?: number): {
        id: string;
        conversationId: string;
        role: string;
        content: string;
        model?: string;
        inputTokens: number;
        outputTokens: number;
        createdAt: string;
    }[];
};
export declare const toolCalls: {
    create(params: {
        messageId: string;
        conversationId: string;
        toolName: string;
        input: unknown;
        success: boolean;
        result?: unknown;
        display?: string;
        durationMs?: number;
    }): void;
    listByConversation(conversationId: string): unknown[];
};
export declare const jobs: {
    create(params: {
        title: string;
        description: string;
        repoUrl: string;
        branch: string;
        baseBranch?: string;
        agentModel?: string;
    }): {
        id: string;
    };
    get(id: string): unknown;
    list(limit?: number): unknown[];
    updateStatus(id: string, status: string, extra?: Record<string, unknown>): void;
};
export declare const jobLogs: {
    add(jobId: string, level: string, message: string, data?: unknown): void;
    listByJob(jobId: string, limit?: number): unknown[];
};
export declare const memories: {
    create(params: {
        type: string;
        content: string;
        tags: string[];
        source: string;
        confidence?: number;
    }): {
        id: string;
    };
    search(query: string, limit?: number): unknown[];
    getAll(limit?: number): unknown[];
    reinforce(id: string): void;
    decay(id: string): void;
    delete(id: string): void;
    prune(minConfidence?: number): number;
};
export declare const skills: {
    upsert(params: {
        id?: string;
        name: string;
        description: string;
        systemPrompt: string;
        tools: string[];
        examples?: unknown[];
        source?: string;
    }): {
        id: string;
    };
    get(name: string): unknown;
    list(): unknown[];
    recordUse(name: string, success: boolean): void;
};
export declare const costEntries: {
    record(params: {
        model: string;
        inputTokens: number;
        outputTokens: number;
        inputCostUsd: number;
        outputCostUsd: number;
        totalCostUsd: number;
        jobId?: string;
        conversationId?: string;
    }): void;
    summary(days?: number): {
        totalUsd: number;
        byModel: Record<string, number>;
        byDay: Record<string, number>;
        tokenCount: {
            input: number;
            output: number;
        };
    };
};
export declare const employees: {
    upsert(params: {
        slug: string;
        name: string;
        title: string;
        pillar: string;
        description: string;
        icon?: string;
        active?: boolean;
        archetype?: string;
        onboardingAnswers?: Record<string, string>;
    }): {
        id: string;
    };
    get(slug: string): {
        id: string;
        slug: string;
        name: string;
        title: string;
        pillar: string;
        description: string;
        icon: string;
        active: number;
        archetype: string | null;
        onboardingAnswersJson: string;
        createdAt: string;
        updatedAt: string;
    } | undefined;
    list(): {
        id: string;
        slug: string;
        name: string;
        title: string;
        pillar: string;
        description: string;
        icon: string;
        active: number;
        archetype: string | null;
        onboardingAnswersJson: string;
        createdAt: string;
    }[];
    listActive(): {
        id: string;
        slug: string;
        name: string;
        title: string;
        pillar: string;
        description: string;
        icon: string;
        archetype: string | null;
        onboardingAnswersJson: string;
    }[];
    activate(slug: string, archetype: string, answers: Record<string, string>): void;
    deactivate(slug: string): void;
};
export declare const notifications: {
    create(params: {
        title: string;
        message: string;
        type?: string;
        employeeSlug?: string;
    }): {
        id: string;
    };
    list(limit?: number): {
        id: string;
        title: string;
        message: string;
        type: string;
        read: number;
        employeeSlug: string | null;
        createdAt: string;
    }[];
    markRead(id: string): void;
    markAllRead(): void;
    unreadCount(): number;
};
export declare const xpEvents: {
    record(params: {
        action: string;
        xp: number;
        employeeId?: string;
    }): {
        id: string;
    };
    total(): number;
    recent(limit?: number): {
        id: string;
        action: string;
        xp: number;
        employeeId: string | null;
        createdAt: string;
    }[];
};
export declare const streaks: {
    get(id: string): {
        id: string;
        name: string;
        currentStreak: number;
        longestStreak: number;
        lastCheckedIn: string;
        employeeId: string;
    } | undefined;
    upsert(params: {
        id: string;
        name: string;
        currentStreak: number;
        longestStreak: number;
        lastCheckedIn: string;
        employeeId: string;
    }): void;
    list(employeeId?: string): {
        id: string;
        name: string;
        currentStreak: number;
        longestStreak: number;
        lastCheckedIn: string;
        employeeId: string;
    }[];
};
export declare const achievements: {
    unlock(id: string, name: string): void;
    list(): {
        id: string;
        name: string;
        unlockedAt: string;
    }[];
    isUnlocked(id: string): boolean;
};
export declare const workflowRuns: {
    create(params: {
        id: string;
        workflowId: string;
    }): void;
    get(id: string): {
        id: string;
        workflowId: string;
        status: string;
        stepResultsJson: string;
        totalCost: number;
        startedAt: string;
        completedAt: string | null;
    } | undefined;
    update(id: string, params: {
        status?: string;
        stepResultsJson?: string;
        totalCost?: number;
        completedAt?: string;
    }): void;
    list(limit?: number): {
        id: string;
        workflowId: string;
        status: string;
        stepResultsJson: string;
        totalCost: number;
        startedAt: string;
        completedAt: string | null;
    }[];
};
export declare const handoffs: {
    create(params: {
        id: string;
        fromEmployee: string;
        toEmployee: string;
        reason: string;
        context: string;
        priority: string;
    }): void;
    get(id: string): {
        id: string;
        fromEmployee: string;
        toEmployee: string;
        reason: string;
        context: string;
        priority: string;
        status: string;
        createdAt: string;
        completedAt: string | null;
    } | undefined;
    listPendingForEmployee(toEmployee: string): {
        id: string;
        fromEmployee: string;
        toEmployee: string;
        reason: string;
        context: string;
        priority: string;
        status: string;
        createdAt: string;
        completedAt: string | null;
    }[];
    updateStatus(id: string, status: string): void;
    clear(): void;
};
export declare const evolutionEvents: {
    record(params: {
        type: string;
        description: string;
        before?: string;
        after?: string;
        impact?: string;
    }): void;
    recent(limit?: number): {
        id: string;
        type: string;
        description: string;
        beforeValue: string | null;
        afterValue: string | null;
        impact: string | null;
        createdAt: string;
    }[];
    countByType(): Record<string, number>;
};
export declare const userProfile: {
    get(): {
        id: string;
        totalXp: number;
        level: number;
        createdAt: string;
    } | undefined;
    update(params: {
        totalXp: number;
        level: number;
    }): void;
};
export declare const priorities: {
    create(params: {
        title: string;
        description?: string;
        emoji?: string;
        urgency?: string;
    }): {
        id: string;
    };
    listToday(): {
        id: string;
        title: string;
        description: string | null;
        emoji: string;
        urgency: string;
        completed: number;
        date: string;
        createdAt: string;
    }[];
    complete(id: string): void;
    uncomplete(id: string): void;
    delete(id: string): void;
};
//# sourceMappingURL=repositories.d.ts.map