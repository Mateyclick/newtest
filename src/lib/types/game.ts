// src/lib/types/game.ts

// Interfaz para definir cada línea de solución que el administrador configura
export interface SolutionLine {
  id: string;          // Identificador único para la línea (ej: 'main', 'alt1', o un nanoid)
  moves: string;       // Movimientos en formato SAN: "e4 e5 Nf3 Nc6"
  points: number;      // Puntos para esta línea específica
  label: string;       // Etiqueta para la UI (ej: "Línea Principal", "Línea Secundaria")
}

// Define la estructura de un puzzle tal como lo configura el administrador
// y como se espera que lo envíe al servidor.
export interface AdminPuzzleConfiguration {
  position: string;                 // Posición FEN del tablero
  solutionLines: SolutionLine[];    // Array de líneas de solución (1 a 3 líneas)
  timer: number;                    // Tiempo en segundos para resolver el puzzle
}

// Define cómo se ve un jugador en el contexto del juego y el leaderboard
export interface Player {
  id: string;                       // ID de Supabase del usuario
  nickname: string;
  score: number;
  puzzlesSolved?: number;           // Opcional: conteo de puzzles resueltos
  puzzlesAttempted?: number;        // Opcional: conteo de puzzles intentados
  // Podríamos añadir más estadísticas aquí si el servidor las proporciona
}

// Define los detalles del resultado de un jugador para un puzzle específico
// Esto es lo que se usaría en la vista de resultados.
export interface PlayerPuzzleResultDetail {
  nickname: string;
  wasAttempted: boolean;
  wasSolved: boolean;             // ¿Completó alguna línea con éxito?
  wasFailed: boolean;             // ¿Falló todas las líneas o se rindió/expiró el tiempo?
  timeSpent: number | null;
  pointsEarned: number;
  completedLineId?: string;      // Opcional: El ID de la línea que completó
  // currentSolutionStep podría ser más complejo si queremos mostrar el progreso exacto en la línea.
  // Por ahora, lo mantenemos simple. El servidor lo usa internamente.
}


// ATENCIÓN: La siguiente interfaz 'PuzzleState' es la que tenías originalmente.
// La he comentado porque `AdminPuzzleConfiguration` ahora define la estructura
// que usa el Admin para configurar. Si `PuzzleState` se usa en otras partes
// del frontend (por ejemplo, en `useGameSession` para lo que el *jugador* recibe del servidor),
// necesitará ser ajustada o coexistir.
// El servidor, al emitir 'puzzle_launched' al jugador, NO envía las 'solutionLines'.
// Envía 'position', 'timer', 'puzzleNumber', 'totalPuzzles', y quizás 'points' (como los puntos máximos o de la línea principal).

/*
export interface PuzzleState { // Considera si esta interfaz sigue siendo necesaria tal cual o si se adapta.
  position: string;
  mainLine?: string; // Obsoleto si usamos solutionLines
  timer: number;
  points: number;   // Obsoleto si usamos solutionLines y puntos por línea
  puzzleNumber?: number;
  totalPuzzles?: number;
  hasMultipleSolutions?: boolean; // El servidor podría añadir esto al payload de 'puzzle_launched'
}
*/

// Para el hook useGameSession, el estado del puzzle actual que recibe el jugador podría ser:
export interface PlayerCurrentPuzzle {
    position: string;
    timer: number; // Podría ser el tiempo total asignado o el tiempo restante
    points: number; // Puntos máximos o de la línea principal (para mostrar en UI)
    puzzleNumber?: number;
    totalPuzzles?: number;
    hasMultipleSolutions?: boolean; // Indicador visual para el jugador
}


// Y la data para el AdminView (el array de puzzles que configura)
// sería un array de AdminPuzzleConfiguration:
// en AdminView.tsx: const [puzzlesConfig, setPuzzlesConfig] = useState<AdminPuzzleConfiguration[]>([]);