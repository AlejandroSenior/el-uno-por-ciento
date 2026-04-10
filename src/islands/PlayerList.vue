<script setup lang="ts">
import { computed } from 'vue';
import type { Player } from '@/types/game';

const props = defineProps<{
  players: Record<string, Player>;
  hostId: string;
  playerId: string;
}>();

const playerList = computed(() => Object.values(props.players));
</script>

<template>
  <div class="px-4 py-2.5 flex items-center gap-2 overflow-x-auto bg-surface border-t border-border shrink-0 scrollbar-none">
    <div
      v-for="player in playerList"
      :key="player.id"
      class="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold transition-all duration-300 shrink-0"
      :class="{ 'player-eliminated': player.isEliminated }"
      :style="{
        background: player.color + '1a',
        border: `1px solid ${player.color}44`,
        color: player.isEliminated ? 'var(--color-muted)' : player.color,
        textDecoration: player.isEliminated ? 'line-through' : 'none'
      }"
    >
      <!-- Status indicator -->
      <span v-if="player.hasAnswered && !player.isEliminated" class="text-[10px]" :style="{ color: player.color }">✓</span>
      <span
        v-else-if="!player.isEliminated"
        class="w-1 h-1 rounded-full animate-pulse shrink-0"
        :style="{ background: player.color }"
      ></span>

      <span>{{ player.name }}</span>

      <!-- Host crown -->
      <span v-if="player.id === hostId" class="text-[10px] opacity-50">♛</span>

      <!-- You badge -->
      <span v-if="player.id === playerId" class="text-[10px] opacity-40">(tú)</span>

      <!-- Eliminated marker -->
      <span v-if="player.isEliminated" class="text-[10px] opacity-40">💀</span>
    </div>
  </div>
</template>
