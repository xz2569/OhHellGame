import { useState, useEffect } from "react";
import PlayZone from "./PlayZone";
import Hand from "./Hand";
import Guess from "./Guess";
import Message from "./Message";
import ScoreTable from "./ScoreTable";
import TrumpCard from "./TrumpCard";
import DetailedScoreBoard from "./DetailedScoreBoard";
import { Container, Row, Col } from "react-bootstrap";
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

  const suits = ["C", "D", "S", "H"];
  const ranks = [
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "J",
    "Q",
    "K",
    "A",
  ];
  const deck = suits.flatMap((suit) => ranks.map((rank) => rank + suit));

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
      socket.emit("submit_guess", {
        username: username,
        room: room,
        guess: guess,
      });
    }
  };

  const showDetail = () => {
    setModalShow(true);
  };

  const hideDetail = () => {
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
          style={{ color: "green" }}
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
      const dataSorted = data.sort((card1, card2) => {
        return deck.indexOf(card1) - deck.indexOf(card2);
      });
      setMyCards(dataSorted);
    });

    socket.off("trump_card").on("trump_card", (data) => {
      console.log("trump card received: ", data);
      setTrumpCard(data);
    });

    socket.off("your_turn_to_guess").on("your_turn_to_guess", (data) => {
      console.log("your turn to guess, but cannot pick: ", data);
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
            <div
              style={{
                height: "50px",
                marginTop: "50px",
                marginBottom: "50px",
              }}
            >
              {myGuessTurn && (
                <Guess onChange={onChangeGuess} onSubmit={onSubmitGuess} />
              )}
            </div>
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
        </Col>

        {/* Information Column */}
        <Col sm={1}></Col>
        <Col sm={2} style={{ position: "relative", minHeight: "600px" }}>
          <Row>
            <ScoreTable playersInfo={playersInfo} showDetail={showDetail} />
          </Row>
          <Row style={{ height: "100px" }}></Row>
          <Row
            style={{
              position: "absolute",
              bottom: "5px",
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
        hideDetail={hideDetail}
        playersInfo={playersInfo}
        currentRound={currentRound}
        getGuessAndMade={getGuessAndMade}
      />
    </Container>
  );
};

export default Game;
