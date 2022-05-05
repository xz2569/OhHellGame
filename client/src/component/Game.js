import { useState, useEffect, useRef } from "react";
import PlayZone from "./PlayZone";
import Hand from "./Hand";
import GuessInfo from "./GuessInfo";
import Message from "./Message";
import ScoreTable from "./ScoreTable";
import TrumpCard from "./TrumpCard";
import DetailedScoreBoard from "./DetailedScoreBoard";
import SubmitGuess from "./SubmitGuess";
import { Container, Row, Col, Button } from "react-bootstrap";
import { FaCheck, FaQuestion, FaTimes, FaBan } from "react-icons/fa";

const Game = ({ socket, username, room }) => {
  const [playersInfo, setPlayersInfo] = useState([]);
  const [myCards, setMyCards] = useState([]);
  const [trumpCard, setTrumpCard] = useState("");
  const [myTurn, setMyTurn] = useState(false);
  const [currentRound, setCurrentRound] = useState(0);
  const [myGuessTurn, setMyGuessTurn] = useState(false);
  const [guessForbidden, setGuessForbidden] = useState(-1);
  const [currentSuit, setCurrentSuit] = useState("");
  const [message, setMessage] = useState("");
  const [guess, setGuess] = useState(-1);
  const [playingPlayer, setPlayingPlayer] = useState("");
  const [winningPlayer, setWinningPlayer] = useState("");
  const [leadingPlayer, setLeadingPlayer] = useState("");
  const [modalShow, setModalShow] = useState(false);
  const [numTricksThisRound, setNumTricksThisRound] = useState(0);
  const [gameEnded, setGameEnded] = useState(false);
  const [showGuessInfo, setShowGuessInfo] = useState(true);
  const [lowLeftInHand, setLowLeftInHand] = useState(true);
  const lowLeftInHandRef = useRef();
  lowLeftInHandRef.current = lowLeftInHand;

  const suits = ["C", "D", "S", "H"];
  const ranks = "2,3,4,5,6,7,8,9,10,J,Q,K,A".split(",");
  const ranksRev = "A,K,Q,J,10,9,8,7,6,5,4,3,2".split(",");
  const deck = suits.flatMap((suit) => ranks.map((rank) => rank + suit));
  const deckRev = suits.flatMap((suit) => ranksRev.map((rank) => rank + suit));

  const onClick = (e) => {
    e.preventDefault();
    const cardPlayed = e.target.getAttribute("id");
    console.log("you played: ", cardPlayed);
    socket.emit("card_played", {
      username: username,
      room: room,
      cardPlayed: cardPlayed,
    });
    setMyCards(myCards.filter((myCard) => myCard !== cardPlayed));
    setMyTurn(!myTurn);
  };

  const onChangeGuess = (e) => {
    e.preventDefault();
    setGuess(e.target.valueAsNumber);
  };

  const onSubmitGuess = (e) => {
    e.preventDefault();
    if (isNaN(guess) || guess === guessForbidden || guess < 0) {
      alert("cannot choose this number!");
    } else {
      setMyGuessTurn(false);
      socket.emit("submit_guess", {
        username: username,
        room: room,
        guess: guess,
      });
    }
  };

  const sortHand = (data) => {
    if (lowLeftInHandRef.current) {
      return data.sort((card1, card2) => {
        return deck.indexOf(card1) - deck.indexOf(card2);
      });
    } else {
      return data.sort((card1, card2) => {
        return deckRev.indexOf(card1) - deckRev.indexOf(card2);
      });
    }
  };

  const reverseCardOrder = () => {
    setLowLeftInHand(!lowLeftInHand);
  };

  useEffect(() => {
    // use .slice() to pass by value instead of reference
    // otherwise, re-rendering will not be triggered
    setMyCards(sortHand(myCards.slice()));
  }, [lowLeftInHand]);

  const showScoreDetail = () => {
    setModalShow(true);
  };

  const hideScoreDetail = () => {
    setModalShow(false);
  };

  const getGuessAndMade = (guess, made) => {
    if (guess === -1) {
      return "\u00A0";
    }
    var items = [];
    var i;
    // hands successfully made
    for (i = 0; i < Math.min(made, guess); i++) {
      items.push(
        <FaCheck
          key={`made-good-${i}`}
          size="12px"
          style={{ color: "mediumseagreen" }}
        />
      );
    }
    // remaining guesses to be made
    for (i = 0; i < guess - made; i++) {
      items.push(<FaQuestion key={`guess-to-go-${i}`} size="12px" />);
    }
    // hands made over guesses
    for (i = 0; i < made - guess; i++) {
      items.push(
        <FaTimes key={`made-over${i}`} size="12px" style={{ color: "red" }} />
      );
    }
    // adding symbol if nothing to display (guess=made=0)
    if (items.length === 0) {
      items = [<FaBan key="zero-guess" size="12px" />];
    }
    return items.map((item) => item);
  };

  useEffect(() => {
    socket
      .off("update_playerInfo")
      .on("update_playersInfo", ({ playersInfo, round }) => {
        setPlayersInfo(playersInfo);
        setCurrentRound(round);
        console.log(playersInfo, round);
      });

    socket.off("deal_card").on("deal_card", (data) => {
      console.log("card received: ", data);
      setMyCards(sortHand(data.slice()));
      setNumTricksThisRound(data.length);
    });

    socket.off("trump_card").on("trump_card", (data) => {
      console.log("trump card received: ", data);
      setTrumpCard(data);
    });

    socket.off("your_turn_to_guess").on("your_turn_to_guess", (data) => {
      console.log("your turn to guess, but cannot pick: ", data);
      setGuess(-1);
      setMyGuessTurn(true);
      setGuessForbidden(data);
    });

    socket.off("your_guess_received").on("your_guess_received", () => {
      console.log("your guess is received");
      setMyGuessTurn(false);
    });

    socket.off("your_turn_to_play").on("your_turn_to_play", (suit) => {
      console.log("it is your turn to play");
      setMyTurn(true);
      setCurrentSuit(suit);
    });

    socket
      .off("your_turn_to_play_auto")
      .on("your_turn_to_play_auto", (card) => {
        console.log("it is your turn to play (auto)", card);
        socket.emit("card_played", {
          username: username,
          room: room,
          cardPlayed: card,
        });
        setMyCards([]);
      });

    socket.off("playing_player").on("playing_player", (data) => {
      setPlayingPlayer(data);
    });

    socket.off("winning_player").on("winning_player", (data) => {
      setWinningPlayer(data);
    });

    socket.off("leading_player").on("leading_player", (data) => {
      setLeadingPlayer(data);
    });

    socket.off("message").on("message", (data) => {
      setMessage(data);
    });

    socket.off("end_of_round").on("end_of_round", () => {
      setModalShow(true);
      setShowGuessInfo(false);
    });

    socket.off("staring_new_round").on("staring_new_round", () => {
      setModalShow(false);
      setShowGuessInfo(true);
    });

    socket.off("end_of_game").on("end_of_game", () => {
      setModalShow(true);
      setGameEnded(true);
      setShowGuessInfo(false);
    });
  }, [socket]);

  return (
    <Container>
      <Row style={{ height: "10px" }}></Row>
      <Row className="d-flex">
        <Col sm={9}>
          <Row>
            <Message message={message} />
          </Row>
          <Row>
            <PlayZone
              playersInfo={playersInfo}
              round={currentRound}
              trumpCard={trumpCard}
              playingPlayer={playingPlayer}
              winningPlayer={winningPlayer}
              leadingPlayer={leadingPlayer}
              getGuessAndMade={getGuessAndMade}
            />
          </Row>
          <Row>
            <SubmitGuess
              show={myGuessTurn}
              onChange={onChangeGuess}
              onSubmit={onSubmitGuess}
            />
            <Col sm={2}></Col>
            <Col sm={8}>
              <div
                style={{
                  height: "50px",
                  marginTop: "50px",
                  marginBottom: "50px",
                }}
              >
                <GuessInfo
                  playersInfo={playersInfo}
                  round={currentRound}
                  numTricksThisRound={numTricksThisRound}
                  show={showGuessInfo}
                />
              </div>
            </Col>
            <Col sm={2}></Col>
          </Row>
          <Row style={{ height: "175px", margin: "auto" }}>
            <Hand
              cards={myCards}
              myTurn={myTurn}
              onClick={onClick}
              currentSuit={currentSuit}
              trumpSuit={trumpCard[trumpCard.length - 1]}
            />
          </Row>
          <Row>
            <Button
              style={{ height: "50px" }}
              variant="link"
              onClick={reverseCardOrder}
            >
              {lowLeftInHand
                ? "change to high card on the left"
                : "change to low card on the left"}
            </Button>
          </Row>
        </Col>

        {/* Information Column */}
        <Col sm={1}></Col>
        <Col sm={2} style={{ position: "relative", minHeight: "600px" }}>
          <Row style={{ height: "10px" }}></Row>
          <Row>
            <h3>Room: {room}</h3>
          </Row>
          <Row style={{ height: "20px" }}></Row>
          <Row>
            <ScoreTable
              playersInfo={playersInfo}
              showDetail={showScoreDetail}
            />
          </Row>
          <Row style={{ height: "100px" }}></Row>
          <Row
            style={{
              position: "absolute",
              bottom: "50px",
              left: "50%",
              transform: "translate(-50%,0)",
              margin: "0px",
            }}
          >
            <TrumpCard trumpCard={trumpCard} />
          </Row>
        </Col>
      </Row>
      <DetailedScoreBoard
        show={modalShow}
        hideDetail={hideScoreDetail}
        playersInfo={playersInfo}
        currentRound={gameEnded ? currentRound - 1 : currentRound}
        getGuessAndMade={getGuessAndMade}
      />
    </Container>
  );
};

export default Game;
