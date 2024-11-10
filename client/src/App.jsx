import React, { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import { Button, Container, Stack, TextField, Typography } from "@mui/material";

const App = () => {
  const [message, setMessage] = useState("");
  const [room, setRoom] = useState("");
  const [socketId, setSocketId] = useState("")
  const [allMessages, setAllMessages] = useState([])
  const [roomName, setRoomName] = useState("")

  console.log(allMessages)

  const socket = useMemo(()=>io("http://localhost:3000"), []);

  const joinRoomHandler = (e)=>{
    e.preventDefault()
    socket.emit('join_room', roomName)
    setRoomName("")
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    socket.emit("message", {message, room})
    setMessage("");
    // setRoom("");
  };

  useEffect(() => {
    socket.on("connect", () => {
      console.log("connected", socket.id);
      setSocketId(socket.id)
    });

    socket.on("receive_message",(m)=>{
      console.log(m)
      setAllMessages((allMessages)=>[...allMessages, m])
    } )
    socket.on("welcome", (m) => {
      console.log(m);
    });
  }, []);

  return (
    <Container>
      <Typography variant="h1" component="div" gutterBottom>
        Welcome to socket.io
      </Typography>
      <p>{socketId}</p>

      <form onSubmit={joinRoomHandler}>
      <TextField
          id="outlined-basic"
          label="Room-Name"
          variant="outlined"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
        />
        <Button type="submit" variant="contained" color="primary">
          Join
        </Button>
      </form>
      <form onSubmit={handleSubmit}>
        <TextField
          id="outlined-basic"
          label="Message"
          variant="outlined"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <TextField
          id="outlined-basic"
          label="person"
          variant="outlined"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
        />
        <Button type="submit" variant="contained" color="primary">
          Send
        </Button>
      </form>
      <Stack>
        {allMessages.map((m,i)=>(
          <Typography key={i} variant="h5" component="div" gutterBottom>
            {m}
          </Typography>
        ))}
      </Stack>
    </Container>
  );
};

export default App;
