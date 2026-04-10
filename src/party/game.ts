import type * as Party from 'partykit/server';
import type { GameState, Player, Question, Difficulty, ClientMessage, ServerMessage } from '@/types/game';
import { DIFFICULTIES, PLAYER_COLORS } from '@/types/game';
import rawQuestions from '@/data/questions.json';

const questions = rawQuestions as Question[];

// ─── Constants ───────────────────────────────────────────────────────────────

const MAX_PLAYERS = 6;
const MIN_PLAYERS_TO_START = 2;
const COUNTDOWN_FROM = 3;
const REVEAL_DURATION = 4_000;
const ELIMINATION_DURATION = 3_000;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const pickQuestion = (difficulty: Difficulty, usedIds: string[]): Question | null => {
  const pool = questions.filter((q) => q.difficulty === difficulty && !usedIds.includes(q.id));
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
};

const initialState = (): GameState => ({
  phase: 'LOBBY',
  players: {},
  currentRound: 0,
  currentDifficulty: 90,
  currentQuestion: null,
  timeRemaining: 0,
  usedQuestionIds: [],
  hostId: '',
  countdown: null,
  winner: null
});

// ─── GameServer ───────────────────────────────────────────────────────────────

export default class GameServer implements Party.Server {
  private state: GameState;
  private timerInterval: ReturnType<typeof setInterval> | null = null;

