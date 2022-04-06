import { Card } from "react-bootstrap";
import { CSSTransition } from "react-transition-group";
import { FaCrown } from "react-icons/fa";

const Player = ({
  name,
  avatarId,
  spotlight,
  winning,
  footerText,
  playing,
  cardPlayed,
  leading,
}) => {
  var borderStyle = "light";
  var bgStyle = "light";
  var textStyle = "dark";

  if (spotlight) {
    borderStyle = "dark";
    bgStyle = "dark";
    textStyle = "light";
  }

  if (winning) {
    borderStyle = "success";
    bgStyle = "success";
    textStyle = "dark";
  }

  return (
    <Card
      style={{
        maxWidth: "150px",
        margin: "auto",
        borderRadius: "5px",
      }}
      border={borderStyle}
      bg={bgStyle}
      text={textStyle}
    >
      <Card.Body>
        <Card.Title style={{ fontFamily: "Lobster, cursive" }}>
          {name}{" "}
          {leading && <FaCrown style={{ color: "gold", size: "12px" }} />}
        </Card.Title>
        <Card.Img
          style={{ maxWidth: "60px", height: "auto", marginBottom: "10px" }}
          src={`avatars/cat${avatarId}.png`}
        />
        <Card.Subtitle>{footerText}</Card.Subtitle>
      </Card.Body>
      {playing && (
        <Card.Body bg="light" style={{ paddingBottom: "16px" }}>
          <CSSTransition in={true} timeout={300} classNames="cardPlayed">
            <Card.Img
              style={{ maxWidth: "80px" }}
              src={
                cardPlayed === ""
                  ? `cards/white.png`
                  : `cards/${cardPlayed}.svg`
              }
            />
          </CSSTransition>
        </Card.Body>
      )}
    </Card>
  );
};

export default Player;
