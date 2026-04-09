<template>
  <div class="min-h-dvh flex flex-col items-center justify-center px-4 py-12">
    <!-- Logo / title -->
    <div class="text-center mb-12">
      <p class="text-yellow-400 text-sm font-bold tracking-[0.3em] uppercase mb-2">¿Eres del</p>
      <h1
        class="text-8xl font-black text-white leading-none"
        style="font-family: var(--font-display); text-shadow: 0 0 40px rgba(251,191,36,0.4)"
      >
        1<span class="text-yellow-400">%</span>
      </h1>
      <p class="text-[var(--color-muted)] text-sm mt-3 tracking-wide">
        El juego de lógica y deducción
      </p>
    </div>

    <!-- Card -->
    <div
      class="w-full max-w-sm rounded-2xl p-8 flex flex-col gap-6"
      style="background: var(--color-surface); border: 1px solid var(--color-border)"
    >
      <!-- Name input -->
      <div class="flex flex-col gap-2">
        <label class="text-xs font-bold text-[var(--color-muted)] uppercase tracking-widest">
          Tu nombre
        </label>
        <input
          v-model="name"
          type="text"
          maxlength="20"
          placeholder="Jugador 1"
          class="w-full rounded-lg px-4 py-3 text-white font-medium outline-none focus:ring-2 focus:ring-yellow-400"
          style="background: var(--color-surface2); border: 1px solid var(--color-border)"
          @keydown.enter="name && createRoom()"
        />
      </div>

      <!-- Create room -->
      <button
        :disabled="!name.trim()"
        class="w-full rounded-xl py-4 font-black text-lg tracking-wide transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
        style="font-family: var(--font-display); background: var(--color-gold); color: #0a0a0f"
        @click="createRoom"
      >
        CREAR SALA
      </button>

      <!-- Divider -->
      <div class="flex items-center gap-3">
        <div class="flex-1 h-px" style="background: var(--color-border)"></div>
        <span class="text-xs text-[var(--color-muted)]">o únete con un código</span>
        <div class="flex-1 h-px" style="background: var(--color-border)"></div>
      </div>

      <!-- Join room -->
      <div class="flex gap-2">
        <input
          v-model="joinCode"
          type="text"
          maxlength="4"
          placeholder="ABCD"
          class="flex-1 rounded-lg px-4 py-3 text-white font-black text-center tracking-[0.3em] text-xl uppercase outline-none focus:ring-2 focus:ring-yellow-400"
          style="background: var(--color-surface2); border: 1px solid var(--color-border)"
          @input="joinCode = joinCode.toUpperCase()"
          @keydown.enter="joinRoom"
        />
        <button
          :disabled="joinCode.length < 4 || !name.trim()"
          class="rounded-xl px-5 py-3 font-bold text-sm tracking-wide transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
          style="background: var(--color-surface2); border: 1px solid var(--color-border); color: var(--color-text)"
          @click="joinRoom"
        >
          ENTRAR
        </button>
      </div>

      <!-- Error -->
      <p v-if="error" class="text-red-400 text-sm text-center">{{ error }}</p>
    </div>

    <p class="mt-8 text-[var(--color-muted)] text-xs text-center">
      2–6 jugadores · 10 rondas · Solo los mejores llegan al 1%
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const name = ref('');
const joinCode = ref('');
const error = ref('');

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // skip I and O (confusing)
  return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function saveName() {
  localStorage.setItem('playerName', name.value.trim());
}

function createRoom() {
  if (!name.value.trim()) return;
  saveName();
  const code = generateCode();
  window.location.href = `/sala?c=${code}`;
}

function joinRoom() {
  if (!name.value.trim()) {
    error.value = 'Escribe tu nombre antes de unirte.';
    return;
  }
  if (joinCode.value.length < 4) {
    error.value = 'El código debe tener 4 letras.';
    return;
  }
  saveName();
  window.location.href = `/sala?c=${joinCode.value.toUpperCase()}`;
}
</script>
