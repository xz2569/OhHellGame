import { Alert, Row, Col } from "react-bootstrap";

const GuessInfo = ({ playersInfo, round, numTricksThisRound, show }) => {
  if (playersInfo.length === 0 || round === 0) {
    return <></>;
  }
  var numGuessThisRound = 0;
  playersInfo.forEach((playerInfo) => {
    numGuessThisRound += Math.max(0, playerInfo[round].guess);
  });
  var numTricksPlayed = 0;
  playersInfo.forEach((playerInfo) => {
    numTricksPlayed += Math.max(0, playerInfo[round].made);
  });
  return (
    <Alert variant="light">
      <Row>
        <Col sm={6}>
          <h5 style={{ fontFamily: "Ubuntu, sans-serif", margin: "0px" }}>
            {show
              ? `Guesses made: ${numGuessThisRound} / ${numTricksThisRound}`
              : "\u00A0"}
          </h5>
        </Col>
        <Col sm={6}>
          <h5 style={{ fontFamily: "Ubuntu, sans-serif", margin: "0px" }}>
            {show
              ? `Playing: ${Math.min(
                  numTricksPlayed + 1,
                  numTricksThisRound
                )} / ${numTricksThisRound}`
              : "\u00A0"}
          </h5>
        </Col>
      </Row>
    </Alert>
  );
};

export default GuessInfo;
