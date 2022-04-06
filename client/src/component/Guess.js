import { Form, Row, Col, Button } from "react-bootstrap";

const Guess = ({ onChange, onSubmit }) => {
  return (
    <Form>
      <Row>
        <Col sm={3}></Col>
        <Col sm={3}>
          <Form.Control
            type="number"
            min={0}
            max={8}
            placeholder="I will make ??? hands"
            onChange={onChange}
          />
        </Col>
        <Col sm={3}>
          <Button variant="primary" type="submit" onClick={onSubmit}>
            Submit your guess
          </Button>
        </Col>
        <Col sm={3}></Col>
      </Row>
    </Form>
  );
};

export default Guess;
