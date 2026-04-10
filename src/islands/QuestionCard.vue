<script setup lang="ts">
import { computed } from 'vue';
import type { Question, GamePhase, Player, Difficulty } from '@/types/game';

const props = defineProps<{
  question: Question;
  phase: GamePhase;
  timeRemaining: number;
  player: Player | null;
  round: number;
  difficulty: Difficulty;
}>();

const emit = defineEmits<{
  (e: 'answer', questionId: string, answerIndex: number): void;
}>();

const labels = ['A', 'B', 'C', 'D'];

const hasAnswered = computed(() => props.player?.hasAnswered ?? false);
const myAnswerIndex = computed(() => props.player?.lastAnswerIndex ?? null);
const isCorrect = computed(() => props.player?.isCorrect ?? null);
const isEliminated = computed(() => props.player?.isEliminated ?? false);
const isRevealed = computed(() => props.phase === 'REVEAL' || props.phase === 'ELIMINATION');

const timerPercent = computed(() => {
  const total = props.question.timeLimit;
  return Math.max(0, (props.timeRemaining / total) * 100);
});

const timerColor = computed(() => {
  const pct = timerPercent.value;
  if (pct > 50) return '#22c55e'; // green-500
  if (pct > 25) return '#eab308'; // yellow-500
  return '#ef4444'; // red-500
});

const difficultyColor = computed(() => {
  const d = props.difficulty;
  if (d >= 70) return '#4ade80'; // green
  if (d >= 40) return '#facc15'; // yellow
  if (d >= 10) return '#fb923c'; // orange
  return '#f87171'; // red (1%)
});

const difficultyBg = computed(() => difficultyColor.value + '22');

const buttonClass = (i: number): string => {
  if (!isRevealed.value) {
    if (myAnswerIndex.value === i) return 'bg-gold-dim border border-gold text-white';
    return 'bg-surface border border-border text-text';
  }
  // Reveal phase
  if (i === props.question.correctIndex) return 'bg-green-900 border border-green-500 text-green-200';
  if (i === myAnswerIndex.value) return 'bg-red-950 border border-red-500 text-red-300';
  return 'bg-surface border border-border text-text opacity-40';
};

const labelClass = (i: number): string => {
  if (isRevealed.value) {
    if (i === props.question.correctIndex) return 'bg-green-500 text-white';
    if (i === myAnswerIndex.value) return 'bg-red-500 text-white';
    return 'bg-surface2 text-muted';
  }
  if (myAnswerIndex.value === i) return 'bg-gold text-bg';
  return 'bg-surface2 text-muted';
};

const submitAnswer = (index: number) => {
  if (hasAnswered.value || props.phase !== 'QUESTION') return;
  emit('answer', props.question.id, index);
};
</script>

<template>
  <div class="flex-1 flex flex-col px-4 py-6 max-w-2xl mx-auto w-full">
    <!-- Round / difficulty badge -->
    <div class="flex items-center justify-between mb-5">
      <span class="text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full bg-surface2 text-muted border border-border">
        Ronda {{ round }}/10
      </span>
      <span
        class="text-xs font-black tracking-widest px-3 py-1 rounded-full"
        :style="{ background: difficultyBg, color: difficultyColor, border: `1px solid ${difficultyColor}40` }"
      >
        {{ difficulty }}%
      </span>
    </div>

    <!-- Timer bar -->
    <div class="w-full h-1.5 rounded-full mb-5 overflow-hidden bg-surface2">
      <div
        class="h-full rounded-full transition-none"
        :style="{
          width: timerPercent + '%',
          background: timerColor,
          transition: phase === 'QUESTION' ? 'width 1s linear, background 0.5s' : 'none'
        }"
      ></div>
    </div>

    <!-- Time remaining -->
    <p class="text-right text-xs font-bold mb-4" :style="{ color: timerColor }">{{ timeRemaining }}s</p>

    <!-- Image (if present) -->
    <div
      v-if="question.image"
      class="rounded-xl overflow-hidden mb-5 flex items-center justify-center bg-surface border border-border min-h-40 max-h-[260px]"
    >
      <img :src="question.image.src" :alt="question.image.alt" class="max-w-full max-h-[260px] object-contain" loading="eager" />
    </div>

    <!-- Question text -->
    <p class="text-white font-bold text-xl leading-snug mb-6">
      {{ question.question }}
    </p>

    <!-- Answer options -->
    <div class="grid grid-cols-1 gap-3 mb-4">
      <button
        v-for="(option, i) in question.options"
        :key="i"
        :disabled="hasAnswered || phase !== 'QUESTION'"
        class="w-full text-left rounded-xl px-5 py-4 font-semibold text-sm transition-all duration-200 flex items-center gap-4 disabled:cursor-default"
        :class="buttonClass(i)"
        @click="submitAnswer(i)"
      >
        <span class="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0" :class="labelClass(i)">
          {{ labels[i] }}
        </span>
        <span>{{ option }}</span>
        <!-- Reveal icon -->
        <span v-if="isRevealed && i === question.correctIndex" class="ml-auto text-green-400">✓</span>
        <span v-else-if="isRevealed && i === myAnswerIndex && i !== question.correctIndex" class="ml-auto text-red-400">✗</span>
      </button>
    </div>

    <!-- Explanation (revealed) -->
    <div
      v-if="isRevealed && question.explanation"
      class="rounded-xl px-5 py-4 text-sm bg-surface2 border border-border text-muted"
    >
      <span class="text-yellow-400 font-bold mr-2">Explicación:</span>
      {{ question.explanation }}
    </div>

    <!-- Eliminated overlay -->
    <div
      v-if="isEliminated"
      class="fixed inset-0 flex flex-col items-center justify-center pointer-events-none z-50 bg-bg/85"
    >
      <p class="text-6xl mb-3">💀</p>
      <p class="text-white font-black text-2xl font-display">ELIMINADO</p>
      <p class="text-muted text-sm mt-2">Espera a que termine la ronda...</p>
    </div>
  </div>
</template>
