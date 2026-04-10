<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { Question } from '@/types/game';
import questionsData from '@/data/questions.json';

const questions = questionsData as Question[];
const currentIndex = ref(0);
const selectedAnswer = ref<number | null>(null);
const showResult = ref(false);
const textAnswer = ref('');

const currentQuestion = computed(() => questions[currentIndex.value]);
const totalQuestions = questions.length;

// Determinar el tipo de respuesta (por defecto 'multiple-choice')
const answerType = computed(() => currentQuestion.value.answerType || 'multiple-choice');

const isCorrect = computed(() => {
  if (selectedAnswer.value === null) return false;
  return selectedAnswer.value === currentQuestion.value.correctIndex;
});

// Reset answer when changing question
watch(currentIndex, () => {
  selectedAnswer.value = null;
  showResult.value = false;
  textAnswer.value = '';
});

const selectAnswer = (index: number) => {
  selectedAnswer.value = index;
  showResult.value = true;
};

const submitTextAnswer = () => {
  const userAnswer = textAnswer.value.trim().toLowerCase();
  
  // Try to match with options (case insensitive)
  const answerIndex = currentQuestion.value.options.findIndex(
    opt => opt.toLowerCase().trim() === userAnswer
  );
  
  if (answerIndex !== -1) {
    selectedAnswer.value = answerIndex;
    showResult.value = true;
  } else {
    // If no exact match, mark as incorrect
    selectedAnswer.value = -1; // Special value for text answers
    showResult.value = true;
  }
};

const previous = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--;
  }
};

const next = () => {
  if (currentIndex.value < totalQuestions - 1) {
    currentIndex.value++;
  }
};

const goToQuestion = (index: number) => {
  if (index >= 0 && index < totalQuestions) {
    currentIndex.value = index;
  }
};

const handleKeydown = (e: KeyboardEvent) => {
  // Don't navigate if typing in text input
  if ((e.target as HTMLElement).tagName === 'INPUT' && (e.target as HTMLInputElement).type === 'text') {
    return;
  }
  
  if (e.key === 'ArrowLeft') previous();
  if (e.key === 'ArrowRight') next();
  
  // Allow A, B, C, D to select answers
  if (!showResult.value && ['a', 'b', 'c', 'd'].includes(e.key.toLowerCase())) {
    const index = e.key.toLowerCase().charCodeAt(0) - 97; // 'a' = 0, 'b' = 1, etc.
    if (index < currentQuestion.value.options.length) {
      selectAnswer(index);
    }
  }
};

// Navegación por teclado
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', handleKeydown);
}

const getDifficultyColor = (difficulty: number) => {
  if (difficulty >= 70) return 'bg-green-500/20 text-green-400 border-green-500/30';
  if (difficulty >= 40) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
  if (difficulty >= 10) return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
  return 'bg-red-500/20 text-red-400 border-red-500/30';
};

const getDifficultyLabel = (difficulty: number) => {
  if (difficulty >= 70) return 'Fácil';
  if (difficulty >= 40) return 'Media';
  if (difficulty >= 10) return 'Difícil';
  return 'Muy difícil';
};
</script>

