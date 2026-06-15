"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerGameHandlers = registerGameHandlers;
const RoomManager_1 = require("../game/RoomManager");
function registerGameHandlers(io, socket) {
    socket.on("player_input", (input) => {
        const roomId = socket.data.roomId;
        if (!roomId)
            return;
        const roomManager = RoomManager_1.RoomManager.getInstance();
        const room = roomManager.getRoom(roomId);
        if (room && room.isPlaying) {
            room.applyPlayerInput(socket.id, input);
        }
    });
    socket.on("player_died", () => {
        const roomId = socket.data.roomId;
        if (!roomId)
            return;
        const roomManager = RoomManager_1.RoomManager.getInstance();
        const room = roomManager.getRoom(roomId);
        if (room && room.isPlaying) {
            room.setPlayerDead(socket.id);
            // Let everyone know about state change
            io.to(roomId).emit("room_state_update", room.getRoomState());
        }
    });
    socket.on("player_finished", () => {
        const roomId = socket.data.roomId;
        if (!roomId)
            return;
        const roomManager = RoomManager_1.RoomManager.getInstance();
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
