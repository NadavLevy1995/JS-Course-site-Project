const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const dotenv = require("dotenv");
const connectToDatabase = require("../db/connection");
const Room = require("../db/models/Room");

dotenv.config();

const socketRooms = {}; // Track which rooms each socket is in

// Connect to MongoDB
connectToDatabase();

// In-memory cache for loaded rooms
const roomCache = {};

const app = express();
app.use(cors());
app.use(express.json());

app.get("/active-room", (req, res) => {
  for (const roomId in roomCache) {
    if (roomCache[roomId].usersCount > 0) {
      return res.json({ activeRoom: roomId });
    }
  }
  return res.json({ activeRoom: null });
});


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
    socketRooms[socket.id] = roomId;
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
          locked: false,
          ownerId: socket.id
        };

        io.emit("room_opened", roomId);
      } catch (err) {
        console.error("❌ Error loading room from DB:", err.message);
        socket.emit("error", "Database error");
        return;
      }
    }
  
    // ✅ Increment usersCount (after cache is guaranteed to exist)
    
    roomCache[roomId].usersCount += 1;
    console.log(`👥 Room "${roomId}" now has ${roomCache[roomId].usersCount} user(s)`);
  
    // Send code and description to the user from cache
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
  
    socket.to(roomId).emit("code_update", content);
  });
  
  socket.on("disconnect", () => {
    console.log(`❌ User disconnected: ${socket.id}`);
  
    const roomId = socketRooms[socket.id];
  
    if (!roomId) {
      console.log("⚠️ No room found for this socket");
      return;
    }
  
    const roomData = roomCache[roomId];
    if (!roomData) {
      console.log("⚠️ No cached room data");
      return;
    }
  
    // Decrease usersCount
    roomData.usersCount -= 1;
    console.log(`👤 Room "${roomId}" now has ${roomData.usersCount} user(s)`);
  
    // Check if the disconnecting user is the owner
    if (roomData.ownerId === socket.id) {
      console.log(`🔒 Room "${roomId}" is closing (owner disconnected)`);
  
      // Notify all other users
      socket.to(roomId).emit("room_closed");
  
      // Remove others from room
      const room = io.sockets.adapter.rooms.get(roomId);
      if (room) {
        for (const clientId of room) {
          const clientSocket = io.sockets.sockets.get(clientId);
          if (clientSocket) {
            clientSocket.leave(roomId);
          }
        }
      }
      
      delete roomCache[roomId];

      io.emit("room_closed", roomId);
    }
  
    // Always clean up from tracking map
    delete socketRooms[socket.id];
  });    
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
