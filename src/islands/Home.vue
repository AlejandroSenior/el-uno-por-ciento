<script setup lang="ts">
import { ref } from 'vue';

const name = ref('');
const joinCode = ref('');
const error = ref('');

const generateCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // skip I and O (confusing)
  return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

const saveName = () => {
  localStorage.setItem('playerName', name.value.trim());
};

const createRoom = () => {
  if (!name.value.trim()) return;
  saveName();
  const code = generateCode();
  window.location.href = `/sala?c=${code}`;
};

const joinRoom = () => {
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
};
</script>

<template>
  <div class="min-h-dvh flex flex-col items-center justify-center px-4 py-10">
    <!-- Hero -->
    <div class="text-center mb-8">
      <p class="text-gold text-[10px] font-black tracking-[0.5em] uppercase mb-4">¿Eres del</p>
      <h1
        class="text-[8.5rem] font-black text-white leading-none font-display select-none"
        style="
          text-shadow:
            0 0 40px rgba(251, 191, 36, 0.45),
            0 0 80px rgba(251, 191, 36, 0.15);
        "
      >
        1
        <span class="text-gold">%</span>
      </h1>
      <p class="text-muted text-[11px] tracking-[0.12em] mt-3 uppercase">Lógica · Deducción · Tiempo real</p>
    </div>

    <!-- Card -->
    <div class="w-full max-w-sm rounded-2xl p-6 flex flex-col gap-5 bg-surface border border-border overflow-hidden">
      <!-- Name input -->
      <div class="flex flex-col gap-1.5">
        <label class="text-[10px] font-black text-muted uppercase tracking-[0.2em]">Tu nombre</label>
        <input
          v-model="name"
          type="text"
          maxlength="20"
          placeholder="Jugador 1"
          class="w-full rounded-lg px-4 py-3 text-white font-semibold outline-none focus:ring-2 focus:ring-gold bg-surface2 border border-border placeholder:text-muted/40 text-base transition-colors"
          @keydown.enter="name && createRoom()"
        />
      </div>

      <!-- Create room -->
      <button
        :disabled="!name.trim()"
        class="w-full rounded-xl py-4 font-black text-lg tracking-widest transition-all duration-150 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 font-display bg-gold text-bg"
        @click="createRoom"
      >
        CREAR SALA
      </button>

      <!-- Divider -->
      <div class="flex items-center gap-3">
        <div class="flex-1 h-px bg-border"></div>
        <span class="text-[10px] font-bold text-muted tracking-widest uppercase">o únete con código</span>
        <div class="flex-1 h-px bg-border"></div>
      </div>

      <!-- Join room -->
      <div class="flex gap-2">
        <input
          v-model="joinCode"
          type="text"
          maxlength="4"
          placeholder="ABCD"
          class="flex-1 min-w-0 rounded-lg px-3 py-3 text-white font-black text-center tracking-[0.2em] text-xl uppercase outline-none focus:ring-2 focus:ring-gold bg-surface2 border border-border placeholder:text-muted/40 transition-colors"
          @input="joinCode = joinCode.toUpperCase()"
          @keydown.enter="joinRoom"
        />
        <button
          :disabled="joinCode.length < 4 || !name.trim()"
          class="shrink-0 rounded-xl px-5 py-3 font-black text-sm tracking-widest transition-all duration-150 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 font-display bg-surface2 border border-border text-text"
          @click="joinRoom"
        >
          ENTRAR
        </button>
      </div>

      <!-- Error -->
      <p v-if="error" class="text-red-400 text-xs text-center -mt-1">{{ error }}</p>
    </div>

    <p class="mt-6 text-muted/60 text-xs text-center">2–6 jugadores · 10 rondas · Solo los mejores llegan al 1%</p>

    <!-- Link to questions bank -->
    <a href="/questions" class="mt-4 text-xs text-muted/50 hover:text-gold transition-colors underline underline-offset-2">
      Ver banco de preguntas (132 preguntas)
    </a>
  </div>
</template>
