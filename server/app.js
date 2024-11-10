import express from 'express'
import {Server} from 'socket.io'
import {createServer} from 'http'
import cors from 'cors'
 
const port = 3000;

const app = express();
const server = createServer(app);

const io = new Server(server, {
    cors:{
        origin:"http://localhost:5173",
        credentials: true
    }
});

app.use(cors())

app.get("/", (req, res)=>{
    res.send("hello Akash")
})

io.on("connection", (socket)=>{
    console.log(`user connected with socket id=${socket.id}`)
    socket.emit("welcome", `welcome to the message ${socket.id}`)
})

server.listen(port, ()=>{
    console.log(`server is running at http://localhost:${port}`);
})