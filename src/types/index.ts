export interface PlayerState {
  id: string;
  x: number;
  y: number;
  rotation: number;
  vx: number;
  vy: number;
  isAlive: boolean;
  selectedShip?: string;
}

export interface PlayerInput {
  x: number;
  y: number;
  rotation: number;
  vx: number;
  vy: number;
}

export interface RoomState {
  id: string;
  hostId: string;
  players: PlayerState[];
  isPlaying: boolean;
}

// Events sent from the server to the client
export interface ServerToClientEvents {
  room_state_update: (roomState: RoomState) => void;
  game_tick: (players: PlayerState[]) => void;
  player_disconnected: (playerId: string) => void;
  game_started: () => void;
  error: (message: string) => void;
}

// Events sent from the client to the server
export interface ClientToServerEvents {
  create_room: (selectedShip?: string) => void;
  join_room: (roomId: string, selectedShip?: string) => void;
  start_game: () => void;
  player_input: (input: PlayerInput) => void;
  player_died: () => void;
  player_finished: () => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  roomId?: string;
  selectedShip?: string;
}
