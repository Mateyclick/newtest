
// Player Result Types
export interface PlayerResultDetail {
  nickname: string;
  wasAttempted: boolean;
  wasSolved: boolean;
  wasFailed: boolean;
  timeSpent: number | null;
  pointsEarned: number;
  currentSolutionStep: number;
}

export interface Player {
  id: string;
  nickname: string;
  score: number;
}

export interface PuzzleState {
  position: string;
  mainLine?: string;
  timer: number;
  points: number;
  puzzleNumber?: number;
  totalPuzzles?: number;
}
