export type Scene =
    | "login"
    | "town"
    | "guild-interior"
    | "quest-board"
    | "submission";

export interface UserData {
    userId: string;
    displayName: string;
    email: string;
    rank: number;
    totalExp: number;
    completedQuests: CompletedQuest[];
}

export interface CompletedQuest {
    questId: string;
    score: number;
    expEarned: number;
    submittedAt: unknown;
}

export interface Quest {
    id: string;
    title: string;
    description: string;
    difficulty: number; // 1-5
    requiredRank: number; // 1-5
    expReward: number;
    evaluationCriteria: string;
}

export interface EvalResult {
    score: number;
    feedback: string;
    flags: string[];
    expEarned: number;
    accepted: boolean;
    newTotalExp: number;
    newRank: number;
}

export const RANK_NAMES: Record<number, string> = {
    1: "Novice",
    2: "Apprentice",
    3: "Journeyman",
    4: "Adept",
    5: "Master",
};

export const RANK_EXP: Record<number, number> = {
    1: 0,
    2: 200,
    3: 500,
    4: 1000,
    5: 2000,
};

export const MAX_RANK = 5;
