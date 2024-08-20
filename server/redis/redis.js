import { createClient} from "redis";

const redisClient = createClient({
  socket: {
    host: "localhost" || "redis",
    port: 6379,
  },
  // password: "PASSWORD",
});

redisClient.on("error", (err) => {
  console.log("Redis Client Error", err);
});

redisClient.on("connect", () => {
  console.log("Redis Client Connected");
});

redisClient.connect().catch(console.error);

export default redisClient;