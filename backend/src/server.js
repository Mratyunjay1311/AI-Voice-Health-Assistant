require("dotenv").config();

const app = require("./app");
const http = require("http")
const { Server } = require("socket.io");
const socketHandler = require("./socket/socketHandler");
const server = http.createServer(app)

const io = new Server(server,{
    cors:{
        origin:"http://localhost:5173"
    }
})

io.on("connection",(socket)=>{
      console.log(
        "User connected:",
        socket.id
    )

    socket.on("disconnect",()=>{
        console.log("User disconnected")
    })
})

socketHandler(io)


server.listen(5000,()=>{
    console.log("Server running on port 5000")
})