import { Socket, Server } from "socket.io";
import { RoomManager } from "../game/RoomManager";
import { ServerToClientEvents, ClientToServerEvents, InterServerEvents, SocketData, PlayerInput } from "../types";

type GameSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export function registerGameHandlers(io: Server, socket: GameSocket) {
  socket.on("player_input", (input: PlayerInput) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    const roomManager = RoomManager.getInstance();
    const room = roomManager.getRoom(roomId);
    
    if (room && room.isPlaying) {
      room.applyPlayerInput(socket.id, input);
    }
  });

  socket.on("player_died", () => {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    const roomManager = RoomManager.getInstance();
    const room = roomManager.getRoom(roomId);
    
    if (room && room.isPlaying) {
      room.setPlayerDead(socket.id);
      // Let everyone know about state change
      io.to(roomId).emit("room_state_update", room.getRoomState());
    }
  });

  socket.on("player_finished", () => {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    const roomManager = RoomManager.getInstance();
    const room = roomManager.getRoom(roomId);
    
    if (room && room.isPlaying) {
      const player = room.getPlayer(socket.id);
      if (player) {
        player.finish();
        // Additional finish logic (leaderboard, end game if all finished)
      }
    }
  });
}
