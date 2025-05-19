
// Importar Ranking desde resultados
import { Ranking } from "./results";

// Interfaces principales
export interface ChessEvent {
  id: number;
  title: string;
  date: Date;
  description: string;
  priceSocios: string;
  priceNoSocios: string;
  whatsapp: string;
  time: string;
  isRecurring?: boolean;
  eventType?: 'blitz' | 'rapid' | 'standard' | 'activity';
}

export interface Tournament {
  id: number;
  title: string; 
  date: Date;
  description: string;
  matches: Round[];
  rankings: Ranking[]; // Usa el tipo importado
}

// Interfaces anidadas
export interface Round {
  round: number;
  date: Date;
  time: string;
  matches: Match[];
}

export interface Match {
  id: number;
  whitePlayer: string;
  whiteElo?: number;
  blackPlayer: string;
  blackElo?: number;
  result: '1-0' | '0-1' | '½-½' | '*';
  pgn?: string;
}
