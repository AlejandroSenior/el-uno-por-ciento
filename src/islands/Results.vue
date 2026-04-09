<template>
  <div class="min-h-dvh flex flex-col items-center justify-center px-4 py-12">

    <!-- Winner celebration -->
    <div class="text-center mb-10">
      <template v-if="winner">
        <p class="text-5xl mb-3">🏆</p>
        <p class="text-[var(--color-muted)] text-xs tracking-widest uppercase mb-2">Ganador</p>
        <p
          class="text-4xl font-black mb-1"
          :style="{ color: winner.color, fontFamily: 'var(--font-display)' }"
        >
          {{ winner.name }}
        </p>
        <p
          v-if="isWinner"
          class="text-yellow-400 font-black text-xl tracking-wide mt-2"
          style="font-family: var(--font-display)"
        >
          ¡ERES DEL 1%!
        </p>
      </template>
      <template v-else>
        <p class="text-5xl mb-3">🤯</p>
        <p
          class="text-3xl font-black text-white"
          style="font-family: var(--font-display)"
        >
          ELIMINADOS TODOS
        </p>
        <p class="text-[var(--color-muted)] text-sm mt-2">Nadie sobrevivió esta ronda</p>
      </template>
    </div>

    <!-- Ranking -->
    <div
      class="w-full max-w-sm rounded-2xl p-6 mb-8"
      style="background: var(--color-surface); border: 1px solid var(--color-border)"
    >
      <p class="text-[var(--color-muted)] text-xs tracking-widest uppercase mb-4">Clasificación</p>

      <ol class="flex flex-col gap-3">
        <li
          v-for="(player, index) in ranking"
          :key="player.id"
          class="flex items-center gap-3"
        >
          <!-- Rank number -->
          <span
            class="w-7 h-7 flex items-center justify-center rounded-full text-xs font-black flex-shrink-0"
            :style="rankStyle(index)"
          >
            {{ index + 1 }}
          </span>

          <!-- Color dot -->
          <span
            class="w-3 h-3 rounded-full flex-shrink-0"
            :style="{ background: player.color }"
          ></span>

          <span
            class="flex-1 font-semibold"
            :style="{ color: player.isEliminated ? 'var(--color-muted)' : player.color }"
          >
            {{ player.name }}
          </span>

          <!-- Winner badge -->
          <span
            v-if="player.id === state.winner"
            class="text-xs font-bold px-2 py-0.5 rounded-full"
            style="background: rgba(251,191,36,0.2); color: var(--color-gold)"
          >
            1%
          </span>

          <!-- You badge -->
          <span
            v-if="player.id === playerId"
            class="text-xs text-[var(--color-muted)]"
          >(tú)</span>
        </li>
      </ol>
    </div>

    <!-- Actions -->
    <div class="flex flex-col gap-3 w-full max-w-sm">
      <a
        href="/"
        class="w-full rounded-xl py-4 text-center font-black text-lg tracking-wide"
        style="font-family: var(--font-display); background: var(--color-gold); color: #0a0a0f"
      >
        JUGAR DE NUEVO
      </a>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { GameState } from '../types/game';

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

function rankStyle(index: number): Record<string, string> {
  if (index === 0) return { background: 'var(--color-gold)', color: '#0a0a0f' };
  if (index === 1) return { background: '#c0c0c0', color: '#0a0a0f' };
  if (index === 2) return { background: '#cd7f32', color: '#fff' };
  return { background: 'var(--color-surface2)', color: 'var(--color-muted)' };
}
</script>
