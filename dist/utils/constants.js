"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PORT = exports.TICK_INTERVAL = exports.TICK_RATE = void 0;
exports.TICK_RATE = 30; // 30 ticks per second
exports.TICK_INTERVAL = 1000 / exports.TICK_RATE;
exports.PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