  constructor(readonly room: Party.Room) {
    this.state = initialState();
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  onConnect = (conn: Party.Connection) => {
    // Send current state immediately so the joining client can render
    this.sendTo(conn, { type: 'STATE_UPDATE', state: this.state });
  };

  onClose = (conn: Party.Connection) => {
    const player = this.state.players[conn.id];
    if (!player) return;

    delete this.state.players[conn.id];

    // Re-assign host if needed
    if (this.state.hostId === conn.id) {
      const remaining = Object.keys(this.state.players);
      this.state.hostId = remaining[0] ?? '';
    }

    // If everyone left during a game, reset
    const activePlayers = this.activePlayers();
    if (activePlayers.length === 0 && this.state.phase !== 'LOBBY') {
      this.clearTimer();
      this.state = initialState();
    }

    this.broadcast();
  };

  onMessage = (message: string, sender: Party.Connection) => {
    let msg: ClientMessage;
    try {
      msg = JSON.parse(message) as ClientMessage;
    } catch {
      return;
    }

    switch (msg.type) {
      case 'JOIN':
        return this.handleJoin(sender, msg.name);
      case 'START_GAME':
        return this.handleStartGame(sender);
      case 'ANSWER':
        return this.handleAnswer(sender, msg.questionId, msg.answerIndex);
    }
  };

  // ── Message handlers ───────────────────────────────────────────────────────

  private handleJoin = (conn: Party.Connection, name: string) => {
    if (this.state.phase !== 'LOBBY') {
      this.sendTo(conn, { type: 'ERROR', message: 'La partida ya ha comenzado.' });
      return;
    }

    const playerCount = Object.keys(this.state.players).length;
    if (playerCount >= MAX_PLAYERS) {
      this.sendTo(conn, { type: 'ERROR', message: 'La sala está llena (máximo 6 jugadores).' });
      return;
    }

    // Assign color: pick first not yet taken
    const usedColors = Object.values(this.state.players).map((p) => p.color);
    const color = PLAYER_COLORS.find((c) => !usedColors.includes(c)) ?? PLAYER_COLORS[0];

    const player: Player = {
      id: conn.id,
      name: name.trim().slice(0, 20) || 'Anónimo',
      color,
      isEliminated: false,
      hasAnswered: false,
      lastAnswerIndex: null,
      isCorrect: null
    };

    this.state.players[conn.id] = player;

    if (!this.state.hostId) {
      this.state.hostId = conn.id;
    }

    this.broadcast();
  };

  private handleStartGame = (conn: Party.Connection) => {
    if (this.state.hostId !== conn.id) return;
    if (this.state.phase !== 'LOBBY') return;

    const playerCount = Object.keys(this.state.players).length;
    if (playerCount < MIN_PLAYERS_TO_START) {
      this.sendTo(conn, {
        type: 'ERROR',
        message: `Se necesitan al menos ${MIN_PLAYERS_TO_START} jugadores para empezar.`
      });
      return;
    }

    this.startCountdown();
  };

  private handleAnswer = (conn: Party.Connection, questionId: string, answerIndex: number) => {
    const player = this.state.players[conn.id];
    if (!player || player.isEliminated) return;
    if (this.state.phase !== 'QUESTION') return;
    if (this.state.currentQuestion?.id !== questionId) return;
    if (player.hasAnswered) return;

    const correct = answerIndex === this.state.currentQuestion!.correctIndex;
    player.hasAnswered = true;
    player.lastAnswerIndex = answerIndex;
    player.isCorrect = correct;

    // If all active players have answered, fast-forward
    const active = this.activePlayers();
    const allAnswered = active.every((p) => p.hasAnswered);
    if (allAnswered) {
      this.endQuestion();
    } else {
      this.broadcast();
    }
  };

  // ── Game flow ──────────────────────────────────────────────────────────────

  private startCountdown = () => {
    this.state.phase = 'COUNTDOWN';
    this.state.currentRound = 1;
    this.state.currentDifficulty = DIFFICULTIES[0]; // 90
    this.state.usedQuestionIds = [];
    this.state.winner = null;

    // Reset all players
    for (const p of Object.values(this.state.players)) {
      p.isEliminated = false;
      p.hasAnswered = false;
      p.lastAnswerIndex = null;
      p.isCorrect = null;
    }

    this.state.countdown = COUNTDOWN_FROM;
    this.broadcast();

    const tick = () => {
      this.state.countdown = (this.state.countdown ?? 1) - 1;
      this.broadcast();

      if (this.state.countdown <= 0) {
        this.startQuestion();
      } else {
        setTimeout(tick, 1_000);
      }
    };

    setTimeout(tick, 1_000);
  };

  private startQuestion = () => {
    const q = pickQuestion(this.state.currentDifficulty, this.state.usedQuestionIds);
    if (!q) {
      // No questions left for this level — advance anyway
      this.advanceRound();
      return;
    }

    this.state.usedQuestionIds.push(q.id);
    this.state.currentQuestion = q;
    this.state.phase = 'QUESTION';
    this.state.countdown = null;
    this.state.timeRemaining = q.timeLimit;

    // Reset per-question player state
    for (const p of Object.values(this.state.players)) {
      p.hasAnswered = false;
      p.lastAnswerIndex = null;
      p.isCorrect = null;
    }

    this.broadcast();
    this.startTimer();
  };

  private startTimer = () => {
    this.clearTimer();
    this.timerInterval = setInterval(() => {
      this.state.timeRemaining -= 1;
      if (this.state.timeRemaining <= 0) {
        this.endQuestion();
      } else {
        this.broadcast();
      }
    }, 1_000);
  };

  private endQuestion = () => {
    this.clearTimer();
    this.state.phase = 'REVEAL';
    this.broadcast();

    setTimeout(() => {
      this.runElimination();
    }, REVEAL_DURATION);
  };

  private runElimination = () => {
    this.state.phase = 'ELIMINATION';

    // Mark incorrect (or non-answering) active players as eliminated
    for (const p of this.activePlayers()) {
      if (!p.isCorrect) {
        p.isEliminated = true;
      }
    }

    this.broadcast();

    setTimeout(() => {
      this.afterElimination();
    }, ELIMINATION_DURATION);
  };

  private afterElimination = () => {
    const survivors = this.activePlayers(); // re-check after elimination

    if (survivors.length === 0) {
      // Everyone eliminated simultaneously — declare no winner, game over
      this.state.phase = 'GAME_OVER';
      this.state.winner = null;
      this.broadcast();
      return;
    }

    if (survivors.length === 1) {
      this.state.phase = 'GAME_OVER';
      this.state.winner = survivors[0].id;
      this.broadcast();
      return;
    }

    // Was this the last round (difficulty = 1)?
    if (this.state.currentDifficulty === 1) {
      // Everyone who survived the 1% question wins — last survivor already guaranteed above,
      // but if multiple survive, they all won — pick the first for simplicity
      this.state.phase = 'GAME_OVER';
      this.state.winner = survivors[0].id;
      this.broadcast();
      return;
    }

    // Advance to next round
    this.advanceRound();
  };

  private advanceRound = () => {
    const roundIndex = this.state.currentRound; // next index (currentRound is 1-based)
    if (roundIndex >= DIFFICULTIES.length) {
      // Shouldn't happen but safeguard
      this.state.phase = 'GAME_OVER';
      this.broadcast();
      return;
    }

    this.state.currentRound += 1;
    this.state.currentDifficulty = DIFFICULTIES[roundIndex];
    this.state.currentQuestion = null;

    this.startQuestion();
  };

  // ── Utilities ──────────────────────────────────────────────────────────────

  /** Players who are not eliminated */
  private activePlayers = (): Player[] => {
    return Object.values(this.state.players).filter((p) => !p.isEliminated);
  };

  private broadcast = () => {
    const msg = JSON.stringify({ type: 'STATE_UPDATE', state: this.state } satisfies ServerMessage);
    this.room.broadcast(msg);
  };

  private sendTo = (conn: Party.Connection, msg: ServerMessage) => {
    conn.send(JSON.stringify(msg));
  };

  private clearTimer = () => {
    if (this.timerInterval !== null) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  };
}
