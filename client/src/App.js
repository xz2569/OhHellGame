import { useState, useEffect } from "react";
import { Navbar, Container } from "react-bootstrap";
import "./App.css";
import io from "socket.io-client";
import Game from "./component/Game";
import JoinForm from "./component/JoinForm";
import WaitRoom from "./component/WaitRoom";

// const socket = io.connect("http://192.168.1.73:3001");
// const socket = io.connect("http://localhost:3001");
const socket = io();

function App() {
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");
  const [showJoin, setShowJoin] = useState(true);
  const [showGame, setShowGame] = useState(false);
  const joinRoom = () => {
    if (username !== "" && room !== "") {
      socket.emit("join_room", { username: username, room: room });
      setShowJoin(false);
    }
  };

  const usernameOnChange = (event) => {
    setUsername(event.target.value);
  };

  const roomOnChange = (event) => {
    setRoom(event.target.value);
  };

  useEffect(() => {
    socket.on("show_game", () => {
      setShowGame(true);
    });

    socket.on("room_joined", (data) => {
      setUsername(data);
    });
  }, [socket]);

  return (
    <div className="App">
      <Navbar bg="light">
        <Container>
          <Navbar.Brand>
            <h2>Oh Hell!</h2>
          </Navbar.Brand>
        </Container>
      </Navbar>

      {Boolean(showJoin) && (
        <JoinForm
          usernameOnChange={usernameOnChange}
          roomOnChange={roomOnChange}
          joinRoom={joinRoom}
        />
      )}

      {Boolean(!showJoin & !showGame) && (
        <WaitRoom socket={socket} username={username} room={room} />
      )}

      {showGame && <Game socket={socket} username={username} room={room} />}
    </div>
  );
}

export default App;
