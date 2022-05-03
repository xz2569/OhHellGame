import { useState, useEffect } from "react";
import Players from "./Players";
import { Container, Form, Button, Row, Col } from "react-bootstrap";

const WaitRoom = ({ socket, username, room }) => {
  const [players, setPlayers] = useState([]);
  const [initNumTricks, setInitNumTricks] = useState(8);

  useEffect(() => {
    socket.on("waiting_players", (data) => {
      console.log(data);
      setPlayers(data);
    });
  }, [socket]);

  const startGame = () => {
    socket.emit("start_game", {
      room: room,
      initNumTricks: initNumTricks,
    });
  };

  const initNumTricksOnChange = (event) => {
    if (event.target.value === "") {
      setInitNumTricks(8);
    }
    if (event.target.valueAsNumber >= 2 && event.target.valueAsNumber <= 8) {
      setInitNumTricks(event.target.valueAsNumber);
    }
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
        <div style={{ padding: "20px" }}></div>
        <Row>
          <Col sm={4} />
          <Col sm={4}>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>
                  <h5>Number of tricks to start with</h5>
                </Form.Label>
                <Form.Control
                  type="number"
                  min={2}
                  max={8}
                  defaultValue={8}
                  onChange={initNumTricksOnChange}
                />
              </Form.Group>
              <Button
                style={{ marginTop: "20px" }}
                size="lg"
                onClick={startGame}
              >
                Start Game
              </Button>
            </Form>
          </Col>
          <Col sm={4} />
        </Row>
      </Container>
    </div>
  );
};

export default WaitRoom;
