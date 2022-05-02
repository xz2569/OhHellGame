import { Card } from "react-bootstrap";
import { FaCrown } from "react-icons/fa";

const Player = ({
  name,
  avatarId,
  spotlight,
  winning,
  footerText,
  playing,
  cardPlayed,
  prevCardPlayed,
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
          <Card.Img
            style={{ maxWidth: "80px" }}
            src={
              cardPlayed === "" ? `cards/white.png` : `cards/${cardPlayed}.svg`
            }
          />
          {prevCardPlayed !== "" ? (
            <Card.Img
              style={{ position: "absolute", left: "30%", height: "20%" }}
              src={`cards/${prevCardPlayed}.svg`}
            />
          ) : (
            <></>
          )}
        </Card.Body>
      )}
    </Card>
  );
};

export default Player;
