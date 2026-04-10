export interface AchievementDefinition {
    id: string;
    name: string;
    description: string;
    icon: string;
    condition: string;
}
export interface UnlockedAchievement extends AchievementDefinition {
    unlockedAt?: string;
}
export declare const ACHIEVEMENTS: readonly AchievementDefinition[];
export declare function getAchievements(): UnlockedAchievement[];
export declare function unlockAchievement(achievementId: string): UnlockedAchievement | null;
export declare function checkAchievements(): UnlockedAchievement[];
//# sourceMappingURL=achievements.d.ts.map