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
  <div class="px-4 py-3 flex items-center gap-3 flex-wrap bg-surface border-t border-border">
    <div
      v-for="player in playerList"
      :key="player.id"
      class="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold transition-all duration-300"
      :class="{ 'player-eliminated': player.isEliminated }"
      :style="{
        background: player.color + '22',
        border: `1px solid ${player.color}55`,
        color: player.isEliminated ? 'var(--color-muted)' : player.color,
        textDecoration: player.isEliminated ? 'line-through' : 'none'
      }"
    >
      <!-- Answered indicator -->
      <span v-if="player.hasAnswered && !player.isEliminated" class="text-xs" :style="{ color: player.color }">✓</span>
      <span v-else-if="!player.isEliminated" class="w-1.5 h-1.5 rounded-full animate-pulse" :style="{ background: player.color }"></span>

      <span>{{ player.name }}</span>

      <!-- Host crown -->
      <span v-if="player.id === hostId" class="text-xs opacity-60">♛</span>

      <!-- You badge -->
      <span v-if="player.id === playerId" class="text-xs opacity-50">(tú)</span>

      <!-- Eliminated marker -->
      <span v-if="player.isEliminated" class="text-xs opacity-50">💀</span>
    </div>
  </div>
</template>
