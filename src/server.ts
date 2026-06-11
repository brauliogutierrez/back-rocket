import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { PORT } from "./utils/constants";
import { setupConnectionHandlers } from "./handlers/connection";
import { RoomManager } from "./game/RoomManager";
import { ServerToClientEvents, ClientToServerEvents, InterServerEvents, SocketData } from "./types";

const app = express();
const httpServer = createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(httpServer, {
  cors: {
    origin: "*", // Adjust this in production
    methods: ["GET", "POST"]
  }
});

// Initialize RoomManager with IO instance
RoomManager.getInstance().setIo(io);

// Setup basic health check route
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server is running" });
});

// Setup Socket.io handlers
setupConnectionHandlers(io);

httpServer.listen(PORT, () => {
  console.log(`Server is running and listening on port ${PORT}`);
});
