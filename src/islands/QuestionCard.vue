<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { Question, GamePhase, Player, Difficulty } from '@/types/game';

const props = defineProps<{
  question: Question;
  phase: GamePhase;
  timeRemaining: number;
  player: Player | null;
  round: number;
  difficulty: Difficulty;
  revealCountdown: number | null;
  isReady: boolean;
  readyCount: number;
  totalActivePlayers: number;
  isQuestionReady: boolean;
  questionReadyCount: number;
}>();

const emit = defineEmits<{
  (e: 'answer', questionId: string, answerIndex: number): void;
  (e: 'ready'): void;
  (e: 'questionReady'): void;
}>();

const labels = ['A', 'B', 'C', 'D'];

const hasAnswered = computed(() => props.player?.hasAnswered ?? false);
const myAnswerIndex = computed(() => props.player?.lastAnswerIndex ?? null);
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

const revealPercent = computed(() => {
  if (props.revealCountdown == null) return 0;
  return (props.revealCountdown / 30) * 100;
});

const buttonClass = (i: number): string => {
  if (!isRevealed.value) {
    if (myAnswerIndex.value === i) return 'bg-gold-dim border border-gold text-white';
    return 'bg-surface border border-border text-text';
  }
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
  if (props.phase !== 'QUESTION') return;
  emit('answer', props.question.id, index);
};

// ── Text-type answer support ──────────────────────────────────────────────
const textAnswer = ref('');
const submittedText = ref('');
const isTextQuestion = computed(() => props.question.answerType === 'text');

watch(
  () => props.question.id,
  () => {
    textAnswer.value = '';
    submittedText.value = '';
  }
);

const normalizeText = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');

const submitTextAnswer = () => {
  if (props.phase !== 'QUESTION') return;
  const input = textAnswer.value.trim();
  if (!input) return;

  const normalized = normalizeText(input);
  const answerIndex = props.question.options.findIndex((opt) => normalizeText(opt) === normalized);

  submittedText.value = input;
  emit('answer', props.question.id, answerIndex !== -1 ? answerIndex : -1);
};
</script>

