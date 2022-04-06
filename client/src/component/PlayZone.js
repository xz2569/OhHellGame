import { CardGroup } from "react-bootstrap";
import Player from "./Player";

const PlayZone = ({
  playersInfo,
  round,
  playingPlayer,
  winningPlayer,
  leadingPlayer,
  getGuessAndMade,
}) => {
  if (playersInfo.length === 0 || round === 0) {
    return <></>;
  }

  return (
    <CardGroup className="d-flex" style={{ margin: "auto" }}>
      {playersInfo.map((playerInfo) => (
        <Player
          key={playerInfo.username}
          name={playerInfo.username}
          avatarId={playerInfo.avatarId}
          spotlight={playerInfo.username === playingPlayer}
          winning={playerInfo.username === winningPlayer}
          footerText={getGuessAndMade(
            playerInfo[round].guess,
            playerInfo[round].made
          )}
          playing={true}
          cardPlayed={playerInfo[round].cardPlayed}
          leading={leadingPlayer === playerInfo.username}
        />
      ))}
    </CardGroup>
  );
};

export default PlayZone;
