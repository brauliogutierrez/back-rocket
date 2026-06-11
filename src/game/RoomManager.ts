import { GameState } from "./GameState";
import { Server, Socket } from "socket.io";
import { ServerToClientEvents, ClientToServerEvents, InterServerEvents, SocketData } from "../types";

type GameSocketServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export class RoomManager {
  private static instance: RoomManager;
  private rooms: Map<string, GameState>;
  private io?: GameSocketServer;

  private constructor() {
    this.rooms = new Map();
  }

  public static getInstance(): RoomManager {
    if (!RoomManager.instance) {
      RoomManager.instance = new RoomManager();
    }
    return RoomManager.instance;
  }

  public setIo(io: GameSocketServer) {
    this.io = io;
  }

  public createRoom(roomId: string, hostId: string): GameState {
    if (!this.io) throw new Error("IO not initialized");
    
    const gameState = new GameState(roomId, hostId, this.io);
    this.rooms.set(roomId, gameState);
    return gameState;
  }

  public getRoom(roomId: string): GameState | undefined {
    return this.rooms.get(roomId);
  }

  public removeRoom(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (room) {
      room.stopGame();
      this.rooms.delete(roomId);
    }
  }

  public generateRoomId(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }
}
