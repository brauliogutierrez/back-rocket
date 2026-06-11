# 🚀 Estructura del Backend - Back-Rocket

Documentación de la arquitectura y estructura del servidor backend para que el frontend pueda integrarse correctamente.

---

## 📋 Descripción General

El backend es un servidor **Node.js + Express + Socket.io** que gestiona un juego en tiempo real con múltiples salas (rooms) y jugadores. La comunicación se realiza mediante WebSockets para sincronización en tiempo real del estado del juego.

**Stack Técnico:**
- Node.js con TypeScript
- Express (servidor HTTP)
- Socket.io (comunicación en tiempo real)
- Game Loop con ticks periódicos

---

## 📁 Estructura de Carpetas

```
src/
├── server.ts                 # Punto de entrada principal
├── game/
│   ├── GameState.ts         # Lógica del estado del juego por sala
│   ├── Player.ts            # Clase del jugador individual
│   └── RoomManager.ts       # Gestor de salas y jugadores
├── handlers/
│   ├── connection.ts        # Manejadores de conexión WebSocket
│   └── gameEvents.ts        # Manejadores de eventos del juego
├── types/
│   └── index.ts            # Interfaces y tipos TypeScript compartidos
└── utils/
    └── constants.ts         # Constantes de configuración
```

---

## 🔌 Eventos WebSocket

### 📤 Eventos del Cliente al Servidor (ClientToServerEvents)

El cliente **envía** estos eventos al servidor:

| Evento | Parámetros | Descripción |
|--------|-----------|------------|
| `create_room` | `selectedShip?: string` | Crear una nueva sala (usuario es host) |
| `join_room` | `roomId: string, selectedShip?: string` | Unirse a una sala existente |
| `start_game` | — | Iniciar el juego (solo host puede hacerlo) |
| `player_input` | `input: PlayerInput` | Enviar input del jugador (movimiento, rotación) |
| `player_died` | — | Notificar que el jugador murió |
| `player_finished` | — | Notificar que el jugador terminó |

### 📥 Eventos del Servidor al Cliente (ServerToClientEvents)

El servidor **envía** estos eventos al cliente:

| Evento | Datos | Descripción |
|--------|-------|------------|
| `room_state_update` | `RoomState` | Estado actual de la sala (jugadores, configuración) |
| `game_tick` | `PlayerState[]` | Update de posiciones de todos los jugadores |
| `player_disconnected` | `playerId: string` | Un jugador se desconectó |
| `game_started` | — | El juego ha comenzado |
| `error` | `message: string` | Mensaje de error del servidor |

---

## 📊 Tipos de Datos

### PlayerState
Representa el estado de un jugador en el juego:

```typescript
interface PlayerState {
  id: string;           // ID único del socket
  x: number;            // Posición X
  y: number;            // Posición Y
  rotation: number;     // Ángulo de rotación (0-360)
  vx: number;           // Velocidad X
  vy: number;           // Velocidad Y
  isAlive: boolean;     // ¿El jugador está vivo?
  selectedShip?: string; // Modelo de nave seleccionado
}
```

### PlayerInput
Input que envía el cliente en cada frame:

```typescript
interface PlayerInput {
  x: number;       // Posición X actual
  y: number;       // Posición Y actual
  rotation: number; // Rotación actual
  vx: number;      // Velocidad X
  vy: number;      // Velocidad Y
}
```

### RoomState
Estado completo de una sala:

```typescript
interface RoomState {
  id: string;        // ID de la sala
  hostId: string;    // ID del usuario host
  players: PlayerState[]; // Lista de jugadores en la sala
  isPlaying: boolean; // ¿El juego está en curso?
}
```

---

## 🎮 Flujo de Juego

### 1. Crear/Unirse a una Sala

```
Cliente                          Servidor
  |                                |
  |--- create_room() ------------>|
  |                                | Crea GameState
  |                                | Genera roomId
  |<----- room_state_update -------|
  |
```

### 2. Iniciar Juego

```
Cliente (Host)                   Servidor
  |                                |
  |--- start_game() ------------->|
  |                                | Inicia game loop
  |<----- game_started ------------|
  |<----- game_tick (30 FPS) ------|
```

