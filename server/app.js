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
app.use(express.json())

app.get("/", (req, res)=>{
    res.send("hello Akash")
})


io.on("connection", (socket)=>{
    console.log(`user connected with socket id=${socket.id}`)

    socket.on("message", ({room, message})=>{
        console.log(room, message);
        io.to(room).emit("receive_message", message)
    })

    socket.on("join_room", (room)=>{
        socket.join(room)
        console.log(`user joined ${room} ${socket.id}`)
    })

    // Relay offers, answers, and ICE candidates
    socket.on("offer", (data) => {
        socket.broadcast.emit("offer", data);
    });

    socket.on("answer", (data) => {
        socket.broadcast.emit("answer", data);
    });

    socket.on("candidate", (data) => {
        socket.broadcast.emit("candidate", data);
    });

    socket.on('disconnect', ()=>{
    console.log(`user disconnect with socket id=${socket.id}`)
    })
})

server.listen(port, ()=>{
    console.log(`server is running at http://localhost:${port}`);
})