import React, { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { Button, Container, Stack, TextField, Typography } from "@mui/material";

const App = () => {
  const [message, setMessage] = useState("");
  const [room, setRoom] = useState("");
  const [socketId, setSocketId] = useState("");
  const [allMessages, setAllMessages] = useState([]);
  const [roomName, setRoomName] = useState("");

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [localStream, setLocalStream] = useState(null);
  const [peerConnection, setPeerConnection] = useState(null);

  console.log(allMessages);

  const socket = useMemo(() => io("http://localhost:3000"), []);

  const config = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  };

  const joinRoomHandler = (e) => {
    e.preventDefault();
    socket.emit("join_room", roomName);
    setRoomName("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    socket.emit("message", { message, room });
    setMessage("");
    // setRoom("");
  };

  useEffect(() => {
    // Get local video and audio stream
    async function getLocalStream() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        localVideoRef.current.srcObject = stream;
        setLocalStream(stream);
      } catch (error) {
        console.error("Error accessing media devices.", error);
      }
    }

    // Call on component mount
    getLocalStream();

    // Clean up on unmount
    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (localStream) {
      const pc = new RTCPeerConnection(config);

      // Add local stream to the peer connection
      localStream
        .getTracks()
        .forEach((track) => pc.addTrack(track, localStream));

      // Handle remote stream
      pc.ontrack = (event) => {
        remoteVideoRef.current.srcObject = event.streams[0];
      };

      // Send ICE candidates to the other peer
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("candidate", event.candidate);
        }
      };

      setPeerConnection(pc);
    }
  }, [localStream]);

  useEffect(() => {
    // Listen for offer, answer, and ICE candidate messages
    socket.on("offer", async (offer) => {
      if (peerConnection) {
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(offer)
        );
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.emit("answer", answer);
      }
    });

    socket.on("answer", async (answer) => {
      if (peerConnection) {
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
      }
    });

    socket.on("candidate", async (candidate) => {
      try {
        if (peerConnection) {
          await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (error) {
        console.error("Error adding received ICE candidate", error);
      }
    });
  }, [peerConnection]);

  const startCall = async () => {
    if (peerConnection) {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      socket.emit("offer", offer);
    }
  };

  useEffect(() => {
    socket.on("connect", () => {
      console.log("connected", socket.id);
      setSocketId(socket.id);
    });

    socket.on("receive_message", (m) => {
      console.log(m);
      setAllMessages((allMessages) => [...allMessages, m]);
    });
    socket.on("welcome", (m) => {
      console.log(m);
    });
  }, []);

  return (
    <Container>
      <div>
        <h2>WebRTC Video Chat</h2>
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          style={{ width: "300px" }}
        />
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          style={{ width: "300px" }}
        />
        <button onClick={startCall}>Start Call</button>
      </div>
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
        {allMessages.map((m, i) => (
          <Typography key={i} variant="h5" component="div" gutterBottom>
            {m}
          </Typography>
        ))}
      </Stack>
    </Container>
  );
};

export default App;
