<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import PartySocket from 'partysocket';
import type { GameState, ClientMessage, ServerMessage } from '@/types/game';

import Lobby from '@/islands/Lobby.vue';
import QuestionCard from '@/islands/QuestionCard.vue';
import PlayerList from '@/islands/PlayerList.vue';
import Results from '@/islands/Results.vue';

// ── State ──────────────────────────────────────────────────────────────────

const state = ref<GameState | null>(null);
const playerId = ref<string>('');
const connectionError = ref<string>('');
const roomCode = ref<string>('');

let socket: PartySocket | null = null;

// ── Derived ────────────────────────────────────────────────────────────────

const myPlayer = computed(() => {
  if (!state.value || !playerId.value) return null;
  return state.value.players[playerId.value] ?? null;
});

const totalActivePlayers = computed(() => Object.values(state.value?.players ?? {}).filter((p) => !p.isEliminated).length);

const revealReadyCount = computed(() => {
  if (!state.value) return 0;
  const activeIds = new Set(
    Object.values(state.value.players)
      .filter((p) => !p.isEliminated)
      .map((p) => p.id)
  );
  return state.value.playersReady.filter((id) => activeIds.has(id)).length;
});

const isMeReady = computed(() => state.value?.playersReady.includes(playerId.value) ?? false);

const isHost = computed(() => state.value?.hostId === playerId.value);

const isMeQuestionReady = computed(() => state.value?.playersReadyForQuestion.includes(playerId.value) ?? false);

const questionReadyCount = computed(() => {
  if (!state.value) return 0;
  const activeIds = new Set(
    Object.values(state.value.players)
      .filter((p) => !p.isEliminated)
      .map((p) => p.id)
  );
  return state.value.playersReadyForQuestion.filter((id) => activeIds.has(id)).length;
});

// ── Lifecycle ──────────────────────────────────────────────────────────────

onMounted(() => {
  // Read room code from query string
  const params = new URLSearchParams(window.location.search);
  const code = params.get('c')?.toUpperCase() ?? '';

  if (!code || code.length !== 4) {
    connectionError.value = 'Código de sala inválido. Verifica la URL.';
    return;
  }

  roomCode.value = code;

  // Read player name from localStorage
  const name = localStorage.getItem('playerName') ?? '';
  if (!name) {
    window.location.href = '/';
    return;
  }

  // Connect to PartyKit
  const host = (import.meta.env.PUBLIC_PARTYKIT_HOST as string | undefined) ?? 'localhost:1999';

  socket = new PartySocket({ host, room: code });

  socket.addEventListener('open', () => {
    playerId.value = socket!.id;
    send({ type: 'JOIN', name });
  });

  socket.addEventListener('message', (evt: MessageEvent) => {
    try {
      const msg = JSON.parse(evt.data as string) as ServerMessage;
      if (msg.type === 'STATE_UPDATE') {
        state.value = msg.state;
      } else if (msg.type === 'ERROR') {
        connectionError.value = msg.message;
      }
    } catch {
      /* ignore */
    }
  });

  socket.addEventListener('error', () => {
    connectionError.value = 'No se pudo conectar al servidor. Inténtalo de nuevo.';
  });
});

onUnmounted(() => {
  socket?.close();
});

// ── Send helpers ───────────────────────────────────────────────────────────

const send = (msg: ClientMessage) => {
  socket?.send(JSON.stringify(msg));
};

const sendStartGame = () => {
  send({ type: 'START_GAME' });
};

const sendAnswer = (questionId: string, answerIndex: number) => {
  send({ type: 'ANSWER', questionId, answerIndex });
};

const sendReady = () => {
  send({ type: 'NEXT_ROUND' });
};

const sendQuestionReady = () => {
  send({ type: 'READY' });
};

const sendRestartGame = () => {
  send({ type: 'RESTART_GAME' });
};
</script>

<template>
  <div class="min-h-dvh bg-bg">
    <!-- Connection error -->
    <div v-if="connectionError" class="min-h-dvh flex flex-col items-center justify-center px-4 text-center gap-4">
      <p class="text-red-400 text-xl font-bold">Error de conexión</p>
      <p class="text-muted">{{ connectionError }}</p>
      <a href="/" class="text-yellow-400 font-bold underline">Volver al inicio</a>
    </div>

    <!-- Connecting -->
    <div v-else-if="!state || !playerId" class="min-h-dvh flex items-center justify-center">
      <p class="text-muted animate-pulse">Conectando...</p>
    </div>

    <!-- LOBBY -->
    <Lobby v-else-if="state.phase === 'LOBBY'" :state="state" :playerId="playerId" :roomCode="roomCode" @start="sendStartGame" />

    <!-- COUNTDOWN overlay -->
    <div v-else-if="state.phase === 'COUNTDOWN'" class="min-h-dvh flex flex-col items-center justify-center">
      <p class="text-muted text-sm tracking-widest uppercase mb-4">Preparados...</p>
      <p :key="state.countdown!" class="countdown-number text-9xl font-black text-yellow-400 font-display">
        {{ state.countdown }}
      </p>
    </div>

    <!-- QUESTION / REVEAL / ELIMINATION -->
    <template v-else-if="['QUESTION', 'REVEAL', 'ELIMINATION'].includes(state.phase)">
      <div class="flex flex-col min-h-dvh">
        <QuestionCard
          v-if="state.currentQuestion"
          :question="state.currentQuestion"
          :phase="state.phase"
          :timeRemaining="state.timeRemaining"
          :player="myPlayer"
          :round="state.currentRound"
          :difficulty="state.currentDifficulty"
          :revealCountdown="state.revealCountdown"
          :isReady="isMeReady"
          :readyCount="revealReadyCount"
          :totalActivePlayers="totalActivePlayers"
          :isQuestionReady="isMeQuestionReady"
          :questionReadyCount="questionReadyCount"
          @answer="sendAnswer"
          @ready="sendReady"
          @questionReady="sendQuestionReady"
        />
        <PlayerList :players="state.players" :hostId="state.hostId" :playerId="playerId" />
      </div>
    </template>

    <!-- GAME_OVER -->
    <Results v-else-if="state.phase === 'GAME_OVER'" :state="state" :playerId="playerId" :isHost="isHost" @restart="sendRestartGame" />
  </div>
</template>
