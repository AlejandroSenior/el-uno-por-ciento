# 🎯 El Uno Por Ciento

<div align="center">

<a href="https://el-uno-por-ciento.pages.dev/" target="_blank" rel="noopener noreferrer">
  <img width="15%" alt="El 1% Hero" src="https://el-uno-por-ciento.pages.dev/images/el-uno-por-ciento.webp" />
</a>

### Desafía tu lógica y capacidad de observación con amigos.

[![AstroJs](https://img.shields.io/badge/Astro-6.0-black?style=for-the-badge&logo=astro&logoColor=white)](https://astro.build)
[![VueJs](https://img.shields.io/badge/Vue-3.0-42b883?style=for-the-badge&logo=vue.js&logoColor=white)](https://vuejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![PartyKit](https://img.shields.io/badge/Partykit-1.0-3178C6?style=for-the-badge&logo=partykit&logoColor=white)](https://partykit.io)

**Recreación web del icónico juego de preguntas del programa de televisión español "El 1%". Un juego multijugador en tiempo real de lógica, deducción y observación donde solo los más agudos llegan al final.**

</div>

---

## 📖 Tabla de Contenidos

- [Sobre el Juego](#-sobre-el-juego)
- [Reglas del Juego](#-reglas-del-juego)
- [Características](#-características)
- [Stack Tecnológico](#-stack-tecnológico)
- [Instalación](#-instalación)
- [Desarrollo](#-desarrollo)
- [Despliegue](#-despliegue)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Licencia](#-licencia)

---

## 🎮 Sobre el Juego

**El Uno Por Ciento** es un juego de preguntas multijugador que desafía tu lógica y capacidad de observación. A diferencia de los típicos juegos de cultura general, aquí las preguntas son puzzles que requieren pensar, no memorizar.

**Inspirado en:** El programa de televisión español "El 1%", donde los concursantes enfrentan preguntas cada vez más difíciles hasta llegar a las que solo el 1% de la población puede resolver.

---

## 📋 Reglas del Juego

### Configuración

- **Jugadores:** De 2 a 6 por sala privada
- **Rondas:** 10 niveles de dificultad progresiva (90% → 80% → ... → 1%)
- **Tipo de preguntas:** Lógica, observación, secuencias, conteo geométrico, ilusiones ópticas

### Mecánica

1. **Crear o unirse:** El primer jugador crea una sala con código de 4 letras, los demás se unen
2. **Espera en lobby:** El host inicia la partida cuando todos estén listos (mínimo 2 jugadores)
3. **Respuesta simultánea:** Todos los jugadores responden al mismo tiempo dentro del límite de tiempo
4. **Eliminación:** Quien falla una pregunta queda eliminado esa ronda
5. **Progresión:** Los que aciertan avanzan a la siguiente ronda (más difícil, menos tiempo)
6. **Victoria:** El ganador es quien llega al 1% y acierta, o el último superviviente

### Tiempos Límite

| Ronda | Dificultad | Tiempo Base | Con Imagen |
| ----- | ---------- | ----------- | ---------- |
| 1     | 90%        | 20s         | 30s        |
| 2     | 80%        | 25s         | 35s        |
| 3     | 70%        | 30s         | 40s        |
| 4     | 60%        | 30s         | 40s        |
| 5     | 50%        | 35s         | 50s        |
| 6     | 40%        | 35s         | 50s        |
| 7     | 30%        | 40s         | 55s        |
| 8     | 20%        | 40s         | 55s        |
| 9     | 10%        | 45s         | 60s        |
| 10    | 1%         | 60s         | 75s        |

---

## ✨ Características

- **Multijugador en tiempo real** — Salas privadas con sincronización instantánea vía WebSockets
- **100 preguntas únicas** — Preguntas de lógica y observación, no cultura general
- **Timer en servidor** — Imposible hacer trampa, el tiempo se controla server-side
- **Preguntas con imagen** — SVGs interactivos e imágenes para puzzles visuales
- **Responsive** — Juega desde móvil o escritorio con la misma experiencia
- **Sin registro** — Solo elige tu nombre y juega
- **Persistencia de nombre** — Tu nombre se guarda localmente para la próxima partida

---

## 🛠 Stack Tecnológico

### Frontend

- **[Astro 6.x](https://astro.build)** — Framework SSG para sitios ultrarrápidos (0 JS por defecto)
- **[Vue 3](https://vuejs.org)** — Composition API con `<script setup>` para islands interactivos
- **[Tailwind CSS 4.x](https://tailwindcss.com)** — Utility-first styling con CSS moderno
- **[TypeScript](https://www.typescriptlang.org)** — Tipado estático en todo el proyecto

### Backend

- **[PartyKit](https://partykit.io)** — Salas multijugador basadas en Cloudflare Durable Objects
- **[PartySocket](https://github.com/partykit/partykit)** — WebSocket client con reconexión automática

### Infraestructura

- **[Cloudflare Pages](https://pages.cloudflare.com)** — Hosting del frontend estático
- **[Cloudflare Durable Objects](https://www.cloudflare.com/products/workers-durable-objects/)** — Estado persistente de las salas en edge

### Herramientas

- **[pnpm](https://pnpm.io)** — Gestor de paquetes rápido y eficiente
- **[Prettier](https://prettier.io)** — Formateo de código consistente

---

## 💾 Instalación

### Requisitos previos

- **Node.js** `>=22.12.0`
- **pnpm** `>=9.0.0` (instalable con `npm install -g pnpm`)

### Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/el-uno-por-ciento.git
cd el-uno-por-ciento
```

### Instalar dependencias

```bash
pnpm install
```

---

## 🚀 Desarrollo

Para desarrollar localmente necesitas **dos procesos corriendo simultáneamente**:

### 1. Frontend (Astro dev server)

```bash
pnpm dev
```

El servidor de desarrollo se iniciará en `http://localhost:4321`

### 2. Backend (PartyKit local)

```bash
pnpm partykit dev
```

El servidor PartyKit se iniciará en `http://localhost:1999`

> **Nota:** Ambos procesos deben estar corriendo para que el juego funcione localmente.

### Comandos disponibles

| Comando                | Descripción                                        |
| ---------------------- | -------------------------------------------------- |
| `pnpm dev`             | Inicia el servidor de desarrollo de Astro          |
| `pnpm partykit dev`    | Inicia el servidor PartyKit en local (puerto 1999) |
| `pnpm build`           | Construye el sitio estático en `./dist/`           |
| `pnpm preview`         | Previsualiza el build de producción localmente     |
| `pnpm partykit deploy` | Despliega el backend a Cloudflare                  |
| `pnpm astro check`     | Verifica tipos TypeScript                          |

---

## 🌐 Despliegue

El despliegue consta de **dos pasos independientes**:

### 1. Desplegar Backend (PartyKit)

```bash
pnpm partykit deploy
```

Esto desplegará el servidor de juego a Cloudflare Durable Objects. Anota la URL que te proporcione (ej: `el-uno-por-ciento.tu-usuario.partykit.dev`).

### 2. Desplegar Frontend (Cloudflare Pages)

1. **Construir el proyecto:**

```bash
pnpm build
```

2. **Configurar variable de entorno en Cloudflare Pages:**
   - Ve a tu dashboard de Cloudflare Pages
   - Añade la variable de entorno:
     ```
     PUBLIC_PARTYKIT_HOST=el-uno-por-ciento.tu-usuario.partykit.dev
     ```

3. **Subir a Cloudflare Pages:**
   - Conecta tu repositorio de GitHub/GitLab
   - Configura el build:
     - **Build command:** `pnpm build`
     - **Build output directory:** `dist`
     - **Node version:** `22.12.0` o superior

4. **Volver a construir:**
   - Ejecuta un nuevo build en Cloudflare Pages para que tome la variable de entorno

---

## 📁 Estructura del Proyecto

```
el-uno-por-ciento/
├── src/
│   ├── pages/
│   │   ├── index.astro          # Landing page (crear/unirse a sala)
│   │   └── sala.astro           # Página del juego (?c=CODIGO)
│   ├── islands/                 # Componentes Vue interactivos
│   │   ├── Home.vue             # Creador de salas + unirse con código
│   │   ├── Game.vue             # Orquestador principal (WebSocket)
│   │   ├── Lobby.vue            # Sala de espera pre-juego
│   │   ├── QuestionCard.vue     # Pregunta + opciones + timer
│   │   ├── PlayerList.vue       # Lista de jugadores en tiempo real
│   │   └── Results.vue          # Pantalla final + ganador
│   ├── party/
│   │   └── game.ts              # Servidor PartyKit (lógica del juego)
│   ├── data/
│   │   └── questions.json       # Banco de 100 preguntas
│   ├── types/
│   │   └── game.ts              # Tipos TypeScript compartidos
│   ├── layouts/
│   │   └── Layout.astro         # Layout base con meta tags
│   └── styles/
│       └── global.css           # CSS global + custom properties
├── public/
│   └── images/
│       └── questions/           # Imágenes SVG de preguntas visuales
├── astro.config.mjs             # Configuración de Astro
├── partykit.json                # Configuración de PartyKit
├── tsconfig.json                # Configuración de TypeScript
├── .prettierrc.json             # Configuración de Prettier
├── package.json
└── pnpm-lock.yaml
```

### Arquitectura de componentes

```
index.astro (Landing)
    └─▶ Home.vue (client:load)

sala.astro (Game page)
    └─▶ Game.vue (client:only="vue") ─── WebSocket ─── PartyKit Server
            ├─▶ Lobby.vue
            ├─▶ QuestionCard.vue
            ├─▶ PlayerList.vue
            └─▶ Results.vue
```

### Flujo de estados del juego

```
LOBBY (esperando jugadores)
    └─[host inicia]─▶ COUNTDOWN (3-2-1)
                          └─▶ QUESTION (respuestas en tiempo real)
                                  └─▶ REVEAL (mostrar respuestas)
                                          └─▶ ELIMINATION (animación)
                                                  └─▶ QUESTION (siguiente ronda)
                                                      o GAME_OVER (fin)
```

---

## 📄 Licencia

Este proyecto está bajo la licencia **MIT**.

---

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Haz fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/amazing-feature`)
3. Commit tus cambios (`git commit -m 'Add: nueva característica'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

---

## 📧 Contacto

¿Preguntas o sugerencias? Abre un [issue](https://github.com/tu-usuario/el-uno-por-ciento/issues) en GitHub.

---

**Hecho con ❤️ y mucha lógica**