<template>
  <div class="flex-1 flex flex-col px-4 py-5 max-w-2xl mx-auto w-full">
    <!-- Round / difficulty / time row -->
    <div class="flex items-center justify-between mb-4">
      <span
        class="text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full bg-surface2 text-muted border border-border">
        RONDA {{ round }}/10
      </span>

      <!-- Time remaining (QUESTION phase) — center -->
      <span v-if="phase === 'QUESTION'" class="text-sm font-black font-display tabular-nums transition-colors"
        :style="{ color: timerColor }">
        {{ timeRemaining }}s
      </span>
      <span v-else class="w-10"></span>

      <span class="text-[10px] font-black tracking-widest px-3 py-1 rounded-full"
        :style="{ background: difficultyBg, color: difficultyColor, border: `1px solid ${difficultyColor}40` }">
        {{ difficulty }}%
      </span>
    </div>

    <!-- Timer bar (QUESTION phase) -->
    <div v-if="phase === 'QUESTION'" class="w-full h-2 rounded-full mb-5 overflow-hidden bg-surface2">
      <div class="h-full rounded-full" :style="{
        width: timerPercent + '%',
        background: timerColor,
        transition: 'width 1s linear, background 0.5s'
      }"></div>
    </div>

    <!-- Image (if present) -->
    <div v-if="question.image"
      class="rounded-xl overflow-hidden mb-4 flex items-center justify-center bg-surface border border-border min-h-36 max-h-60">
      <img :src="question.image.src" :alt="question.image.alt" class="max-w-full max-h-60 object-contain"
        loading="eager" />
    </div>

    <!-- Question text -->
    <p class="text-white font-bold text-xl leading-snug mb-5">{{ question.question }}</p>

    <!-- Text-type answer input -->
    <div v-if="isTextQuestion" class="mb-4">
      <template v-if="phase === 'QUESTION'">
        <div class="flex gap-2">
          <input v-model="textAnswer" type="text" placeholder="Escribe tu respuesta..."
            class="flex-1 rounded-xl px-4 py-3.5 bg-surface border border-border text-text font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-gold placeholder:text-muted/50"
            autocomplete="off" autocorrect="off" spellcheck="false" @keydown.enter="submitTextAnswer" />
          <button :disabled="!textAnswer.trim()"
            class="rounded-xl px-5 py-3.5 font-black text-sm tracking-wider transition-all duration-150 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed font-display"
            :class="hasAnswered ? 'bg-gold-dim border border-gold text-white' : 'bg-gold text-bg'"
            @click="submitTextAnswer">
            {{ hasAnswered ? 'CAMBIAR' : 'ENVIAR' }}
          </button>
        </div>
        <p v-if="hasAnswered" class="text-center text-xs text-muted mt-2 opacity-70">
          Respuesta enviada:
          <span class="text-gold font-semibold">{{ submittedText }}</span>
          — puedes cambiarla
        </p>
      </template>

      <div v-else-if="isRevealed" class="grid grid-cols-1 gap-2.5">
        <div v-if="hasAnswered"
          class="w-full rounded-xl px-4 py-3.5 font-semibold text-sm flex items-center gap-3 min-h-13" :class="player?.isCorrect ? 'bg-green-900 border border-green-500 text-green-200' : 'bg-red-950 border border-red-500 text-red-300'
            ">
          <span class="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0"
            :class="player?.isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'">
            {{ player?.isCorrect ? '✓' : '✗' }}
          </span>
          <span class="leading-snug">Tu respuesta: {{ submittedText }}</span>
        </div>
        <div v-else
          class="w-full rounded-xl px-4 py-3.5 font-semibold text-sm flex items-center gap-3 min-h-13 bg-red-950 border border-red-500 text-red-300">
          <span
            class="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 bg-red-500 text-white">✗</span>
          <span class="leading-snug">No respondiste</span>
        </div>
        <div v-if="!player?.isCorrect"
          class="w-full rounded-xl px-4 py-3.5 font-semibold text-sm flex items-center gap-3 min-h-13 bg-green-900 border border-green-500 text-green-200">
          <span
            class="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 bg-green-500 text-white">✓</span>
          <span class="leading-snug">Respuesta correcta: {{ question.options[question.correctIndex] }}</span>
        </div>
      </div>
    </div>

    <!-- Multiple-choice answer options -->
    <div v-else class="grid grid-cols-1 gap-2.5 mb-4">
      <button v-for="(option, i) in question.options" :key="i" :disabled="phase !== 'QUESTION'"
        class="w-full text-left rounded-xl px-4 py-3.5 font-semibold text-sm transition-all duration-150 flex items-center gap-3 disabled:cursor-default active:scale-[0.98] min-h-13"
        :class="buttonClass(i)" @click="submitAnswer(i)">
        <span class="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0"
          :class="labelClass(i)">
          {{ labels[i] }}
        </span>
        <span class="leading-snug">{{ option }}</span>
        <span v-if="isRevealed && i === question.correctIndex"
          class="ml-auto text-green-400 text-base shrink-0">✓</span>
        <span v-else-if="isRevealed && i === myAnswerIndex && i !== question.correctIndex"
          class="ml-auto text-red-400 text-base shrink-0">
          ✗
        </span>
      </button>
    </div>

    <!-- Change-answer hint (multiple choice only) -->
    <p v-if="phase === 'QUESTION' && hasAnswered && !isTextQuestion"
      class="text-center text-xs text-muted mb-2 opacity-70">
      Puedes cambiar tu respuesta
    </p>

    <!-- Listo button (QUESTION phase, only when answered) -->
    <div v-if="phase === 'QUESTION' && hasAnswered" class="flex flex-col gap-2 mt-auto pt-3">
      <div class="flex items-center justify-between text-xs text-muted px-0.5">
        <span>{{ questionReadyCount }}/{{ totalActivePlayers }} listos</span>
        <span v-if="isQuestionReady" class="text-gold font-semibold">Esperando a los demás...</span>
      </div>
      <button :disabled="isQuestionReady"
        class="w-full rounded-xl py-3.5 font-black text-lg tracking-widest transition-all duration-150 active:scale-95 disabled:active:scale-100 font-display disabled:cursor-not-allowed"
        :class="isQuestionReady ? 'bg-surface2 text-muted opacity-60' : 'bg-gold text-bg'"
        @click="$emit('questionReady')">
        {{ isQuestionReady ? 'LISTO ✓' : 'LISTO' }}
      </button>
    </div>

    <!-- Explanation (revealed) -->
    <div v-if="isRevealed && question.explanation"
      class="rounded-xl px-4 py-3.5 text-sm bg-surface2 border border-border text-muted mb-4">
      <span class="text-gold font-bold mr-1.5">Explicación:</span>
      {{ question.explanation }}
    </div>

    <!-- Siguiente controls (REVEAL phase only) -->
    <div v-if="phase === 'REVEAL'" class="flex flex-col gap-3 mt-auto pt-4">
      <!-- Reveal countdown bar -->
      <div class="w-full h-1.5 rounded-full overflow-hidden bg-surface2">
        <div class="h-full rounded-full bg-gold" :style="{ width: revealPercent + '%', transition: 'width 1s linear' }">
        </div>
      </div>

      <!-- Countdown + ready count -->
      <div class="flex items-center justify-between text-xs text-muted">
        <span>{{ revealCountdown }}s para continuar</span>
        <span class="font-semibold">{{ readyCount }}/{{ totalActivePlayers }} listos</span>
      </div>

      <!-- Siguiente button -->
      <button :disabled="isReady"
        class="w-full rounded-xl py-3.5 font-black text-lg tracking-widest transition-all duration-150 active:scale-95 disabled:active:scale-100 font-display disabled:cursor-not-allowed"
        :class="isReady ? 'bg-surface2 text-muted opacity-60' : 'bg-gold text-bg'" @click="$emit('ready')">
        {{ isReady ? 'ESPERANDO...' : 'SIGUIENTE ›' }}
      </button>
    </div>

    <!-- Eliminated overlay -->
    <div v-if="isEliminated"
      class="fixed inset-0 flex flex-col items-center justify-center pointer-events-none z-50 bg-bg/85">
      <p class="text-6xl mb-3">💀</p>
      <p class="text-white font-black text-3xl font-display tracking-widest">ELIMINADO</p>
      <p class="text-muted text-sm mt-2">Espera a que termine la ronda...</p>
    </div>
  </div>
</template>
