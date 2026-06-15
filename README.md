# 🚀 Back-Rocket Server (Backend)

Este repositorio contiene el servidor backend para **Rocket 2D**, un juego multijugador en tiempo real de esquivar obstáculos y supervivencia espacial. El backend está construido utilizando **Node.js**, **Express**, **TypeScript** y **Socket.io** para gestionar la sincronización de las naves en tiempo real y el estado del juego.

---

## 📋 Tabla de Contenidos
1. [Características Principales](#-características-principales)
2. [Estructura del Proyecto](#-estructura-del-proyecto)
3. [Instalación y Ejecución](#-instalación-y-ejecución)
4. [Eventos WebSocket](#-eventos-websocket)
5. [Estructuras de Datos (Interfaces)](#-estructuras-de-datos-interfaces)
6. [Flujo del Juego](#-flujo-del-juego)
7. [Modos de Juego](#-modos-de-juego)
8. [Health Check y CORS](#-health-check-y-cors)

---

## 🌟 Características Principales

- **Game Loop en el Servidor**: Emisión periódica a **~30 FPS** (`TICK_RATE = 30` / cada 33ms) para sincronizar las posiciones y velocidades de todos los jugadores.
- **Gestión Dinámica de Salas**: Creación de salas privadas con un código único de 6 caracteres generado aleatoriamente.
- **Control de Host**: El primer jugador en crear la sala se convierte en el Host y tiene control sobre el inicio del juego y la configuración del modo de juego.
- **Traspaso de Host automático**: Si el Host actual se desconecta, el servidor asigna el rol de Host al siguiente jugador en la sala de forma automática.
- **Lógica Multijugador Síncrona**: Gestión de vidas, colisiones/muertes e hitos de victoria de cada jugador con lógica centralizada.

---

## 📁 Estructura del Proyecto

El código está estructurado de manera modular y limpia en el directorio `src/`:

```
src/
├── server.ts                 # Configuración del servidor HTTP, Socket.io y rutas básicas
├── game/
│   ├── GameState.ts          # Lógica principal del estado del juego y loops por sala (room)
│   ├── Player.ts             # Representación y estado de cada jugador individual
│   └── RoomManager.ts        # Patrón Singleton para crear, obtener y eliminar salas
├── handlers/
│   ├── connection.ts         # Manejadores de conexión Socket.io, creación, unión e inicio de juego
│   └── gameEvents.ts         # Manejo de inputs de juego de cada jugador (movimiento, muertes, metas)
├── types/
│   └── index.ts              # Tipos de TypeScript e interfaces para Socket.io y modelos
└── utils/
    └── constants.ts          # Constantes globales (puerto, ticks, etc.)
```

---

## ⚙️ Instalación y Ejecución

### Requisitos Previos
- [Node.js](https://nodejs.org/) (Versión 18 o superior recomendada)
- [pnpm](https://pnpm.io/) (Recomendado) o `npm`/`yarn`

### Pasos de Configuración

1. **Instalar las dependencias:**
   ```bash
   pnpm install
   ```

2. **Iniciar en entorno de desarrollo (con hot-reload/recarga en vivo):**
   ```bash
   pnpm run dev:server
   ```
   *Nota: También puedes usar `pnpm run dev`.*

3. **Compilar el proyecto para producción:**
   ```bash
   pnpm run build
   ```

4. **Iniciar en entorno de producción (después de compilar):**
   ```bash
   pnpm start
   ```

El servidor se ejecutará de manera predeterminada en el puerto **3000** (`http://localhost:3000`).

---

## 🔌 Eventos WebSocket

La comunicación bidireccional utiliza los siguientes eventos definidos en [src/types/index.ts](file:///c:/Users/Robootics/Desktop/back-rocket/src/types/index.ts):

### 📥 Eventos del Cliente al Servidor (ClientToServerEvents)

| Evento | Parámetros | Descripción |
| :--- | :--- | :--- |
| `create_room` | `(selectedShip?, playerName?)` | Crea una nueva sala. El jugador emisor se convierte en el Host. |
| `join_room` | `(roomId, selectedShip?, playerName?)` | Se une a una sala existente mediante su identificador. |
| `start_game` | *(ninguno)* | Inicia la partida. Solo permitido para el Host de la sala. |
| `player_input` | `(input: PlayerInput)` | Envía continuamente las coordenadas, rotación y velocidad de la nave. |
| `player_died` | *(ninguno)* | Notifica al servidor que el jugador se ha estrellado/muerto. |
| `player_life_lost`| `(lives: number)` | Notifica que el jugador perdió una vida y actualiza su contador restante. |
| `player_finished` | *(ninguno)* | Notifica que el jugador ha completado la pista/nivel actual. |
| `player_victory` | `(levelNumber: number)` | Registra la victoria del jugador en el nivel especificado. |
| `change_game_mode`| `(mode: 'classic' \| 'survival')` | Cambia el modo de juego (Classic o Survival). Solo Host. |
| `return_to_lobby` | *(ninguno)* | Reinicia el juego y devuelve a todos los jugadores a la sala. Solo Host. |

### 📤 Eventos del Servidor al Cliente (ServerToClientEvents)

| Evento | Parámetros | Descripción |
| :--- | :--- | :--- |
| `room_state_update` | `(roomState: RoomState)` | Envía el estado actualizado de la sala (jugadores, host, si está activo, modo). |
| `game_started` | `(roomState: RoomState)` | Notifica a todos los clientes que la partida ha comenzado formalmente. |
| `game_tick` | `(players: PlayerState[])` | Envía la información de posición/estado de todos los jugadores (~30 FPS). |
| `player_disconnected`| `(playerId: string)` | Notifica que un jugador se ha desconectado de la sala. |
| `opponent_lost` | `(loserId: string)` | Notifica que un oponente ha perdido todas sus vidas. |
| `player_reached_earth`| `(playerId: string, levelNumber: number)` | Notifica que un jugador específico ha llegado a la meta (Tierra). |
| `room_level_advance`| `(levelNumber: number)` | Avisa que todos han llegado y se avanza al siguiente nivel de dificultad. |
| `survival_victory` | `(data: { winnerId, winnerName, reason, distance? })` | Declara un ganador en el modo Survival y el motivo de la victoria. |
| `returned_to_lobby`| *(ninguno)* | Notifica a los jugadores que el juego fue detenido y volvieron al lobby. |
| `error` | `(message: string)` | Envía mensajes de error específicos (ej: sala llena, sala no encontrada). |

---

## 📊 Estructuras de Datos (Interfaces)

### `PlayerState`
Representa el estado actual de un jugador sincronizado por el servidor:
```typescript
interface PlayerState {
  id: string;            // ID único del socket
  name?: string;         // Nombre del jugador
  x: number;             // Posición en X
  y: number;             // Posición en Y
  rotation: number;      // Rotación de la nave
  vx: number;            // Velocidad vectorial en X
  vy: number;            // Velocidad vectorial en Y
  isAlive: boolean;      // Indica si la nave está activa y viva
  selectedShip?: string; // ID del modelo de nave seleccionado
  lives: number;         // Vidas restantes
  finished?: boolean;    // Indica si cruzó la meta
}
```

### `PlayerInput`
Estructura de entrada que el cliente debe emitir regularmente para actualizar sus coordenadas:
```typescript
interface PlayerInput {
  x: number;
  y: number;
  rotation: number;
  vx: number;
  vy: number;
}
```

### `RoomState`
Información detallada de la sala:
```typescript
interface RoomState {
  id: string;                     // ID de la sala (Ej: "B4X9T2")
  hostId: string;                 // ID del socket del Host
  players: PlayerState[];         // Arreglo con el estado de todos los jugadores
  isPlaying: boolean;             // Indica si hay una partida en curso
  gameMode?: 'classic' | 'survival'; // Modo de juego seleccionado
}
```

---

## 🎮 Flujo del Juego

1. **Creación/Conexión**:
   - Un cliente emite `create_room`. El servidor inicializa una instancia de `GameState` en el `RoomManager`, genera el ID de la sala y asigna a este cliente como `hostId`.
   - Otros clientes se unen emitiendo `join_room` con el ID de la sala.
2. **Preparación**:
   - Los jugadores eligen su tipo de nave (`selectedShip`) y nombre, los cuales se transmiten y actualizan para todos mediante `room_state_update`.
   - El host puede llamar a `change_game_mode` para elegir entre clásico y supervivencia.
3. **Inicio**:
   - El Host envía `start_game`. El servidor inicializa el loop periódico (`setInterval`) a unos 33 milisegundos (`TICK_INTERVAL`) y emite `game_started`.
4. **Durante la partida**:
   - El cliente es autoritativo respecto a su posición: calcula su física localmente y emite constantemente su posición a través de `player_input`.
   - El servidor actualiza el modelo en `Player` y en cada "tick" emite `game_tick` con el estado consolidado de todos los jugadores para que los clientes rendericen a sus oponentes.
5. **Finalización del nivel/partida**:
   - Los eventos de muerte (`player_died`) o meta (`player_finished` / `player_victory`) son procesados en tiempo real por el servidor para comprobar las condiciones de victoria o fin de partida de acuerdo al modo seleccionado.

---

## 🏆 Modos de Juego

### 1. Modo Clásico (`classic`)
- Diseñado para avanzar cooperativamente.
- Los jugadores disponen de vidas para superar los niveles.
- Al llegar todos a la Tierra (`player_victory`), el servidor avanza automáticamente de nivel (`room_level_advance`), restableciendo vidas a los jugadores.

### 2. Modo Supervivencia (`survival`)
- Modo competitivo de eliminación.
- Cada jugador inicia con **1 única vida**.
- **Victoria por último en pie (`last_standing`)**: Si solo queda un jugador vivo en la sala, es declarado ganador automáticamente.
- **Victoria por distancia (`max_distance`)**: Si todos los jugadores mueren, el servidor compara la distancia en X alcanzada (`player.x`) y declara ganador a quien llegó más lejos en el mapa.

---

## 🏥 Health Check y CORS

- **Health Check**: El servidor expone una ruta pública simple de tipo HTTP GET para comprobar su estado de disponibilidad en entornos de hosting/despliegue:
  - **Endpoint**: `GET http://localhost:3000/health`
  - **Respuesta**: `{"status": "ok", "message": "Server is running"}`
  - **CORS**: Configurado con origen permisivo `"*"` y métodos `GET, POST` en [src/server.ts](file:///c:/Users/Robootics/Desktop/back-rocket/src/server.ts) para facilitar el desarrollo local con frontends ejecutándose en puertos diferentes (ej: Vite en `localhost:5173`).
