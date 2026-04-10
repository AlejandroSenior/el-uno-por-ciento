import type * as Party from 'partykit/server';
import type { GameState, Player, Question, Difficulty, ClientMessage, ServerMessage } from '@/types/game';
import { DIFFICULTIES, PLAYER_COLORS } from '@/types/game';
import rawQuestions from '@/data/questions.json';

const questions = rawQuestions as Question[];

// ─── Constants ───────────────────────────────────────────────────────────────

const MAX_PLAYERS = 6;
const MIN_PLAYERS_TO_START = 2;
const COUNTDOWN_FROM = 3;
const REVEAL_COUNTDOWN_FROM = 30;
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
  winner: null,
  revealCountdown: null,
  playersReady: []
});

// ─── GameServer ───────────────────────────────────────────────────────────────

export default class GameServer implements Party.Server {
  private state: GameState;
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private revealTimerInterval: ReturnType<typeof setInterval> | null = null;

  constructor(readonly room: Party.Room) {
    this.state = initialState();
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  onConnect = (conn: Party.Connection) => {
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
    const remaining = this.activePlayers();
    if (remaining.length === 0 && this.state.phase !== 'LOBBY') {
      this.clearTimer();
      this.clearRevealTimer();
      this.state = initialState();
      this.broadcast();
      return;
    }

    // A disconnect during REVEAL might be the last needed player — re-check
    if (this.state.phase === 'REVEAL') {
      const active = this.activePlayers();
      if (active.length > 0 && active.every((p) => this.state.playersReady.includes(p.id))) {
        this.clearRevealTimer();
        this.runElimination();
        return;
      }
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
      case 'NEXT_ROUND':
        return this.handleNextRound(sender);
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

    // Allow changing answer while the question timer is still running
    const correct = answerIndex === this.state.currentQuestion!.correctIndex;
    player.hasAnswered = true;
    player.lastAnswerIndex = answerIndex;
    player.isCorrect = correct;

    this.broadcast();
  };

  private handleNextRound = (conn: Party.Connection) => {
    if (this.state.phase !== 'REVEAL') return;

    // Idempotent: record this player as ready
    if (!this.state.playersReady.includes(conn.id)) {
      this.state.playersReady.push(conn.id);
    }

    // If all active (non-eliminated) players are ready, advance immediately
    const active = this.activePlayers();
    const allReady = active.every((p) => this.state.playersReady.includes(p.id));
    if (allReady) {
      this.clearRevealTimer();
      this.runElimination();
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
      this.advanceRound();
      return;
    }

    this.state.usedQuestionIds.push(q.id);
    this.state.currentQuestion = q;
    this.state.phase = 'QUESTION';
    this.state.countdown = null;
    this.state.timeRemaining = q.timeLimit;
    this.state.revealCountdown = null;
    this.state.playersReady = [];

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
    this.startRevealCountdown();
  };

  private startRevealCountdown = () => {
    this.clearRevealTimer();
    this.state.revealCountdown = REVEAL_COUNTDOWN_FROM;
    this.broadcast();

    this.revealTimerInterval = setInterval(() => {
      this.state.revealCountdown = (this.state.revealCountdown ?? 1) - 1;

      if ((this.state.revealCountdown ?? 0) <= 0) {
        this.clearRevealTimer();
        if (this.state.phase === 'REVEAL') {
          this.runElimination();
        }
      } else {
        this.broadcast();
      }
    }, 1_000);
  };

  private runElimination = () => {
    this.state.phase = 'ELIMINATION';
    this.state.revealCountdown = null;

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
    const survivors = this.activePlayers();

    if (survivors.length === 0) {
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

    if (this.state.currentDifficulty === 1) {
      this.state.phase = 'GAME_OVER';
      this.state.winner = survivors[0].id;
      this.broadcast();
      return;
    }

    this.advanceRound();
  };

  private advanceRound = () => {
    const roundIndex = this.state.currentRound;
    if (roundIndex >= DIFFICULTIES.length) {
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

  private clearRevealTimer = () => {
    if (this.revealTimerInterval !== null) {
      clearInterval(this.revealTimerInterval);
      this.revealTimerInterval = null;
    }
  };
}
