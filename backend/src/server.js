const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
require("dotenv").config();

const socketHandler = require("./socket/socketHandler");

const app = express();

const server = http.createServer(app);


const allowedOrigins = [
  "http://localhost:5173",
  "https://ai-voice-health-assistant.netlify.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests without origin
      // e.g. Postman/server-to-server
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log(
        "❌ CORS blocked origin:",
        origin
      );

      return callback(
        new Error("Not allowed by CORS")
      );
    },

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    credentials: true,
  })
);


app.use(express.json());

app.use(express.urlencoded({
  extended: true,
}));



const io = new Server(server, {
  cors: {
    origin: allowedOrigins,

    methods: [
      "GET",
      "POST",
    ],

    credentials: true,
  },
});


socketHandler(io);



app.get("/", (req, res) => {
  res.json({
    success: true,
    message:
      "AI Voice Health Assistant Backend is running",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "ok",
  });
});


const PORT =
  process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  );
});