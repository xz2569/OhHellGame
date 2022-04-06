import { Card } from "react-bootstrap";

const TrumpCard = ({ trumpCard }) => {
  return (
    <Card
      style={{
        maxWidth: "150px",
        margin: "auto",
        padding: "0px",
        borderRadius: "5px",
        backgroundColor: "#212529",
      }}
    >
      <Card.Body style={{ paddingBottom: "20px" }}>
        <Card.Title style={{ color: "gold", fontFamily: "Lobster, cursive" }}>
          <h2>Trump</h2>
        </Card.Title>
        <Card.Img
          src={`cards/${trumpCard}.svg`}
          style={{ maxWidth: "100px" }}
        />
      </Card.Body>
    </Card>
  );
};

export default TrumpCard;
