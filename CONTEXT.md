# El 1% — Contexto del Proyecto

Documento de referencia para retomar el contexto en cualquier momento.
Última actualización: inicio del proyecto.

---

## ¿Qué es este proyecto?

Recreación web del juego de mesa del programa de televisión español "El 1%".
Juego de preguntas de lógica, deducción y observación donde los jugadores compiten
en tiempo real, siendo eliminados por ronda hasta que solo queda el más agudo.

---

## Reglas del juego

- **Jugadores:** 2 a 6 por sala
- **Rondas:** 10 niveles de dificultad (del 90% al 1%)
- **Preguntas:** De lógica, observación y deducción — NO cultura general
- **Mecánica:** Todos responden simultáneamente con temporizador
- **Eliminación:** Quien falla una pregunta queda eliminado esa ronda
- **Avance:** Los que aciertan pasan a la siguiente ronda (más difícil)
- **Victoria:** Llegar a la pregunta del 1% y acertarla, o ser el último superviviente

---

## Decisiones técnicas tomadas

### Stack frontend
- **Astro.js** — SSG estático, cero JS por defecto, máximo rendimiento
- **Vue.js 3 + Composition API** — Solo en islands (partes interactivas)
- **Tailwind CSS v4** — Utility-first, sin CSS muerto en producción
- **TypeScript** — En todo el proyecto, cliente y servidor

### Backend tiempo real
- **PartyKit** — Salas multijugador basadas en Cloudflare Durable Objects
- Cada sala es un Durable Object con su propio estado
- Timer gestionado en servidor (no client-side, evita trampas)
- Modo cloud-prem: desplegado en cuenta Cloudflare propia (platform fee = $0)

### Despliegue
- **Frontend:** Cloudflare Pages (free tier, ilimitado)
- **Backend:** PartyKit en cuenta Cloudflare propia
- **Dominio:** Opcional, ~€8-15/año (Cloudflare Registrar)

### Banco de preguntas
- **100 preguntas** en JSON estático (`src/data/questions.json`)
- **10 preguntas por nivel** de dificultad
- **Idioma:** Español de España
- **Futuro:** Migrar a Supabase con tracking de uso (ya planeado, no implementado aún)

---

## Estructura del proyecto

```
el-uno-por-ciento/
├── src/
│   ├── pages/
│   │   ├── index.astro          → Landing (estático, 0 JS)
│   │   └── sala.astro           → Sala de juego (?c=ABCD en URL)
│   ├── islands/
│   │   ├── Home.vue             → Crear sala / unirse con código
│   │   ├── Lobby.vue            → Sala de espera + lista jugadores
│   │   ├── Game.vue             → Orquestador principal (conecta a PartyKit)
│   │   ├── QuestionCard.vue     → Pregunta + opciones + timer + imagen opcional
│   │   ├── PlayerList.vue       → Estado jugadores en tiempo real
│   │   └── Results.vue          → Pantalla final + rankings
│   ├── party/
│   │   └── game.ts              → Servidor PartyKit (lógica del juego)
│   ├── data/
│   │   └── questions.json       → 100 preguntas estáticas
│   └── types/
│       └── game.ts              → Tipos TS compartidos
├── public/
│   └── images/
│       └── questions/           → SVGs + WebPs de preguntas con imagen
├── partykit.json
├── astro.config.mjs
├── tailwind.config.mjs
└── tsconfig.json
```

---

## Routing

- `/` → Landing page (crear sala / unirse)
- `/sala?c=ABCD` → Sala de juego con código ABCD
- El island Vue lee el parámetro con `new URLSearchParams(window.location.search).get('c')`
- El site es 100% estático (output: 'static'), sin SSR

---

## Tipos TypeScript clave

