"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Player = void 0;
class Player {
    id;
    name;
    x;
    y;
    rotation;
    vx;
    vy;
    isAlive;
    selectedShip;
    lives;
    finished;
    constructor(id, name, selectedShip) {
        this.id = id;
        this.name = name || `Jugador ${id.substring(0, 4)}`;
        this.x = 0;
        this.y = 0;
        this.rotation = 0;
        this.vx = 0;
        this.vy = 0;
        this.isAlive = true;
        this.selectedShip = selectedShip;
        this.lives = 1;
        this.finished = false;
    }
    applyInput(input) {
        // Client authoritative: we trust the client's position for now.
        // In a stricter authoritative server, we would only accept thrust/turn inputs and calculate physics here.
        this.x = input.x;
        this.y = input.y;
        this.rotation = input.rotation;
        this.vx = input.vx;
        this.vy = input.vy;
    }
    die() {
        this.isAlive = false;
        this.lives = 0;
    }
    finish() {
        this.finished = true;
        this.isAlive = false;
    }
    getState() {
        return {
            id: this.id,
            name: this.name,
            x: this.x,
            y: this.y,
            rotation: this.rotation,
            vx: this.vx,
            vy: this.vy,
            isAlive: this.isAlive,
            selectedShip: this.selectedShip,
            lives: this.lives,
            finished: this.finished,
        };
    }
}
exports.Player = Player;
