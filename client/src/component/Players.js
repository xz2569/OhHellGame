import { CardGroup } from "react-bootstrap";
import Player from "./Player";

const Players = ({ players, avatarIds, you }) => {
  return (
    <CardGroup
      className="d-flex"
      style={{ maxHeight: "150px", margin: "auto" }}
    >
      {players.map((player, index) => (
        <Player
          key={player}
          name={player}
          avatarId={avatarIds[index]}
          spotlight={player === you}
          winning={false}
          footerText={player === you ? "you" : "\u00A0"}
          playing={false}
          cardPlayed={""}
          prevCardPlayed={""}
          leading={false}
        />
      ))}
    </CardGroup>
  );
};

export default Players;
