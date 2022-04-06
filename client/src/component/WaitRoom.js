import { useState, useEffect } from "react";
import Players from "./Players";
import Button from "react-bootstrap/Button";
import { Container } from "react-bootstrap";

const WaitRoom = ({ socket, username, room }) => {
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    socket.on("waiting_players", (data) => {
      console.log(data);
      setPlayers(data);
    });
  }, [socket]);

  const startGame = () => {
    socket.emit("start_game", room);
  };

  return (
    <div>
      <div style={{ padding: "20px" }}></div>
      <Container className="d-grid gap-2">
        <div style={{ padding: "20px" }}></div>
        <h2 style={{ fontFamily: "Palette Mosaic, cursive" }}>Players</h2>
        <div style={{ padding: "20px" }}></div>
        <Players
          players={players}
          avatarIds={[...Array(players.length).keys()].map((x) => x + 1)}
          you={username}
        />
        <Button style={{ marginTop: "50px" }} size="lg" onClick={startGame}>
          Start Game
        </Button>
      </Container>
    </div>
  );
};

export default WaitRoom;
