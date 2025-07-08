const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "https://coderelay-app.vercel.app/",
  },
});

const rooms = new Map();

io.on("connection", (socket) => {
  console.log("New client connected", socket.id);

  currentRoom = null;
  currentUser = null;

  socket.on("join", ({ roomId, userName }) => {
    if (currentRoom) {
      socket.leave(currentRoom);
      rooms.get(currentRoom).delete(currentUser);
      io.to(currentRoom).emit("userJoined", Array.from(rooms.get(currentRoom)));
    }

    currentRoom = roomId;
    currentUser = userName;

    socket.join(roomId);

    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }

    rooms.get(roomId).add(userName);

    // Array.from kisi bhi array jese "{}" dikhne wli ko real array me convert kr deta hai "[]"

    io.to(roomId).emit("userJoined", Array.from(rooms.get(roomId)));
  });
  socket.on("codeChange", ({ roomId, code }) => {
    io.to(roomId).emit("codeUpdate", code);
  });

  socket.on("leaveRoom", () => {
    if (currentRoom && currentUser) {
      rooms.get(currentRoom).delete(currentUser);
      io.to(currentRoom).emit("userJoined", Array.from(rooms.get(currentRoom)));

      socket.leave(currentRoom);

      currentRoom = null;
      currentUser = null;
    }
  });

    socket.on("typing", ({roomId, userName}) => {
        socket.to(roomId).emit("userTyping", userName);
    });

    socket.on("languageChange", ({roomId, Language})=>{
        io.to(roomId).emit("languageUpdate", Language);
    })
    
  socket.on("disconnect", () => {
    if (currentRoom && currentUser) {
      rooms.get(currentRoom).delete(currentUser);
      io.to(currentRoom).emit("userJoined", Array.from(rooms.get(currentRoom)));
    }
  });
});

app.get("/", (req, res) => {
  res.send("Welcome to the Code Collaboration Server of CodeRelay!");
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Server is running on port", PORT);
});
