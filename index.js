const express = require("express");
const app = express();

/* the following server code is for DEPLOYMENT */
// in client folder, run `npm run build`
app.use(express.static("client/build"));
const PORT = process.env.PORT || 3001;
const server = app.listen(PORT);
const io = require("socket.io")(server);

/* the following server code is for LOCAL TESTING  */
// const cors = require("cors");
// const express = require("express");
// const http = require("http");
// const { Server } = require("socket.io");

// app.use(cors());

// const server = http.createServer(app);

// const io = new Server(server, {
//   cors: {
//     // origin: "http://192.168.1.73:3000",
//     origin: "http://localhost:3000",
//     method: ["GET", "POST"],
//   },
// });

// server.listen(3001, () => {
//   console.log("started server");
// });

var thisRoundJustFinished = false;
var rooms = {};
var waitTimeBetweenTricks = 4000;

const suits = ["C", "D", "H", "S"];
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
const deck = ranks.flatMap((rank) => suits.map((suit) => rank + suit));

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
};

const addPlayerToRoom = (data, socket) => {
  console.log(`user with username=${data.username} joined room ${data.room}`);

  // set up the room if this is the first person to the room
  if (!(data.room in rooms)) {
    console.log("set up a new room to put players in");
    rooms[data.room] = { players: [], gameStarted: false };
  }

  // add player to room if game has not started yet
  if (!rooms[data.room].gameStarted) {
    console.log("game not started yet, put in socket information");
    rooms[data.room].players.push(data.username);
    rooms[data.room][data.username] = {
      socket: socket,
      cardsInHand: [],
    };
  } else {
    if (rooms[data.room].players.indexOf(data.username) !== -1) {
      console.log("reconnecting .....");
      reconnectToGame(data, socket);
    }
  }
};

const reconnectToGame = (data, socket) => {
  // show game (skip join room page)
  socket.emit("show_game");

  // update the socket
  rooms[data.room][data.username].socket = socket;

  // broadcastPlayersInfo
  broadcastPlayersInfo(data.room, rooms[data.room].currentRoundNumTricks === 1);

  // send cards in your hand
  if (rooms[data.room].currentRoundNumTricks === 1) {
    socket.emit("deal_card", ["back"]);
  } else {
    socket.emit("deal_card", rooms[data.room][data.username].cardsInHand);
  }

  // send trump card
  rooms[data.room][data.username].socket.emit(
    "trump_card",
    rooms[data.room].currentRoundTrumpCard
  );

  // send latest message
  rooms[data.room][data.username].socket.emit(
    "message",
    rooms[data.room].lastMessage
  );

  // if currently Guessing
  if (
    rooms[data.room].players.indexOf(data.username) ===
      (rooms[data.room].currentRoundFirstPlayerIndex +
        rooms[data.room].numGuessSubmitted) %
        rooms[data.room].numPlayers &&
    rooms[data.room].currentlyGuessing
  ) {
    collectOneGuess(data.room);
  }

  // if currently Playing
  if (
    rooms[data.room].players[rooms[data.room].currentPlayerIndex] ===
    data.username
  ) {
    collectOnePlayedCard(data.room);
  }
};

/* broadcast players (names) during wait room phase */
const broadcastPlayers = (room) => {
  if (!rooms[room].gameStarted) {
    io.sockets.to(room).emit("waiting_players", rooms[room].players);
  } else {
    broadcastPlayersInfo(room, false);
  }
};

