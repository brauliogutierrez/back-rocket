"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const constants_1 = require("./utils/constants");
const connection_1 = require("./handlers/connection");
const RoomManager_1 = require("./game/RoomManager");
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: "*", // Adjust this in production
        methods: ["GET", "POST"]
    }
});
// Initialize RoomManager with IO instance
RoomManager_1.RoomManager.getInstance().setIo(io);
// Setup basic health check route
app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok", message: "Server is running" });
});
// Setup Socket.io handlers
(0, connection_1.setupConnectionHandlers)(io);
httpServer.listen(constants_1.PORT, () => {
    console.log(`Server is running and listening on port ${constants_1.PORT}`);
});
