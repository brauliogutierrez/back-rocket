export interface PlayerState {
  id: string;
  x: number;
  y: number;
  rotation: number;
  vx: number;
  vy: number;
  isAlive: boolean;
  selectedShip?: string;
  lives: number;
  name?: string;
  finished?: boolean;
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
  gameMode?: 'classic' | 'survival';
}

// Events sent from the server to the client
export interface ServerToClientEvents {
  room_state_update: (roomState: RoomState) => void;
  game_tick: (players: PlayerState[]) => void;
  player_disconnected: (playerId: string) => void;
  game_started: (roomState: RoomState) => void;
  error: (message: string) => void;
  opponent_lost: (loserId: string) => void;
  opponent_victory: (winnerId: string, levelNumber: number) => void;
  player_reached_earth: (playerId: string, levelNumber: number) => void;
  room_level_advance: (levelNumber: number) => void;
  survival_victory: (data: { winnerId: string; winnerName: string; reason: string; distance?: number }) => void;
  returned_to_lobby: () => void;
}

// Events sent from the client to the server
export interface ClientToServerEvents {
  create_room: (selectedShip?: string, playerName?: string) => void;
  join_room: (roomId: string, selectedShip?: string, playerName?: string) => void;
  start_game: () => void;
  player_input: (input: PlayerInput) => void;
  player_died: () => void;
  player_finished: () => void;
  player_life_lost: (lives: number) => void;
  player_victory: (levelNumber: number) => void;
  change_game_mode: (mode: 'classic' | 'survival') => void;
  return_to_lobby: () => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  roomId?: string;
  selectedShip?: string;
  playerName?: string;
}
