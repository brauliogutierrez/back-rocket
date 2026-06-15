"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupConnectionHandlers = setupConnectionHandlers;
const RoomManager_1 = require("../game/RoomManager");
const gameEvents_1 = require("./gameEvents");
function setupConnectionHandlers(io) {
    io.on("connection", (socket) => {
        console.log(`[+] User connected: ${socket.id}`);
        const roomManager = RoomManager_1.RoomManager.getInstance();
        socket.on("create_room", (selectedShip, playerName) => {
            const roomId = roomManager.generateRoomId();
            const room = roomManager.createRoom(roomId, socket.id);
            socket.join(roomId);
            socket.data.roomId = roomId;
            socket.data.selectedShip = selectedShip;
            socket.data.playerName = playerName;
            room.addPlayer(socket.id, playerName, selectedShip);
            io.to(roomId).emit("room_state_update", room.getRoomState());
            console.log(`[Room] ${socket.id} (Name: ${playerName || 'anon'}) created and joined room ${roomId}`);
        });
        socket.on("join_room", (roomId, selectedShip, playerName) => {
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
            socket.data.playerName = playerName;
            room.addPlayer(socket.id, playerName, selectedShip);
            io.to(roomId).emit("room_state_update", room.getRoomState());
            console.log(`[Room] ${socket.id} (Name: ${playerName || 'anon'}) joined room ${roomId}`);
        });
        socket.on("start_game", () => {
            const roomId = socket.data.roomId;
            if (!roomId)
                return;
            const room = roomManager.getRoom(roomId);
            if (room && room.hostId === socket.id) {
                room.startGame();
                console.log(`[Game] Room ${roomId} started`);
            }
            else {
                socket.emit("error", "Only the host can start the game");
            }
        });
        socket.on("player_life_lost", (lives) => {
            const roomId = socket.data.roomId;
            if (!roomId)
                return;
            const room = roomManager.getRoom(roomId);
            if (room) {
                room.playerLifeLost(socket.id, lives);
                io.to(roomId).emit("room_state_update", room.getRoomState());
            }
        });
        socket.on("player_victory", (levelNumber) => {
            const roomId = socket.data.roomId;
            if (!roomId)
                return;
            const room = roomManager.getRoom(roomId);
            if (room) {
                room.playerVictory(socket.id, levelNumber);
                io.to(roomId).emit("room_state_update", room.getRoomState());
            }
        });
        socket.on("change_game_mode", (mode) => {
            const roomId = socket.data.roomId;
            if (!roomId)
                return;
            const room = roomManager.getRoom(roomId);
            if (room && room.hostId === socket.id) {
                room.changeGameMode(mode);
                io.to(roomId).emit("room_state_update", room.getRoomState());
                console.log(`[Room] Game mode changed in room ${roomId} to: ${mode}`);
            }
        });
        socket.on("return_to_lobby", () => {
            const roomId = socket.data.roomId;
            if (!roomId)
                return;
            const room = roomManager.getRoom(roomId);
            if (room && room.hostId === socket.id) {
                room.returnToLobby();
                io.to(roomId).emit("room_state_update", room.getRoomState());
                console.log(`[Room] Host reset room ${roomId} to lobby`);
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
                    }
                    else if (room.hostId === socket.id) {
                        // Assign new host
                        const newHostId = Array.from(room.players.keys())[0];
                        room.hostId = newHostId;
                        io.to(roomId).emit("room_state_update", room.getRoomState());
                        console.log(`[Room] Room ${roomId} host changed to ${newHostId}`);
                    }
                    else {
                        io.to(roomId).emit("room_state_update", room.getRoomState());
                    }
                    room.handleSurvivalEndCheck();
                }
            }
        });
        // Register other event groups
        (0, gameEvents_1.registerGameHandlers)(io, socket);
    });
}
