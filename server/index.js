// server.js
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173","http://localhost:80"],
    methods: ["GET", "POST", "PUT"],
    credentials: true,
  })
);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:80"],
    methods: ["GET", "POST", "PUT"],
    credentials: true,
  },
});

const users = new Set(); // To store online users

// app.use(express.static(path.join(__dirname, 'public')));
app.get("/users", (req, res)=>{
  console.log("hi")
  res.json(Array.from(users));
})
// Handle Socket.IO connections
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Notify other users that a new user has joined
  users.add(socket.id);
  io.emit("users:joined", socket.id);

  // Send the current list of users to the newly connected user
  socket.emit("hello", { id: socket.id });
  io.emit("users:update", Array.from(users));

  // Handle incoming calls
  socket.on("outgoing:call", (data) => {
   // console.log(data, "hello");
    io.to(data.to).emit("incoming:call", {
      from: socket.id,
      offer: data.fromOffer,
    });
  });

  // Handle incoming answers
  // socket.on("call:accepted", (data) => {
  //   console.log("A user accepted:", data)
  //   io.to(data.to).emit("incoming:answer", { offer: data.answer });
  //   console.log("emmited")
  // });


  socket.on("call:accepted", (data) => {
    console.log("A user accepted the call:", data);
    const { accept } = data;

    if (accept && accept.from) {
      io.to(accept.from).emit("incoming:answer", { answer: accept.answer });
      console.log("Emitted incoming:answer to:", accept.from);
    }
  });

    
  

  // Handle user disconnections
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    users.delete(socket.id);
    io.emit("user:disconnect", socket.id);
    io.emit("users:update", Array.from(users));
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});