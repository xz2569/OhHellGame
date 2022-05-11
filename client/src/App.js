import { useState, useEffect } from "react";
import { Navbar, Container, Button } from "react-bootstrap";
import { Helmet, HelmetProvider } from "react-helmet-async";
import "./App.css";
import io from "socket.io-client";
import Game from "./component/Game";
import JoinForm from "./component/JoinForm";
import WaitRoom from "./component/WaitRoom";
import Instruction from "./component/Instruction";

// 1. local wifi network
// const socket = io.connect("http://192.168.1.73:3001");
// 2. local browser on personal laptop
// const socket = io.connect("http://localhost:3001");
// 3. deployment
const socket = io();

function App() {
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");
  const [passcode, setPasscode] = useState("");
  const [showJoin, setShowJoin] = useState(true);
  const [showGame, setShowGame] = useState(false);
  const [showInstruction, setShowInstruction] = useState(false);
  const joinRoom = () => {
    if (username !== "" && room !== "") {
      socket.emit("join_room", {
        username: username,
        room: room,
        passcode: passcode,
      });
    }
    setShowJoin(false);
  };

  const usernameOnChange = (event) => {
    setUsername(event.target.value);
  };

  const roomOnChange = (event) => {
    setRoom(event.target.value);
  };

  const passCodeOnChange = (event) => {
    setPasscode(event.target.value);
  };

  const hideInstruction = () => {
    setShowInstruction(false);
  };

  useEffect(() => {
    socket.off("show_game").on("show_game", () => {
      setShowGame(true);
    });

    socket.off("room_joined").on("room_joined", (data) => {
      setUsername(data);
    });

    socket.off("connection_error").on("connection_error", (data) => {
      setShowJoin(true);
      alert(data);
    });
    // image preloading
    [...Array(8).keys()].forEach((avatarId) => {
      new Image().src = `avatars/cat${avatarId + 1}.png`;
    });
    ["C", "D", "S", "H"]
      .flatMap((suit) =>
        ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"].map(
          (rank) => rank + suit
        )
      )
      .forEach((card) => {
        new Image().src = `cards/${card}.svg`;
      });
    new Image().src = `cards/white.png`;
    new Image().src = `cards/back.svg`;
  }, [socket]);

  return (
    <div className="App">
      <HelmetProvider>
        <Helmet>
          <title>Oh Hell</title>
        </Helmet>
      </HelmetProvider>
      <Navbar bg="light">
        <Container>
          <Navbar.Brand>
            <h2>Oh Hell!</h2>
          </Navbar.Brand>
          <Navbar.Toggle />
          <Navbar.Collapse className="justify-content-end">
            <Navbar.Text>
              <Button
                variant="link"
                onClick={() => {
                  setShowInstruction(true);
                }}
              >
                how to play
              </Button>
            </Navbar.Text>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {Boolean(showJoin) && (
        <JoinForm
          usernameOnChange={usernameOnChange}
          roomOnChange={roomOnChange}
          passCodeOnChange={passCodeOnChange}
          joinRoom={joinRoom}
        />
      )}

      {Boolean(!showJoin & !showGame) && (
        <WaitRoom socket={socket} username={username} room={room} />
      )}

      {showGame && <Game socket={socket} username={username} room={room} />}

      <Instruction show={showInstruction} onHide={hideInstruction} />
    </div>
  );
}

export default App;
