// server.js
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import redisClient from "./redis/redis.js";
const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:80",
      "https://video-call-mayank.s3.ap-south-1.amazonaws.com",
    ],
    methods: ["GET", "POST", "PUT"],
    credentials: true,
  })
);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://localhost:80",
      "https://video-call-mayank.s3.ap-south-1.amazonaws.com",
    ],
    methods: ["GET", "POST", "PUT"],
    credentials: true,
  },
});

// const users = new Set(); 

// app.use(express.static(path.join(__dirname, 'public')));
// app.get("/users", (req, res) => {
//   console.log("hi");
//   res.json(Array.from(users));
// });

// Handle Socket.IO connections
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);
  const userName = socket.handshake.query.userName;
  const id = socket.id;
  const user = { userName, id };
  const userString = JSON.stringify(user);

  redisClient
    .sAdd("onlineUsers", userString).then(updateOnlineUsers)
    .catch(console.error);

  // Notify other users that a new user has joined
  // users.add(socket.id);

  io.emit("users:joined", socket.id);

  console.log("user joined:", socket.id);

  // Send the current list of users to the newly connected user
  socket.emit("hello", { id: socket.id });

  // io.emit("users:update", Array.from(users));

  // Handle incoming calls
  socket.on("outgoing:call", (data) => {
    console.log("outgoing call");
    io.to(data.to).emit("incoming:call", {
      from: socket.id, // who called that someone who emitted started call
      toWhome: data.to, //  to whome this outgoing call was for
      offer: data.fromOffer,
    });
  });

  // Done   Note socket.id will give id who emitted call:rejected event
  socket.on("call:rejected", (data) => {
    const { to } = data;
    // Notify the caller that the call was rejected
    io.to(to).emit("rejected", {
      message: data.msg,
      rejectedBy: socket.id,
    });

    console.log(`Call rejected by ${socket.id}, notifying ${to}`);
  });

  //Done
  socket.on("mute", (data) => {
    const { isMuted, mutedTo } = data;

    socket.emit("user-muted", {
      message: ` You ${isMuted ? "muted" : "Unmuted"} the call`,
      isMuted,
    });
    // Broadcast the mute/unmute event to other users
    socket.to(mutedTo).emit("user-muted", {
      message: `The user ${isMuted ? "muted" : "Unmuted"} your call`,
      mutedBy: socket.id,
      isMuted: data.isMuted,
    });
    console.log("muted");
  });

  // Handle incoming answers
  socket.on("call:accepted", (data) => {
    console.log("call   accepted");
    io.to(data.to).emit("incoming:answer", { offer: data.answer });
  });

  socket.on("error", (err) => {
    console.log(err);
  });

  //Done
  socket.on("call:hangup", ({ to }) => {
    // Notify the other peer that the call has been hung up

    io.to(to).emit("call:hangup");
    console.log(`Call hung up by ${socket.id}, notifying ${to}`);
  });

  // Handle user disconnections
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    redisClient.sMembers('onlineUsers').then((onlineUsers) => {
      const userToRemove = onlineUsers.find(user => JSON.parse(user).id === socket.id);
      console.log(userToRemove , "user to remove");
      if (userToRemove) {
        redisClient.sRem('onlineUsers', userToRemove)
        .then(updateOnlineUsers).catch(console.error);
      }
    }).catch(console.error);
    // users.delete(socket.id);
    io.emit("user:disconnect", socket.id);
    // io.emit("users:update", Array.from(users));
  });
});

function updateOnlineUsers() {
  redisClient.sMembers('onlineUsers')
    .then((onlineUsers) => {

      // Parse each user string back into an object
      const userObjects = onlineUsers.map((user) => {
        try {
          return JSON.parse(user);
        } catch (e) {
          console.error("Error parsing user data:", user, e);
          return null; // Handle invalid JSON
        }
      }).filter(Boolean); // Remove any null values from parsing errors


      // Emit the updated list to the frontend
      io.emit('updateUserList', userObjects);
    })
    .catch((err) => {
      console.error("Error fetching online users from Redis:", err);
    });
}


const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
