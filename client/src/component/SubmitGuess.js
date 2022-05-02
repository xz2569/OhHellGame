import { Form, Modal, Button, Row, Col } from "react-bootstrap";

const SubmitGuess = ({ show, onChange, onSubmit }) => {
  return (
    <Modal show={show} size="lg">
      <Modal.Header>
        <Modal.Title># hands to make this round</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Row style={{ height: "20px" }} />
          <Row>
            <Col sm={2} />
            <Col sm={5}>
              <Form.Control
                type="number"
                min={0}
                max={8}
                placeholder="my guess"
                onChange={onChange}
              />
            </Col>
            <Col sm={3}>
              <Button variant="primary" type="submit" onClick={onSubmit}>
                Submit my guess
              </Button>
            </Col>
            <Col sm={2} />
          </Row>
          <Row style={{ height: "30px" }} />
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default SubmitGuess;
