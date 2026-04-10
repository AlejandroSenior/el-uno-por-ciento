<script setup lang="ts">
import { ref, computed } from 'vue';
import type { GameState } from '@/types/game';

const props = defineProps<{
  state: GameState;
  playerId: string;
  roomCode: string;
}>();

defineEmits<{ (e: 'start'): void }>();

const copied = ref(false);

const playerList = computed(() => Object.values(props.state.players));
const playerCount = computed(() => playerList.value.length);
const emptySlots = computed(() => Math.max(0, 2 - playerCount.value));
const isHost = computed(() => props.playerId === props.state.hostId);
const hostId = computed(() => props.state.hostId);

const copyCode = async () => {
  const url = window.location.href;
  try {
    await navigator.clipboard.writeText(url);
  } catch {
    // fallback: copy just the code
    await navigator.clipboard.writeText(props.roomCode);
  }
  copied.value = true;
  setTimeout(() => {
    copied.value = false;
  }, 2_000);
};
</script>

<template>
  <div class="min-h-dvh flex flex-col items-center justify-center px-4 py-12">
    <!-- Header -->
    <div class="text-center mb-10">
      <p class="text-muted text-xs tracking-widest uppercase mb-1">Sala de espera</p>
      <h2 class="text-5xl font-black text-white font-display">EL 1%</h2>
    </div>

    <!-- Room code -->
    <div
      class="rounded-2xl px-8 py-5 text-center mb-8 cursor-pointer select-none transition-all hover:scale-105 bg-surface border border-border"
      @click="copyCode"
    >
      <p class="text-muted text-xs tracking-widest uppercase mb-1">Código de sala</p>
      <p class="text-5xl font-black tracking-[0.2em] text-yellow-400 font-display">
        {{ roomCode }}
      </p>
      <p class="text-muted text-xs mt-1">
        {{ copied ? '¡Enlace copiado!' : 'Toca para copiar' }}
      </p>
    </div>

    <!-- Players list -->
    <div class="w-full max-w-sm rounded-2xl p-6 mb-8 bg-surface border border-border">
      <p class="text-muted text-xs tracking-widest uppercase mb-4">Jugadores ({{ playerCount }}/6)</p>

      <ul class="flex flex-col gap-3">
        <li v-for="player in playerList" :key="player.id" class="flex items-center gap-3">
          <span class="w-3 h-3 rounded-full shrink-0" :style="{ background: player.color }"></span>
          <span class="text-white font-semibold flex-1">{{ player.name }}</span>
          <span v-if="player.id === hostId" class="text-xs font-bold px-2 py-0.5 rounded-full bg-gold-dim text-gold">HOST</span>
          <span v-if="player.id === playerId" class="text-xs text-muted">(tú)</span>
        </li>
      </ul>

      <!-- Empty slots -->
      <ul class="flex flex-col gap-3 mt-3" v-if="playerCount < 6">
        <li v-for="i in emptySlots" :key="'empty-' + i" class="flex items-center gap-3 opacity-25">
          <span class="w-3 h-3 rounded-full shrink-0 bg-border"></span>
          <span class="text-muted text-sm">Esperando jugador...</span>
        </li>
      </ul>
    </div>

    <!-- Start button (host only) -->
    <div class="w-full max-w-sm">
      <template v-if="isHost">
        <button
          :disabled="playerCount < 2"
          class="w-full rounded-xl py-4 font-black text-xl tracking-widest transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed font-display bg-gold text-bg"
          @click="$emit('start')"
        >
          {{ playerCount < 2 ? 'ESPERANDO JUGADORES...' : '¡COMENZAR!' }}
        </button>
        <p v-if="playerCount < 2" class="text-muted text-xs text-center mt-2">Se necesitan al menos 2 jugadores</p>
      </template>

      <div v-else class="w-full rounded-xl py-4 text-center font-bold tracking-wide opacity-60 bg-surface border border-border text-muted">
        Esperando al host...
      </div>
    </div>
  </div>
</template>