### 3. Durante el Juego

```
Cliente                          Servidor
  |                                |
  |--- player_input() ----------->| (cada frame)
  |<----- game_tick() -------------|
  |                                |
```

### 4. Finalización

```
Cliente                          Servidor
  |                                |
  |--- player_died() ------------>| Marca jugador como muerto
  |    o                           |
  |--- player_finished() -------->| Marca jugador como terminado
  |                                |
```

---

## ⚙️ Configuración y Constantes

### Puerto y Ticks

```typescript
// utils/constants.ts
PORT = 3000              // Puerto del servidor
TICK_INTERVAL = 33ms     // ~30 FPS (1000/30)
```

### CORS

El servidor acepta conexiones desde cualquier origen (configurado para desarrollo):

```typescript
cors: {
  origin: "*",
  methods: ["GET", "POST"]
}
```

⚠️ **Nota:** En producción, cambiar `origin` a la URL específica del frontend.

---

## 🏥 Health Check

**GET** `/health` - Verificar que el servidor está en línea

```json
Response: {
  "status": "ok",
  "message": "Server is running"
}
```

---

## 🎯 Guía de Integración Frontend

### 1. Conectar al Servidor

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('Conectado al servidor');
});
```

### 2. Crear una Sala

```javascript
socket.emit('create_room', 'rocket-blue'); // Parámetro opcional: nave seleccionada

socket.on('room_state_update', (roomState) => {
  console.log('Estado de la sala:', roomState);
});
```

### 3. Unirse a una Sala

```javascript
socket.emit('join_room', 'ROOM_ID', 'rocket-red');

socket.on('room_state_update', (roomState) => {
  console.log('Te has unido a la sala:', roomState);
});
```

### 4. Iniciar Juego (solo host)

```javascript
socket.emit('start_game');

socket.on('game_started', () => {
  console.log('¡El juego ha comenzado!');
});
```

### 5. Enviar Input del Jugador

```javascript
// En cada frame del cliente
socket.emit('player_input', {
  x: playerX,
  y: playerY,
  rotation: playerRotation,
  vx: velocityX,
  vy: velocityY
});

// Recibir updates de todos los jugadores
socket.on('game_tick', (players) => {
  // Actualizar posiciones de jugadores
  players.forEach(player => {
    updatePlayerPosition(player);
  });
});
```

### 6. Manejar Desconexiones

```javascript
socket.on('player_disconnected', (playerId) => {
  console.log('Jugador desconectado:', playerId);
  // Remover del UI
});

socket.on('error', (message) => {
  console.error('Error del servidor:', message);
});
```

---

## 🔄 Game Loop y Sincronización

- **Tick Interval:** 33ms (~30 FPS)
- El servidor emite `game_tick` a todos los jugadores en la sala
- Cada tick contiene el estado actualizado de todos los jugadores
- El cliente debe interpolar posiciones entre ticks para suavidad visual

---

## 🚀 Iniciar el Servidor

```bash
# Desarrollo (con hot-reload)
npm run dev

# Producción
npm run build
npm start
```

---

## 📝 Notas Importantes

1. **Room ID:** Se genera automáticamente en el servidor con formato único
2. **Socket ID:** Cada cliente obtiene un ID único al conectarse
3. **Host:** El usuario que crea la sala es automáticamente el host
4. **Validación:** El servidor valida que solo el host puede iniciar el juego
5. **Sincronización:** Los clientes deben enviar input constantemente para que el servidor actualice sus posiciones

---

## ❓ Preguntas Frecuentes

**P: ¿Cómo sé si me conecté exitosamente?**
- Escucha el evento `connect` en el socket

**P: ¿Puedo cambiar de sala mientras estoy en una?**
- No, debes desconectarte y crear/unirte a otra sala

**P: ¿Cuántos jugadores puede tener una sala?**
- No hay límite configurado en el backend (puede modificarse en `RoomManager`)

**P: ¿Qué pasa si el host se desconecta?**
- Los otros jugadores recibirán `player_disconnected`

---

**Última actualización:** 2026-06-11  
**Versión del Backend:** 1.0.0
