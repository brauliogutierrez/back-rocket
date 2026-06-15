"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameState = void 0;
const Player_1 = require("./Player");
const constants_1 = require("../utils/constants");
class GameState {
    id;
    hostId;
    players;
    isPlaying;
    gameMode;
    currentLevel;
    tickInterval;
    io;
    constructor(id, hostId, io) {
        this.id = id;
        this.hostId = hostId;
        this.players = new Map();
        this.isPlaying = false;
        this.gameMode = 'survival';
        this.currentLevel = 0;
        this.io = io;
    }
    addPlayer(id, name, selectedShip) {
        if (!this.players.has(id)) {
            this.players.set(id, new Player_1.Player(id, name, selectedShip));
        }
    }
    removePlayer(id) {
        this.players.delete(id);
    }
    getPlayer(id) {
        return this.players.get(id);
    }
    applyPlayerInput(id, input) {
        const player = this.players.get(id);
        if (player) {
            player.applyInput(input);
        }
    }
    setPlayerDead(id) {
        const player = this.players.get(id);
        if (player) {
            player.die();
        }
        this.handleSurvivalEndCheck();
    }
    playerLifeLost(id, livesRemaining) {
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
    playerVictory(id, levelNumber) {
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
    changeGameMode(mode) {
        if (this.isPlaying)
            return;
        this.gameMode = mode;
    }
    returnToLobby() {
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
    startGame() {
        if (this.isPlaying)
            return;
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
        }, constants_1.TICK_INTERVAL);
    }
    stopGame() {
        this.isPlaying = false;
        if (this.tickInterval) {
            clearInterval(this.tickInterval);
            this.tickInterval = undefined;
        }
    }
    tick() {
        if (!this.isPlaying)
            return;
        const playersState = [];
        for (const player of this.players.values()) {
            playersState.push(player.getState());
        }
        this.io.to(this.id).emit("game_tick", playersState);
    }
    handleSurvivalEndCheck() {
        if (!this.isPlaying || this.gameMode !== 'survival')
            return;
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
    getRoomState() {
        const playersState = [];
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
exports.GameState = GameState;
