import { Button, Form } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

const JoinForm = ({ usernameOnChange, roomOnChange, joinRoom }) => {
  return (
    <div className="App-header">
      <Form>
        <Form.Group className="mb-3">
          <Form.Label>Name</Form.Label>
          <Form.Control
            type="text"
            placeholder="Name"
            onChange={usernameOnChange}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Room</Form.Label>
          <Form.Control
            type="text"
            placeholder="Room"
            onChange={roomOnChange}
          />
        </Form.Group>

        <Button variant="primary" type="submit" onClick={joinRoom}>
          Join Room
        </Button>
      </Form>
    </div>
  );
};

export default JoinForm;