<template>
  <div class="min-h-dvh bg-[var(--color-bg)] text-[var(--color-text)] flex flex-col">
    <!-- Header -->
    <header class="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
      <div class="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <a href="/" class="text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors">
          ← Volver al inicio
        </a>
        <h1 class="font-[var(--font-display)] text-2xl text-[var(--color-gold)]">BANCO DE PREGUNTAS</h1>
        <div class="text-[var(--color-muted)]">{{ totalQuestions }} preguntas</div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 py-8">
      <!-- Navigation Bar -->
      <div class="flex items-center justify-between mb-8 gap-4">
        <button
          @click="previous"
          :disabled="currentIndex === 0"
          class="px-6 py-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg font-semibold transition-all hover:bg-[var(--color-surface2)] disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ← Anterior
        </button>

        <div class="flex flex-col items-center gap-2">
          <div class="text-sm text-[var(--color-muted)]">Pregunta</div>
          <input
            type="number"
            :value="currentIndex + 1"
            @input="(e) => goToQuestion(parseInt((e.target as HTMLInputElement).value) - 1)"
            min="1"
            :max="totalQuestions"
            class="w-20 px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-center font-mono text-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]"
          />
          <div class="text-xs text-[var(--color-muted)]">de {{ totalQuestions }}</div>
        </div>

        <button
          @click="next"
          :disabled="currentIndex === totalQuestions - 1"
          class="px-6 py-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg font-semibold transition-all hover:bg-[var(--color-surface2)] disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Siguiente →
        </button>
      </div>

      <!-- Question Card -->
      <div class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 space-y-6 flex-1">
        <!-- Question Header -->
        <div class="flex items-start justify-between gap-4 flex-wrap">
          <div class="flex items-center gap-3">
            <span
              :class="getDifficultyColor(currentQuestion.difficulty)"
              class="px-3 py-1 rounded-full text-xs font-semibold border"
            >
              {{ getDifficultyLabel(currentQuestion.difficulty) }} ({{ currentQuestion.difficulty }}%)
            </span>
            <span class="text-[var(--color-muted)] text-sm">ID: {{ currentQuestion.id }}</span>
            <span class="text-[var(--color-muted)] text-sm">⏱️ {{ currentQuestion.timeLimit }}s</span>
          </div>
          <div v-if="currentQuestion.image" class="text-xs text-[var(--color-gold)] flex items-center gap-1">
            🖼️ Con imagen
          </div>
        </div>

        <!-- Question Text -->
        <div>
          <h2 class="text-2xl font-semibold mb-4">{{ currentQuestion.question }}</h2>
        </div>

        <!-- Image -->
        <div v-if="currentQuestion.image" class="rounded-xl overflow-hidden bg-[var(--color-bg)] border border-[var(--color-border)] flex items-center justify-center p-4">
          <img
            :src="currentQuestion.image.src"
            :alt="currentQuestion.image.alt"
            class="max-w-full max-h-80 object-contain"
            loading="eager"
          />
        </div>

        <!-- Multiple Choice Options -->
        <div v-if="answerType === 'multiple-choice'" class="space-y-3">
          <div class="text-sm text-[var(--color-muted)] mb-2">
            {{ showResult ? 'Resultado:' : 'Selecciona una opción:' }}
          </div>
          <button
            v-for="(option, index) in currentQuestion.options"
            :key="index"
            @click="selectAnswer(index)"
            :disabled="showResult"
            :class="[
              'w-full p-4 rounded-lg border-2 transition-all text-left',
              !showResult && 'hover:bg-[var(--color-surface2)] hover:border-[var(--color-gold)] cursor-pointer',
              showResult && selectedAnswer === index && isCorrect && 'bg-green-500/20 border-green-500 text-green-400',
              showResult && selectedAnswer === index && !isCorrect && 'bg-red-500/20 border-red-500 text-red-400',
              showResult && index === currentQuestion.correctIndex && selectedAnswer !== index && 'bg-green-500/10 border-green-500/50 text-green-400',
              !showResult && 'bg-[var(--color-surface2)] border-[var(--color-border)]',
              showResult && selectedAnswer !== index && index !== currentQuestion.correctIndex && 'bg-[var(--color-surface2)] border-[var(--color-border)] opacity-50'
            ]"
          >
            <div class="flex items-start gap-3">
              <span class="font-bold">{{ String.fromCharCode(65 + index) }}.</span>
              <span class="flex-1">{{ option }}</span>
              <span v-if="showResult && index === currentQuestion.correctIndex" class="text-green-400 font-semibold">✓</span>
              <span v-if="showResult && selectedAnswer === index && !isCorrect" class="text-red-400 font-semibold">✗</span>
            </div>
          </button>
        </div>

        <!-- Text Input (for text answer type) -->
        <div v-if="answerType === 'text'" class="space-y-4">
          <div class="text-sm text-[var(--color-muted)] mb-2">
            {{ showResult ? 'Tu respuesta:' : 'Escribe tu respuesta:' }}
          </div>
          
          <div v-if="!showResult" class="flex gap-2">
            <input
              v-model="textAnswer"
              type="text"
              placeholder="Escribe aquí tu respuesta..."
              @keydown.enter="submitTextAnswer"
              class="flex-1 px-4 py-3 bg-[var(--color-surface2)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)] text-[var(--color-text)]"
            />
            <button
              @click="submitTextAnswer"
              :disabled="!textAnswer.trim()"
              class="px-6 py-3 bg-[var(--color-gold)] text-[var(--color-bg)] rounded-lg font-semibold transition-all hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Enviar
            </button>
          </div>

          <div v-if="showResult" class="space-y-3">
            <div
              :class="[
                'p-4 rounded-lg border-2',
                isCorrect ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-red-500/20 border-red-500 text-red-400'
              ]"
            >
              <div class="flex items-start gap-3">
                <span class="font-semibold">Tu respuesta:</span>
                <span class="flex-1">{{ textAnswer }}</span>
                <span v-if="isCorrect" class="text-green-400 font-semibold">✓</span>
                <span v-else class="text-red-400 font-semibold">✗</span>
              </div>
            </div>
            
            <div v-if="!isCorrect" class="p-4 rounded-lg border-2 bg-green-500/10 border-green-500/50 text-green-400">
              <div class="flex items-start gap-3">
                <span class="font-semibold">Respuesta correcta:</span>
                <span class="flex-1">{{ currentQuestion.options[currentQuestion.correctIndex] }}</span>
                <span class="text-green-400 font-semibold">✓</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Explanation (only shown when correct) -->
        <div
          v-if="showResult && isCorrect"
          class="bg-green-500/10 rounded-lg p-4 border border-green-500/30 animate-fade-in"
        >
          <div class="text-sm text-green-400 font-semibold mb-2 flex items-center gap-2">
            <span>✓</span>
            <span>¡Correcto! Explicación:</span>
          </div>
          <p class="text-[var(--color-text)] leading-relaxed">{{ currentQuestion.explanation }}</p>
        </div>

        <!-- Wrong answer message -->
        <div
          v-if="showResult && !isCorrect"
          class="bg-red-500/10 rounded-lg p-4 border border-red-500/30 animate-fade-in"
        >
          <div class="text-sm text-red-400 font-semibold mb-2 flex items-center gap-2">
            <span>✗</span>
            <span>Respuesta incorrecta</span>
          </div>
          <p class="text-[var(--color-muted)]">
            La respuesta correcta es: <span class="text-green-400 font-semibold">{{ currentQuestion.options[currentQuestion.correctIndex] }}</span>
          </p>
        </div>
      </div>

      <!-- Keyboard Hint -->
      <div class="text-center text-xs text-[var(--color-muted)] mt-4">
        Usa las flechas ← → para navegar | A, B, C, D para responder
      </div>
    </main>
  </div>
</template>
