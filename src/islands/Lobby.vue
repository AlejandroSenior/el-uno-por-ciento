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

  await navigator.clipboard.writeText(props.roomCode);

  copied.value = true;
  setTimeout(() => {
    copied.value = false;
  }, 2_000);
};
</script>

<template>
  <div class="min-h-dvh flex flex-col items-center justify-center px-4 py-10">
    <!-- Header -->
    <div class="text-center mb-8">
      <p class="text-muted text-[10px] tracking-[0.4em] uppercase mb-2">Sala de espera</p>
      <h2 class="text-5xl font-black text-white font-display">EL 1%</h2>
    </div>

    <!-- Room code card -->
    <div
      class="rounded-2xl px-8 py-6 text-center mb-6 cursor-pointer select-none transition-all duration-150 active:scale-[0.97] hover:border-gold/50 bg-surface border border-border"
      style="box-shadow: 0 0 0 0 rgba(251, 191, 36, 0)"
      :style="copied ? 'box-shadow: 0 0 24px rgba(251,191,36,0.25)' : ''"
      @click="copyCode"
    >
      <p class="text-muted text-[10px] tracking-[0.4em] uppercase mb-2">Código de sala</p>
      <p class="text-5xl font-black tracking-[0.25em] text-gold font-display">
        {{ roomCode }}
      </p>
      <p class="text-muted text-xs mt-2 transition-colors" :class="copied ? 'text-gold' : ''">
        {{ copied ? '¡Enlace copiado!' : 'Toca para copiar' }}
      </p>
    </div>

    <!-- Players list -->
    <div class="w-full max-w-sm rounded-2xl p-6 mb-6 bg-surface border border-border">
      <p class="text-muted text-[10px] tracking-[0.3em] uppercase mb-4">
        Jugadores
        <span class="text-gold font-black">{{ playerCount }}</span>
        <span class="opacity-40">/6</span>
      </p>

      <ul class="flex flex-col gap-3">
        <li v-for="player in playerList" :key="player.id" class="flex items-center gap-3">
          <span class="w-2.5 h-2.5 rounded-full shrink-0" :style="{ background: player.color }"></span>
          <span class="text-white font-semibold flex-1 text-sm">{{ player.name }}</span>
          <span v-if="player.id === hostId" class="text-[10px] font-black px-2 py-0.5 rounded-full bg-gold-dim text-gold tracking-widest">
            HOST
          </span>
          <span v-if="player.id === playerId" class="text-[10px] text-muted">(tú)</span>
        </li>
      </ul>

      <!-- Empty slots (only when below minimum) -->
      <ul class="flex flex-col gap-3 mt-3" v-if="emptySlots > 0">
        <li v-for="i in emptySlots" :key="'empty-' + i" class="flex items-center gap-3 opacity-30">
          <span class="w-2.5 h-2.5 rounded-full shrink-0 bg-border"></span>
          <span class="text-muted text-sm">Esperando jugador...</span>
          <span class="ml-auto w-1.5 h-1.5 rounded-full bg-muted/40 animate-pulse"></span>
        </li>
      </ul>
    </div>

    <!-- Start button (host only) -->
    <div class="w-full max-w-sm">
      <template v-if="isHost">
        <button
          :disabled="playerCount < 2"
          class="w-full rounded-xl py-4 font-black text-xl tracking-widest transition-all duration-150 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 font-display bg-gold text-bg"
          @click="$emit('start')"
        >
          {{ playerCount < 2 ? 'ESPERANDO JUGADORES...' : '¡COMENZAR!' }}
        </button>
        <p v-if="playerCount < 2" class="text-muted text-[10px] text-center mt-2 tracking-wide">Se necesitan al menos 2 jugadores</p>
      </template>

      <div
        v-else
        class="w-full rounded-xl py-4 text-center text-sm font-semibold tracking-widest opacity-50 bg-surface border border-border text-muted"
      >
        Esperando al host...
      </div>
    </div>
  </div>
</template>