```typescript
type Difficulty = 90 | 80 | 70 | 60 | 50 | 40 | 30 | 20 | 10 | 1;
type GamePhase = 'LOBBY' | 'COUNTDOWN' | 'QUESTION' | 'REVEAL' | 'ELIMINATION' | 'GAME_OVER';

interface Question {
  id: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  difficulty: Difficulty;
  timeLimit: number;        // segundos (base: ver tabla abajo)
  explanation: string;
  image?: {
    src: string;            // '/images/questions/q041.svg'
    alt: string;            // texto alternativo (sin revelar respuesta)
  };
}

interface Player {
  id: string;
  name: string;
  color: string;            // color asignado al unirse (#hex)
  isEliminated: boolean;
  hasAnswered: boolean;
  lastAnswerIndex: number | null;
  isCorrect: boolean | null;
}

interface GameState {
  phase: GamePhase;
  players: Record<string, Player>;
  currentRound: number;     // 1-10
  currentDifficulty: Difficulty;
  currentQuestion: Question | null;
  timeRemaining: number;
  usedQuestionIds: string[];
  hostId: string;
  countdown: number | null;
  winner: string | null;    // player id
}
```

---

## Tiempos límite por dificultad

| Ronda | Dificultad | Tiempo (texto) | Tiempo (con imagen) |
|-------|-----------|----------------|---------------------|
| 1     | 90%       | 20s            | 30s                 |
| 2     | 80%       | 25s            | 35s                 |
| 3     | 70%       | 30s            | 40s                 |
| 4     | 60%       | 30s            | 40s                 |
| 5     | 50%       | 35s            | 50s                 |
| 6     | 40%       | 35s            | 50s                 |
| 7     | 30%       | 40s            | 55s                 |
| 8     | 20%       | 40s            | 55s                 |
| 9     | 10%       | 45s            | 60s                 |
| 10    | 1%        | 60s            | 75s                 |

---

## Máquina de estados del juego

```
LOBBY
  └─[host inicia]─▶ COUNTDOWN (3-2-1)
                        └─▶ QUESTION (timer corriendo, recibiendo respuestas)
                                └─[timer=0 o todos respondieron]─▶ REVEAL (2-3s)
                                                                        └─▶ ELIMINATION (animación)
                                                                                └─▶ QUESTION (sig. ronda)
                                                                                    o GAME_OVER
```

---

## Preguntas con imagen

- **Porcentaje:** 30-40% del banco (30-40 de 100 preguntas)
- **Tipos incluidos:**
  - Conteo geométrico (¿cuántos triángulos ves?)
  - Contar letras/palabras (texto como imagen para evitar Ctrl+F)
  - Secuencias visuales (¿qué número/figura sigue?)
  - Ilusiones ópticas (clásicas de dominio público + nuevas generadas con IA)
  - Encuentra el error (imagen con algo incoherente o que falta)
- **Formatos:**
  - SVG: para geométricas, secuencias, texto-imagen (generadas en código)
  - WebP: para ilusiones ópticas y "encuentra el error" (IA + dominio público)
- **Almacenamiento:** `/public/images/questions/` → servido por Cloudflare Pages CDN (gratis)
- **Preloading:** Game.vue precarga la imagen siguiente durante la fase REVEAL

---

## Diseño visual

- Fondo muy oscuro (negro/azul muy oscuro)
- Tipografía bold, impacto, tensión de concurso TV
- Acentos dorados/neón
- Barra de timer que se vacía con animación CSS
- Animaciones de eliminación dramáticas (jugador se difumina/borra)
- Responsive: funciona en móvil (jugadores responden desde su teléfono)

---

## Costes estimados

| Fase | Coste mensual |
|------|--------------|
| Desarrollo y beta | €0 |
| Producción (<27k partidas/mes) | ~$6 |
| Con Supabase integrado | +$0 (free tier) |

---

## Roadmap futuro (pendiente)

- [ ] Integración con Supabase: tabla `questions` con campo `times_used`
- [ ] Panel de administración para añadir/editar preguntas sin deploy
- [ ] Soporte multi-idioma (base en español, estructura preparada para i18n)
- [ ] Más imágenes con IA (el banco de imágenes crecerá con el tiempo)
- [ ] Estadísticas de partida (qué preguntas fallan más, tiempos medios)
