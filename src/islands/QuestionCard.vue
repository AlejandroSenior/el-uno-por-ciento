<template>
  <div class="flex-1 flex flex-col px-4 py-6 max-w-2xl mx-auto w-full">

    <!-- Round / difficulty badge -->
    <div class="flex items-center justify-between mb-5">
      <span
        class="text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full"
        style="background: var(--color-surface2); color: var(--color-muted); border: 1px solid var(--color-border)"
      >
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
    <div
      class="w-full rounded-full mb-5 overflow-hidden"
      style="height: 6px; background: var(--color-surface2)"
    >
      <div
        class="h-full rounded-full transition-none"
        :style="{
          width: timerPercent + '%',
          background: timerColor,
          transition: phase === 'QUESTION' ? 'width 1s linear, background 0.5s' : 'none',
        }"
      ></div>
    </div>

    <!-- Time remaining -->
    <p
      class="text-right text-xs font-bold mb-4"
      :style="{ color: timerColor }"
    >
      {{ timeRemaining }}s
    </p>

    <!-- Image (if present) -->
    <div
      v-if="question.image"
      class="rounded-xl overflow-hidden mb-5 flex items-center justify-center"
      style="background: var(--color-surface); border: 1px solid var(--color-border); min-height: 160px; max-height: 260px"
    >
      <img
        :src="question.image.src"
        :alt="question.image.alt"
        class="max-w-full max-h-[260px] object-contain"
        loading="eager"
      />
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
        :style="buttonStyle(i)"
        @click="submitAnswer(i)"
      >
        <span
          class="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0"
          :style="labelStyle(i)"
        >
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
      class="rounded-xl px-5 py-4 text-sm"
      style="background: var(--color-surface2); border: 1px solid var(--color-border); color: var(--color-muted)"
    >
      <span class="text-yellow-400 font-bold mr-2">Explicación:</span>{{ question.explanation }}
    </div>

    <!-- Eliminated overlay -->
    <div
      v-if="isEliminated"
      class="fixed inset-0 flex flex-col items-center justify-center pointer-events-none z-50"
      style="background: rgba(10,10,15,0.85)"
    >
      <p class="text-6xl mb-3">💀</p>
      <p class="text-white font-black text-2xl" style="font-family: var(--font-display)">ELIMINADO</p>
      <p class="text-[var(--color-muted)] text-sm mt-2">Espera a que termine la ronda...</p>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Question, GamePhase, Player, Difficulty } from '../types/game';

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
  if (pct > 50) return '#22c55e';   // green-500
  if (pct > 25) return '#eab308';   // yellow-500
  return '#ef4444';                  // red-500
});

const difficultyColor = computed(() => {
  const d = props.difficulty;
  if (d >= 70) return '#4ade80';    // green
  if (d >= 40) return '#facc15';    // yellow
  if (d >= 10) return '#fb923c';    // orange
  return '#f87171';                  // red (1%)
});

const difficultyBg = computed(() => difficultyColor.value + '22');

function buttonStyle(i: number): Record<string, string> {
  const base: Record<string, string> = {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    color: 'var(--color-text)',
  };

  if (!isRevealed.value) {
    if (myAnswerIndex.value === i) {
      base.border = '1px solid var(--color-gold)';
      base.background = 'var(--color-gold-dim)';
      base.color = '#fff';
    }
    return base;
  }

  // Reveal phase
  if (i === props.question.correctIndex) {
    base.background = '#14532d';
    base.border = '1px solid #22c55e';
    base.color = '#bbf7d0';
    return base;
  }
  if (i === myAnswerIndex.value) {
    base.background = '#450a0a';
    base.border = '1px solid #ef4444';
    base.color = '#fca5a5';
    return base;
  }
  base.opacity = '0.4';
  return base;
}

function labelStyle(i: number): Record<string, string> {
  if (isRevealed.value) {
    if (i === props.question.correctIndex) return { background: '#22c55e', color: '#fff' };
    if (i === myAnswerIndex.value) return { background: '#ef4444', color: '#fff' };
    return { background: 'var(--color-surface2)', color: 'var(--color-muted)' };
  }
  if (myAnswerIndex.value === i) return { background: 'var(--color-gold)', color: '#0a0a0f' };
  return { background: 'var(--color-surface2)', color: 'var(--color-muted)' };
}

function submitAnswer(index: number) {
  if (hasAnswered.value || props.phase !== 'QUESTION') return;
  emit('answer', props.question.id, index);
}
</script>
