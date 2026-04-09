<template>
  <div class="min-h-dvh" style="background: var(--color-bg)">

    <!-- Connection error -->
    <div
      v-if="connectionError"
      class="min-h-dvh flex flex-col items-center justify-center px-4 text-center gap-4"
    >
      <p class="text-red-400 text-xl font-bold">Error de conexión</p>
      <p class="text-[var(--color-muted)]">{{ connectionError }}</p>
      <a href="/" class="text-yellow-400 font-bold underline">Volver al inicio</a>
    </div>

    <!-- Connecting -->
    <div
      v-else-if="!state || !playerId"
      class="min-h-dvh flex items-center justify-center"
    >
      <p class="text-[var(--color-muted)] animate-pulse">Conectando...</p>
    </div>

    <!-- LOBBY -->
    <Lobby
      v-else-if="state.phase === 'LOBBY'"
      :state="state"
      :playerId="playerId"
      :roomCode="roomCode"
      @start="sendStartGame"
    />

    <!-- COUNTDOWN overlay -->
    <div
      v-else-if="state.phase === 'COUNTDOWN'"
      class="min-h-dvh flex flex-col items-center justify-center"
    >
      <p class="text-[var(--color-muted)] text-sm tracking-widest uppercase mb-4">Preparados...</p>
      <p
        :key="state.countdown"
        class="countdown-number text-9xl font-black text-yellow-400"
        style="font-family: var(--font-display)"
      >
        {{ state.countdown }}
      </p>
    </div>

    <!-- QUESTION / REVEAL / ELIMINATION -->
    <template v-else-if="['QUESTION','REVEAL','ELIMINATION'].includes(state.phase)">
      <div class="flex flex-col min-h-dvh">
        <QuestionCard
          v-if="state.currentQuestion"
          :question="state.currentQuestion"
          :phase="state.phase"
          :timeRemaining="state.timeRemaining"
          :player="myPlayer"
          :round="state.currentRound"
          :difficulty="state.currentDifficulty"
          @answer="sendAnswer"
        />
        <PlayerList
          :players="state.players"
          :hostId="state.hostId"
          :playerId="playerId"
        />
      </div>
    </template>

    <!-- GAME_OVER -->
    <Results
      v-else-if="state.phase === 'GAME_OVER'"
      :state="state"
      :playerId="playerId"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import PartySocket from 'partysocket';
import type { GameState, ClientMessage, ServerMessage } from '../types/game';

import Lobby from './Lobby.vue';
import QuestionCard from './QuestionCard.vue';
import PlayerList from './PlayerList.vue';
import Results from './Results.vue';

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
    } catch { /* ignore */ }
  });

  socket.addEventListener('error', () => {
    connectionError.value = 'No se pudo conectar al servidor. Inténtalo de nuevo.';
  });
});

onUnmounted(() => {
  socket?.close();
});

// ── Send helpers ───────────────────────────────────────────────────────────

function send(msg: ClientMessage) {
  socket?.send(JSON.stringify(msg));
}

function sendStartGame() {
  send({ type: 'START_GAME' });
}

function sendAnswer(questionId: string, answerIndex: number) {
  send({ type: 'ANSWER', questionId, answerIndex });
}
</script>
