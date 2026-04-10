// ─── Dificultad y fases ────────────────────────────────────────────────────

export type Difficulty = 90 | 80 | 70 | 60 | 50 | 40 | 30 | 20 | 10 | 1;

export type GamePhase =
  | 'LOBBY'
  | 'COUNTDOWN'
  | 'QUESTION'
  | 'REVEAL'
  | 'ELIMINATION'
  | 'GAME_OVER';

// ─── Pregunta ───────────────────────────────────────────────────────────────

export type AnswerType = 'multiple-choice' | 'text';

export interface QuestionImage {
  src: string;   // e.g. '/images/questions/q041.svg'
  alt: string;   // texto alternativo sin revelar la respuesta
}

export interface Question {
  id: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  difficulty: Difficulty;
  timeLimit: number;       // segundos (ya incluye el extra por imagen)
  explanation: string;
  image?: QuestionImage;
  answerType?: AnswerType;  // 'multiple-choice' (default) o 'text'
}

// ─── Jugador ────────────────────────────────────────────────────────────────

export interface Player {
  id: string;
  name: string;
  color: string;                  // color hex asignado al unirse
  isEliminated: boolean;
  hasAnswered: boolean;
  lastAnswerIndex: number | null;
  isCorrect: boolean | null;
}

// ─── Estado del juego ───────────────────────────────────────────────────────

export interface GameState {
  phase: GamePhase;
  players: Record<string, Player>;
  currentRound: number;           // 1-10
  currentDifficulty: Difficulty;
  currentQuestion: Question | null;
  timeRemaining: number;
  usedQuestionIds: string[];
  hostId: string;
  countdown: number | null;       // 3, 2, 1 antes de la pregunta
  winner: string | null;          // player id del ganador
  revealCountdown: number | null; // 30s countdown during REVEAL phase
  playersReady: string[];         // player ids who clicked "siguiente"
}

// ─── Mensajes Cliente → Servidor ───────────────────────────────────────────

export type ClientMessage =
  | { type: 'JOIN'; name: string }
  | { type: 'START_GAME' }
  | { type: 'ANSWER'; questionId: string; answerIndex: number }
  | { type: 'NEXT_ROUND' };       // cualquier jugador (siguiente pregunta)

// ─── Mensajes Servidor → Cliente ───────────────────────────────────────────

export type ServerMessage =
  | { type: 'STATE_UPDATE'; state: GameState }
  | { type: 'ERROR'; message: string };

// ─── Utilidades ─────────────────────────────────────────────────────────────

export const DIFFICULTIES: Difficulty[] = [90, 80, 70, 60, 50, 40, 30, 20, 10, 1];

export const PLAYER_COLORS = [
  '#FF6B6B', // rojo coral
  '#4ECDC4', // turquesa
  '#FFD93D', // amarillo
  '#6BCB77', // verde
  '#4D96FF', // azul
  '#FF6FC8', // rosa
];

export const TIME_LIMITS: Record<Difficulty, { text: number; withImage: number }> = {
  90: { text: 20, withImage: 30 },
  80: { text: 25, withImage: 35 },
  70: { text: 30, withImage: 40 },
  60: { text: 30, withImage: 40 },
  50: { text: 35, withImage: 50 },
  40: { text: 35, withImage: 50 },
  30: { text: 40, withImage: 55 },
  20: { text: 40, withImage: 55 },
  10: { text: 45, withImage: 60 },
  1:  { text: 60, withImage: 75 },
};
