import { Server, Socket } from "socket.io";
import { ServerToClientEvents, ClientToServerEvents, InterServerEvents, SocketData } from "../types";
import { RoomManager } from "../game/RoomManager";
import { registerGameHandlers } from "./gameEvents";

type GameSocketServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type GameSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export function setupConnectionHandlers(io: GameSocketServer) {
  io.on("connection", (socket: GameSocket) => {
    console.log(`[+] User connected: ${socket.id}`);

    const roomManager = RoomManager.getInstance();

    socket.on("create_room", (selectedShip?: string) => {
      const roomId = roomManager.generateRoomId();
      const room = roomManager.createRoom(roomId, socket.id);
      
      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.selectedShip = selectedShip;

      room.addPlayer(socket.id, selectedShip);

      io.to(roomId).emit("room_state_update", room.getRoomState());
      console.log(`[Room] ${socket.id} created and joined room ${roomId}`);
    });

    socket.on("join_room", (roomId: string, selectedShip?: string) => {
      const room = roomManager.getRoom(roomId);
      
      if (!room) {
        socket.emit("error", "Room not found");
        return;
      }

      if (room.isPlaying) {
        socket.emit("error", "Game already started");
        return;
      }

      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.selectedShip = selectedShip;
      
      room.addPlayer(socket.id, selectedShip);
      
      io.to(roomId).emit("room_state_update", room.getRoomState());
      console.log(`[Room] ${socket.id} joined room ${roomId}`);
    });

    socket.on("start_game", () => {
      const roomId = socket.data.roomId;
      if (!roomId) return;

      const room = roomManager.getRoom(roomId);
      if (room && room.hostId === socket.id) {
        room.startGame();
        console.log(`[Game] Room ${roomId} started`);
      } else {
        socket.emit("error", "Only the host can start the game");
      }
    });

    socket.on("disconnect", () => {
      console.log(`[-] User disconnected: ${socket.id}`);
      
      const roomId = socket.data.roomId;
      if (roomId) {
        const room = roomManager.getRoom(roomId);
        if (room) {
          room.removePlayer(socket.id);
          io.to(roomId).emit("player_disconnected", socket.id);
          
          if (room.players.size === 0) {
            roomManager.removeRoom(roomId);
            console.log(`[Room] Room ${roomId} closed (empty)`);
          } else if (room.hostId === socket.id) {
            // Assign new host
            const newHostId = Array.from(room.players.keys())[0];
            room.hostId = newHostId;
            io.to(roomId).emit("room_state_update", room.getRoomState());
            console.log(`[Room] Room ${roomId} host changed to ${newHostId}`);
          } else {
            io.to(roomId).emit("room_state_update", room.getRoomState());
          }
        }
      }
    });

    // Register other event groups
    registerGameHandlers(io, socket);
  });
}