/* broadcast players (game status) during game phase */
const broadcastPlayersInfo = (room, specialRound) => {
  if (!specialRound) {
    io.sockets.to(room).emit("update_playersInfo", {
      playersInfo: rooms[room].playersInfo,
      round: rooms[room].currentRound,
    });
  } else {
    // reveal others' card if in special rounds
    rooms[room].players.forEach((username) => {
      rooms[room].playersInfo.forEach((playerInfo) => {
        if (playerInfo.username === username) {
          playerInfo[rooms[room].currentRound].cardPlayed = "";
        } else {
          playerInfo[rooms[room].currentRound].cardPlayed =
            rooms[room][playerInfo.username].cardsInHand[0];
        }
      });
      rooms[room][username].socket.emit("update_playersInfo", {
        playersInfo: rooms[room].playersInfo,
        round: rooms[room].currentRound,
      });
    });
    // at the end of guess round, all hands will be broadcasted
    rooms[room].playersInfo.forEach((playerInfo) => {
      playerInfo[rooms[room].currentRound].cardPlayed =
        rooms[room][playerInfo.username].cardsInHand[0];
    });
  }
};

/* initialize information in the room (e.g., game status) */
const initRoom = (room) => {
  rooms[room].gameStarted = true;
  rooms[room].lastMessage = "";
  rooms[room].numPlayers = rooms[room].players.length;
  rooms[room].maxTrickPerRound = Math.min(
    8,
    Math.floor(51 / rooms[room].numPlayers)
  );
  rooms[room].currentRound = 1;
  rooms[room].currentRoundNumTricks = rooms[room].maxTrickPerRound;
  // Information for the current Round
  rooms[room].currentRoundFirstPlayerIndex = 0;
  rooms[room].currentRoundNumberTricksPlayed = 0;
  rooms[room].currentRoundTrumpSuit = "";
  rooms[room].currentRoundTrumpCard = "";
  // Information for the current trick
  rooms[room].currentPlayerIndex = -1;
  rooms[room].currentTrickNumberCardsPlayed = 0;
  rooms[room].currentTrickWinner = "";
  rooms[room].currentTrickWinningCard = "";
  rooms[room].currentTrickSuit = "";
  // to ensure current guess is submitted
  rooms[room].currentlyGuessing = false;
  rooms[room].numGuessSubmitted = 0;
  rooms[room].totalGuess = 0;
  rooms[room].guessForbidden = -1;
  // player Info that is public for everyone
  rooms[room].playersInfo = [];
  rooms[room].players.forEach((player, index) =>
    rooms[room].playersInfo.push({
      username: player,
      avatarId: index + 1,
      [rooms[room].currentRound]: {
        cardPlayed: "",
        guess: -1,
        made: 0,
        score: 0,
      },
      score: 0,
    })
  );
};

/* deal cards & send trump card to players */
const dealCards = (room) => {
  var start_from = 0;
  var num_cards = rooms[room].currentRoundNumTricks;
  var cardsInHand = [];

  // shuffle the deck
  shuffleArray(deck);

  // deal cards to players
  rooms[room].players.forEach((username) => {
    cardsInHand = deck.slice(start_from, start_from + num_cards);
    console.log("dealing to player", username, cardsInHand);
    // special round or not
    if (rooms[room].currentRoundNumTricks !== 1) {
      rooms[room][username].socket.emit("deal_card", cardsInHand);
    } else {
      rooms[room][username].socket.emit("deal_card", ["back"]);
    }
    start_from += num_cards;
    rooms[room][username].cardsInHand = cardsInHand;
  });

  // broadcast other players information at the special rounds
  if (rooms[room].currentRoundNumTricks === 1) {
    broadcastPlayersInfo(room, true);
  }

  // send trump card information to players
  var trump_card;
  if (rooms[room].currentRound === rooms[room].maxTrickPerRound + 1) {
    // special round without trump
    trump_card = "back";
  } else {
    trump_card = deck.slice(start_from, start_from + 1)[0];
  }
  rooms[room].currentRoundTrumpCard = trump_card;
  rooms[room].currentRoundTrumpSuit = trump_card[trump_card.length - 1];
  io.sockets.to(room).emit("trump_card", trump_card);

  // start collecting guesses
  collectOneGuess(room);
};

