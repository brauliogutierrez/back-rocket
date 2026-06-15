import { Player } from "./Player";
import { PlayerInput, PlayerState, RoomState } from "../types";
import { Server } from "socket.io";
import { TICK_INTERVAL } from "../utils/constants";
import { ServerToClientEvents, ClientToServerEvents, InterServerEvents, SocketData } from "../types";

type GameSocketServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export class GameState {
  public id: string;
  public hostId: string;
  public players: Map<string, Player>;
  public isPlaying: boolean;
  public gameMode: 'classic' | 'survival';
  public currentLevel: number;
  private tickInterval?: NodeJS.Timeout;
  private io: GameSocketServer;

  constructor(id: string, hostId: string, io: GameSocketServer) {
    this.id = id;
    this.hostId = hostId;
    this.players = new Map();
    this.isPlaying = false;
    this.gameMode = 'survival';
    this.currentLevel = 0;
    this.io = io;
  }

  public addPlayer(id: string, name?: string, selectedShip?: string): void {
    if (!this.players.has(id)) {
      this.players.set(id, new Player(id, name, selectedShip));
    }
  }

  public removePlayer(id: string): void {
    this.players.delete(id);
  }

  public getPlayer(id: string): Player | undefined {
    return this.players.get(id);
  }

  public applyPlayerInput(id: string, input: PlayerInput): void {
    const player = this.players.get(id);
    if (player) {
      player.applyInput(input);
    }
  }

  public setPlayerDead(id: string): void {
    const player = this.players.get(id);
    if (player) {
      player.die();
    }
    this.handleSurvivalEndCheck();
  }

  public playerLifeLost(id: string, livesRemaining: number): void {
    const player = this.players.get(id);
    if (player) {
      player.lives = livesRemaining;
      if (livesRemaining <= 0) {
        player.isAlive = false;
        console.log(`[GameState] Player ${id} lost all lives`);
        this.io.to(this.id).emit('opponent_lost', id);
      }
    }
    this.handleSurvivalEndCheck();
  }

  public playerVictory(id: string, levelNumber: number): void {
    const player = this.players.get(id);
    if (player) {
      player.finished = true;
    }
    this.io.to(this.id).emit('player_reached_earth', id, levelNumber);

    // Check if ALL players have reached Earth
    const playersArray = Array.from(this.players.values());
    const allReachedEarth = playersArray.every(p => p.finished);
    if (allReachedEarth) {
      this.currentLevel += 1;
      playersArray.forEach(p => {
        p.finished = false; // Reset for next level
        p.lives = 3; // Restore lives for next level (classic)
      });
      console.log(`[GameState] ALL players reached Earth! Advancing to level ${this.currentLevel}`);
      this.io.to(this.id).emit('room_level_advance', this.currentLevel);
      this.io.to(this.id).emit('room_state_update', this.getRoomState());
    }
  }

  public changeGameMode(mode: 'classic' | 'survival'): void {
    if (this.isPlaying) return;
    this.gameMode = mode;
  }

  public returnToLobby(): void {
    this.stopGame();
    this.currentLevel = 0;
    for (const player of this.players.values()) {
      player.isAlive = true;
      player.finished = false;
      player.lives = 1;
      player.x = 0;
      player.y = 0;
    }
    this.io.to(this.id).emit('returned_to_lobby');
  }

  public startGame(): void {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.currentLevel = 0;

    // Reset players for a new game
    for (const player of this.players.values()) {
      player.isAlive = true;
      player.finished = false;
      player.lives = 1; // 1 life in survival
      player.x = 0;
      player.y = 0;
    }

    this.io.to(this.id).emit("game_started", this.getRoomState());

    this.tickInterval = setInterval(() => {
      this.tick();
    }, TICK_INTERVAL);
  }

  public stopGame(): void {
    this.isPlaying = false;
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = undefined;
    }
  }

  private tick(): void {
    if (!this.isPlaying) return;

    const playersState: PlayerState[] = [];
    for (const player of this.players.values()) {
      playersState.push(player.getState());
    }

    this.io.to(this.id).emit("game_tick", playersState);
  }

  public handleSurvivalEndCheck(): void {
    if (!this.isPlaying || this.gameMode !== 'survival') return;

    const playersArray = Array.from(this.players.values());
    const alivePlayers = playersArray.filter(p => p.isAlive && p.lives > 0);

    if (alivePlayers.length === 0) {
      this.stopGame();
      if (playersArray.length > 0) {
        let winner = playersArray[0];
        playersArray.forEach(p => {
          if (p.x > winner.x) {
            winner = p;
          }
        });
        console.log(`[Survival] All players died. Winner by distance: ${winner.name} at x=${winner.x}`);
        this.io.to(this.id).emit('survival_victory', {
          winnerId: winner.id,
          winnerName: winner.name,
          reason: 'max_distance',
          distance: Math.floor(winner.x / 10)
        });
      }
    }
  }

  public getRoomState(): RoomState {
    const playersState: PlayerState[] = [];
    for (const player of this.players.values()) {
      playersState.push(player.getState());
    }
    return {
      id: this.id,
      hostId: this.hostId,
      players: playersState,
      isPlaying: this.isPlaying,
      gameMode: this.gameMode,
    };
  }
}
