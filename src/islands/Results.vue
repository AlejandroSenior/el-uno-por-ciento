<script setup lang="ts">
import { computed } from 'vue';
import type { GameState } from '@/types/game';

const props = defineProps<{
  state: GameState;
  playerId: string;
}>();

const winner = computed(() => {
  if (!props.state.winner) return null;
  return props.state.players[props.state.winner] ?? null;
});

const isWinner = computed(() => props.state.winner === props.playerId);

/** Sort: winner first, then by isEliminated (survivors before eliminated) */
const ranking = computed(() => {
  const players = Object.values(props.state.players);
  return players.sort((a, b) => {
    if (a.id === props.state.winner) return -1;
    if (b.id === props.state.winner) return 1;
    if (!a.isEliminated && b.isEliminated) return -1;
    if (a.isEliminated && !b.isEliminated) return 1;
    return 0;
  });
});

const rankClass = (index: number): string => {
  if (index === 0) return 'bg-gold text-bg';
  if (index === 1) return 'bg-silver text-bg';
  if (index === 2) return 'bg-bronze text-white';
  return 'bg-surface2 text-muted';
};
</script>

<template>
  <div class="min-h-dvh flex flex-col items-center justify-center px-4 py-12">
    <!-- Winner celebration -->
    <div class="text-center mb-10">
      <template v-if="winner">
        <p class="text-5xl mb-3">🏆</p>
        <p class="text-muted text-xs tracking-widest uppercase mb-2">Ganador</p>
        <p class="text-4xl font-black mb-1 font-display" :style="{ color: winner.color }">
          {{ winner.name }}
        </p>
        <p v-if="isWinner" class="text-yellow-400 font-black text-xl tracking-wide mt-2 font-display">
          ¡ERES DEL 1%!
        </p>
      </template>
      <template v-else>
        <p class="text-5xl mb-3">🤯</p>
        <p class="text-3xl font-black text-white font-display">ELIMINADOS TODOS</p>
        <p class="text-muted text-sm mt-2">Nadie sobrevivió esta ronda</p>
      </template>
    </div>

    <!-- Ranking -->
    <div class="w-full max-w-sm rounded-2xl p-6 mb-8 bg-surface border border-border">
      <p class="text-muted text-xs tracking-widest uppercase mb-4">Clasificación</p>

      <ol class="flex flex-col gap-3">
        <li v-for="(player, index) in ranking" :key="player.id" class="flex items-center gap-3">
          <!-- Rank number -->
          <span class="w-7 h-7 flex items-center justify-center rounded-full text-xs font-black flex-shrink-0" :class="rankClass(index)">
            {{ index + 1 }}
          </span>

          <!-- Color dot -->
          <span class="w-3 h-3 rounded-full flex-shrink-0" :style="{ background: player.color }"></span>

          <span class="flex-1 font-semibold" :style="{ color: player.isEliminated ? 'var(--color-muted)' : player.color }">
            {{ player.name }}
          </span>

          <!-- Winner badge -->
          <span
            v-if="player.id === state.winner"
            class="text-xs font-bold px-2 py-0.5 rounded-full bg-gold/20 text-gold"
          >
            1%
          </span>

          <!-- You badge -->
          <span v-if="player.id === playerId" class="text-xs text-muted">(tú)</span>
        </li>
      </ol>
    </div>

    <!-- Actions -->
    <div class="flex flex-col gap-3 w-full max-w-sm">
      <a
        href="/"
        class="w-full rounded-xl py-4 text-center font-black text-lg tracking-wide font-display bg-gold text-bg"
      >
        JUGAR DE NUEVO
      </a>
    </div>
  </div>
</template>