/* ask the next player to submit their guess */
const collectOneGuess = (room) => {
  rooms[room].currentlyGuessing = true;
  var username =
    rooms[room].players[
      (rooms[room].currentRoundFirstPlayerIndex +
        rooms[room].numGuessSubmitted) %
        rooms[room].numPlayers
    ];
  rooms[room][username].socket.emit(
    "your_turn_to_guess",
    rooms[room].guessForbidden
  );

  // broadcast current player to all players
  if (rooms[room].numGuessSubmitted === 0) {
    rooms[room].lastMessage =
      `Starting round ${rooms[room].currentRound}` +
      ` ... ` +
      `Player ${username} is guessing`;
    // leader of the trick
    if (rooms[room].numGuessSubmitted === 0) {
      io.sockets.to(room).emit("leading_player", username);
    }
  } else {
    rooms[room].lastMessage = `Player ${username} is guessing`;
  }

  io.sockets.to(room).emit("message", rooms[room].lastMessage);
  io.sockets.to(room).emit("playing_player", username);

  // logging on the server side
  console.log(`asking player ${username} to submit a guess`);
};

/* ask the next player to play a card */
const collectOnePlayedCard = (room) => {
  var username = rooms[room].players[rooms[room].currentPlayerIndex];
  // special one card round or not
  if (rooms[room].currentRoundNumTricks !== 1) {
    rooms[room][username].socket.emit(
      "your_turn_to_play",
      rooms[room].currentTrickSuit
    );
  } else {
    rooms[room][username].socket.emit(
      "your_turn_to_play_auto",
      rooms[room][username].cardsInHand[0]
    );
  }

  // leader of the trick
  if (rooms[room].currentTrickNumberCardsPlayed === 0) {
    io.sockets.to(room).emit("leading_player", username);
  }

  // broadcast current player to all players
  rooms[room].lastMessage = `player ${username} is playing`;
  io.sockets.to(room).emit("message", rooms[room].lastMessage);
  io.sockets.to(room).emit("playing_player", username);

  // logging on the server side
  console.log(`ask player ${username} to play a card`);
};

