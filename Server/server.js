const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const dotenv = require("dotenv");
const connectToDatabase = require("../db/connection");
const Room = require("../db/models/Room");

dotenv.config();

// Connect to MongoDB
connectToDatabase();

// In-memory cache for loaded rooms
const roomCache = {};

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  // Join a specific room
  socket.on("join_room", async ({ roomId, user }) => {
    socket.join(roomId);
    console.log(`${user} joined room ${roomId}`);

    // Load room data from DB only if not already in cache
    if (!roomCache[roomId]) {
      try {
        const roomFromDB = await Room.findOne({ title: roomId });

        if (!roomFromDB) {
          socket.emit("error", "Room not found");
          return;
        }

        // Store data in memory cache
        roomCache[roomId] = {
          description: roomFromDB.description,
          content: roomFromDB.baseCode,
          referenceCode: roomFromDB.referenceCode,
          usersCount: 0,
          lastUpdated: null,
          locked: false
        };

      } catch (err) {
        console.error("❌ Error loading room from DB:", err.message);
        socket.emit("error", "Database error");
        return;
      }
    }

    // ✅ Send code and description to the user from cache
    socket.emit("load_code", {
      content: roomCache[roomId].content,
      description: roomCache[roomId].description,
      referenceCode: roomCache[roomId].referenceCode,
    });
  });

  // Receive code update from a user and broadcast to others in the room
  socket.on("code_change", ({ roomId, content }) => {
    if (roomCache[roomId]) {
      roomCache[roomId].content = content;
      roomCache[roomId].lastUpdated = new Date();
    }

    socket.to(roomId).emit("code_update", content); // send to everyone else
  });

  socket.on("disconnect", () => {
    console.log(`❌ User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
