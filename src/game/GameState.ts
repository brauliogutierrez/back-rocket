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
  private tickInterval?: NodeJS.Timeout;
  private io: GameSocketServer;

  constructor(id: string, hostId: string, io: GameSocketServer) {
    this.id = id;
    this.hostId = hostId;
    this.players = new Map();
    this.isPlaying = false;
    this.io = io;
  }

  public addPlayer(id: string, selectedShip?: string): void {
    if (!this.players.has(id)) {
      this.players.set(id, new Player(id, selectedShip));
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
  }

  public startGame(): void {
    if (this.isPlaying) return;
    this.isPlaying = true;

    // Reset players for a new game
    for (const player of this.players.values()) {
      player.isAlive = true;
      // You could also reset positions here
    }

    this.io.to(this.id).emit("game_started");

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

    // In a fully authoritative server, we would step physics here.
    // For now, we just broadcast the latest state of all players.
    
    const playersState: PlayerState[] = [];
    for (const player of this.players.values()) {
      playersState.push(player.getState());
    }

    this.io.to(this.id).emit("game_tick", playersState);
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
    };
  }
}
