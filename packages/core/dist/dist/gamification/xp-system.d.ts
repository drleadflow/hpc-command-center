export interface XPEvent {
    action: string;
    xp: number;
    employeeId?: string;
}
export interface UserLevel {
    level: number;
    title: string;
    currentXP: number;
    nextLevelXP: number;
    totalXP: number;
}
export interface Streak {
    id: string;
    name: string;
    currentStreak: number;
    longestStreak: number;
    lastCheckedIn: string;
    employeeId: string;
}
export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    unlockedAt?: string;
    condition: string;
}
export declare const XP_AWARDS: {
    readonly completed_task: 10;
    readonly hit_scorecard_green: 25;
    readonly maintained_streak_7: 50;
    readonly first_tool_use_of_day: 5;
    readonly first_employee_use: 100;
    readonly completed_workflow: 75;
    readonly hit_milestone: 200;
};
export declare function awardXP(event: XPEvent): UserLevel;
export declare function getUserLevel(): UserLevel;
export declare function getStreaks(employeeId?: string): Streak[];
export declare function checkInStreak(streakId: string): Streak;
export declare function createStreak(params: {
    name: string;
    employeeId: string;
}): Streak;
export declare function getRecentXP(limit?: number): {
    action: string;
    xp: number;
    employeeId: string | null;
    createdAt: string;
}[];
//# sourceMappingURL=xp-system.d.ts.map