/* collection of socket.on(...) functions */
io.on("connection", (socket) => {
  console.log("New connection", socket.id);

  socket.on("join_room", (data) => {
    socket.join(data.room);
    // if username exists
    try {
      while (rooms[data.room].players.indexOf(data.username) !== -1) {
        if (!rooms[data.room].gameStarted) {
          data.username = data.username + "_";
        } else {
          break;
        }
      }
    } catch (e) {}
    addPlayerToRoom(data, socket);
    socket.emit("room_joined", data.username);
    if (!rooms[data.room].gameStarted) {
      broadcastPlayers(data.room);
    }
  });

  socket.on("disconnect", () => {
    console.log(socket.id, "disconnected");
  });

  socket.on("start_game", (room) => {
    console.log("game starting...");
    io.sockets.to(room).emit("show_game");
    initRoom(room);
    broadcastPlayersInfo(room, false);
    dealCards(room);
  });

  socket.on("submit_guess", (data) => {
    console.log(
      `user with username=${data.username} guessed ${data.guess} hands`
    );

    // update playersInfo
    rooms[data.room].playersInfo.forEach((playerInfo) => {
      if (playerInfo.username === data.username) {
        playerInfo[rooms[data.room].currentRound].guess = data.guess;
      }
    });

    // keep track of guesses so far
    rooms[data.room].numGuessSubmitted++;
    rooms[data.room].totalGuess += data.guess;

    // if the next player to guess is the last player, set restriction
    if (
      rooms[data.room].numGuessSubmitted ===
      rooms[data.room].numPlayers - 1
    ) {
      rooms[data.room].guessForbidden =
        rooms[data.room].currentRoundNumTricks - rooms[data.room].totalGuess;
    }

    // confirmation so that guess form will be hidden
    socket.emit("your_guess_received");

    // broadcast playersInfo to all players
    broadcastPlayersInfo(
      data.room,
      rooms[data.room].currentRoundNumTricks === 1
    );

    // collect guess from the next player or start playing
    if (rooms[data.room].numGuessSubmitted !== rooms[data.room].numPlayers) {
      collectOneGuess(data.room);
    } else {
      rooms[data.room].currentPlayerIndex =
        rooms[data.room].currentRoundFirstPlayerIndex;
      // special round (reveal hand)
      if (rooms[data.room].currentRoundNumTricks === 1) {
        rooms[data.room].players.forEach((username) => {
          rooms[data.room][username].socket.emit(
            "deal_card",
            rooms[data.room][username].cardsInHand
          );
        });
      }
      rooms[data.room].currentlyGuessing = false;
      collectOnePlayedCard(data.room);
    }
  });

  socket.on("card_played", async (data) => {
    console.log(`player ${data.username} played card ${data.cardPlayed}`);

    // update playersInfo
    rooms[data.room].playersInfo.forEach((playerInfo) => {
      if (playerInfo.username === data.username) {
        playerInfo[rooms[data.room].currentRound].cardPlayed = data.cardPlayed;
      }
    });

    // broadcast playersInfo to all players
    broadcastPlayersInfo(data.room, false);

    // update cardsInHand
    rooms[data.room][data.username].cardsInHand = rooms[data.room][
      data.username
    ].cardsInHand.filter((card) => card !== data.cardPlayed);

    // update information relating to the current trick
    rooms[data.room].currentPlayerIndex =
      (rooms[data.room].currentPlayerIndex + 1) % rooms[data.room].numPlayers;
    rooms[data.room].currentTrickNumberCardsPlayed++;

    // update the winner of the current trick so far
    if (rooms[data.room].currentTrickSuit === "") {
      rooms[data.room].currentTrickWinner = data.username;
      rooms[data.room].currentTrickWinningCard = data.cardPlayed;
      rooms[data.room].currentTrickSuit =
        data.cardPlayed[data.cardPlayed.length - 1];
    } else {
      var curr_winning_suit =
        rooms[data.room].currentTrickWinningCard[
          rooms[data.room].currentTrickWinningCard.length - 1
        ];
      var curr_winning_rank = ranks.indexOf(
        rooms[data.room].currentTrickWinningCard.slice(
          0,
          rooms[data.room].currentTrickWinningCard.length - 1
        )
      );
      var played_suit = data.cardPlayed[data.cardPlayed.length - 1];
      var played_rank = ranks.indexOf(
        data.cardPlayed.slice(0, data.cardPlayed.length - 1)
      );

      if (played_suit === curr_winning_suit) {
        if (played_rank > curr_winning_rank) {
          rooms[data.room].currentTrickWinner = data.username;
          rooms[data.room].currentTrickWinningCard = data.cardPlayed;
        }
      } else {
        if (played_suit === rooms[data.room].currentRoundTrumpSuit) {
          rooms[data.room].currentTrickWinner = data.username;
          rooms[data.room].currentTrickWinningCard = data.cardPlayed;
        }
      }
      console.log(`winner is ${rooms[data.room].currentTrickWinner}`);
    }

    // if this is the last card for the current trick
    if (
      rooms[data.room].currentTrickNumberCardsPlayed ===
      rooms[data.room].numPlayers
    ) {
      // update round information
      rooms[data.room].currentRoundNumberTricksPlayed++;

      // reset current trick information to be ready for the next trick
      rooms[data.room].currentPlayerIndex = rooms[data.room].players.indexOf(
        rooms[data.room].currentTrickWinner
      );
      rooms[data.room].currentTrickNumberCardsPlayed = 0;
      rooms[data.room].currentTrickSuit = "";

      // broadcast winner to all players
      rooms[data.room].lastMessage = `player ${
        rooms[data.room].currentTrickWinner
      } won`;
      io.sockets.to(data.room).emit("message", rooms[data.room].lastMessage);

      io.sockets
        .to(data.room)
        .emit("winning_player", rooms[data.room].currentTrickWinner);

      io.sockets.to(data.room).emit("playing_player", "");

      // update playersInfo and broadcast to all
      // (1). update all except for playedCard, and broadcast
      rooms[data.room].playersInfo.forEach((playerInfo) => {
        if (playerInfo.username === rooms[data.room].currentTrickWinner) {
          playerInfo[rooms[data.room].currentRound].made++;
        }
        // if this is the last trick of the current round
        if (
          rooms[data.room].currentRoundNumberTricksPlayed ===
          rooms[data.room].currentRoundNumTricks
        ) {
          var guess = playerInfo[rooms[data.room].currentRound].guess;
          var made = playerInfo[rooms[data.room].currentRound].made;
          var score_this_round;
          if (guess === made) {
            score_this_round = 10 + 10 * made;
          } else {
            score_this_round = -10 * Math.abs(guess - made);
          }
          playerInfo[rooms[data.room].currentRound].score = score_this_round;
          playerInfo.score += score_this_round;
        }
      });
      broadcastPlayersInfo(data.room, false);

      // (2) wait (playedCard remain in display)
      await delay(waitTimeBetweenTricks);

      // (3) reset players' played card and broadcast
      rooms[data.room].playersInfo.forEach((playerInfo) => {
        playerInfo[rooms[data.room].currentRound].cardPlayed = "";
      });
      broadcastPlayersInfo(data.room, false);

      // (4) reset winning player and broadcast
      io.sockets.to(data.room).emit("winning_player", "");

      // if this is also the last trick of the current round
      if (
        rooms[data.room].currentRoundNumberTricksPlayed ===
        rooms[data.room].currentRoundNumTricks
      ) {
        // set `thisRoundJustFinished` so that we do not collect card
        thisRoundJustFinished = true;

        // update room information for next round
        rooms[data.room].currentRoundFirstPlayerIndex =
          (rooms[data.room].currentRoundFirstPlayerIndex + 1) %
          rooms[data.room].numPlayers;
        rooms[data.room].currentRoundNumberTricksPlayed = 0;
        rooms[data.room].currentRoundTrumpSuit = "";
        rooms[data.room].currentRound++;
        if (
          rooms[data.room].currentRound <= rooms[data.room].maxTrickPerRound
        ) {
          rooms[data.room].currentRoundNumTricks =
            rooms[data.room].maxTrickPerRound +
            1 -
            rooms[data.room].currentRound;
        } else {
          rooms[data.room].currentRoundNumTricks =
            rooms[data.room].currentRound - rooms[data.room].maxTrickPerRound;
        }
        rooms[data.room].totalGuess = 0;
        rooms[data.room].numGuessSubmitted = 0;
        rooms[data.room].guessForbidden = -1;

        // update playersInfo for next round and broadcast to all
        rooms[data.room].playersInfo.forEach((playerInfo) => {
          playerInfo[rooms[data.room].currentRound] = {
            cardPlayed: "",
            guess: -1,
            made: 0,
            score: 0,
          };
        });
        broadcastPlayersInfo(data.room, false);

        // deal card for next round or complete the game
        if (
          rooms[data.room].currentRound <=
          rooms[data.room].maxTrickPerRound * 2
        ) {
          dealCards(data.room);
        } else {
          console.log("finished!");
          rooms[data.room].lastMessage = "Game complete!";
          io.sockets
            .to(data.room)
            .emit("message", rooms[data.room].lastMessage);
        }
      }
    }

    // collect the card to be played by the next player
    if (!thisRoundJustFinished) {
      // only for special round
      if (rooms[data.room].currentRoundNumTricks == 1) {
        await delay(waitTimeBetweenTricks / rooms[data.room].numPlayers);
      }
      collectOnePlayedCard(data.room);
    } else {
      thisRoundJustFinished = false;
    }
  });
});
