"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomManager = void 0;
const GameState_1 = require("./GameState");
class RoomManager {
    static instance;
    rooms;
    io;
    constructor() {
        this.rooms = new Map();
    }
    static getInstance() {
        if (!RoomManager.instance) {
            RoomManager.instance = new RoomManager();
        }
        return RoomManager.instance;
    }
    setIo(io) {
        this.io = io;
    }
    createRoom(roomId, hostId) {
        if (!this.io)
            throw new Error("IO not initialized");
        const gameState = new GameState_1.GameState(roomId, hostId, this.io);
        this.rooms.set(roomId, gameState);
        return gameState;
    }
    getRoom(roomId) {
        return this.rooms.get(roomId);
    }
    removeRoom(roomId) {
        const room = this.rooms.get(roomId);
        if (room) {
            room.stopGame();
            this.rooms.delete(roomId);
        }
    }
    generateRoomId() {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }
}
exports.RoomManager = RoomManager;
