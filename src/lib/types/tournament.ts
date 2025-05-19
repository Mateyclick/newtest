
export interface Match {
  id: number;
  whitePlayer: string;
  blackPlayer: string;
  result: string;
}

export interface Round {
  round: number;
  matches: Match[];
}

export interface Ranking {
  position: number;
  player: string;
  points: number;
}

export interface Tournament {
  id: number;
  title: string;
  date: Date;
  description: string;
  matches: Round[];
  rankings: Ranking[];
  pgnLink?: string; // Nueva propiedad opcional
}
