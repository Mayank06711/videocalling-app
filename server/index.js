import express from "express";
import cors from "cors";
const app = express();

const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT"],
    credentials: true,
  })
);

const port = 3000;

server.get("/", (req, res) => {
  res.send("hello world!");
});

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
