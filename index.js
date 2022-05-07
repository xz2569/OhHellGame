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
// });s
// server.listen(3001, () => {
//   console.log("started server");
// });

var rooms = {};
var socketIdMapUser = {};
const waitTimeBetweenTricksWinnerDisplay = 2000;
const waitTimeBetweenRoundsScoreDisplay = 3000;
const waitTimeBetweenGuesses = 500;
const waitTimeBetweenCardPlays = 500;
const waitTimeBeforeGameStart = 100;

const suits = ["C", "D", "H", "S"];
const ranks = "2,3,4,5,6,7,8,9,10,J,Q,K,A".split(",");
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
  // set up the room if this is the first person to the room
  if (!(data.room in rooms)) {
    console.log(`[ROOM ${data.room}] >>> set up a new room to put players in`);
    rooms[data.room] = { players: [], gameStarted: false };
  }

  // add player to room if game has not started yet
  if (!rooms[data.room].gameStarted) {
    rooms[data.room].players.push(data.username);
    rooms[data.room][data.username] = {
      socket: socket,
      passcode: data.passcode,
      cardsInHand: [],
      connected: true,
    };
    socket.emit("room_joined", data.username);
  }
  // otherwise, reconnect player to the room if the player exists
  else {
    if (rooms[data.room].players.indexOf(data.username) !== -1) {
      console.log(`[ROOM ${data.room}] >>> reconnecting .....`);
      if (
        rooms[data.room][data.username].connected === false &&
        rooms[data.room][data.username].passcode == data.passcode
      ) {
        reconnectToGame(data, socket);
        socket.emit("room_joined", data.username);
      } else {
        console.log(`[ROOM ${data.room}]     >>> Failed`);
        socket.emit("connection_error", "ERROR: hmmmmm, imposter detected ");
      }
    }
  }
};

const reconnectToGame = (data, socket) => {
  // show game (skip join room page)
  socket.emit("show_game");

  // update the socket and connection status
  rooms[data.room][data.username].socket = socket;
  rooms[data.room][data.username].connected = true;

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
    rooms[data.room].players[rooms[data.room].currentGuessPlayerIndex] ===
      data.username &&
    rooms[data.room].currentGuessInProgress
  ) {
    collectOneGuess(data.room);
  }

  // if currently Playing
  if (
    rooms[data.room].players[rooms[data.room].currentTrickPlayerIndex] ===
    data.username
  ) {
    collectOnePlayedCard(data.room);
  }
};

const broadcastPlayers = (room) => {
  if (!rooms[room].gameStarted) {
    io.sockets.to(room).emit("waiting_players", rooms[room].players);
  } else {
    broadcastPlayersInfo(room, false);
  }
};

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
    // preparation so that at the end of guesses, all hands will be broadcasted
    rooms[room].playersInfo.forEach((playerInfo) => {
      playerInfo[rooms[room].currentRound].cardPlayed =
        rooms[room][playerInfo.username].cardsInHand[0];
    });
  }
};

const initRoom = (room, initNumTricks) => {
  rooms[room].gameStarted = true;
  rooms[room].lastMessage = "";
  rooms[room].numPlayers = rooms[room].players.length;
  rooms[room].maxTrickPerRound = Math.min(
    initNumTricks,
    Math.floor(51 / rooms[room].numPlayers)
  );
  // Information for the current Round
  rooms[room].currentRound = 1;
  rooms[room].currentRoundNumTricks = rooms[room].maxTrickPerRound;
  rooms[room].currentRoundFirstPlayerIndex = 0;
  rooms[room].currentRoundNumberTricksPlayed = 0;
  rooms[room].currentRoundTrumpSuit = "";
  rooms[room].currentRoundTrumpCard = "";
  // Information for the current trick
  rooms[room].currentTrickPlayerIndex = -1;
  rooms[room].currentTrickNumberCardsPlayed = 0;
  rooms[room].currentTrickSuit = "";
  rooms[room].currentTrickWinner = "";
  rooms[room].currentTrickWinningCard = "";
  rooms[room].currentTrickWinningSuit = "";
  rooms[room].currentTrickWinningRank = -1;
  // to ensure current guess is submitted
  rooms[room].currentGuessInProgress = false;
  rooms[room].currentGuessPlayerIndex = 0;
  rooms[room].currentGuessNumberSubmitted = 0;
  rooms[room].currentGuessTotal = 0;
  rooms[room].currentGuessForbidden = -1;
  // player Info that is public for everyone
  rooms[room].playersInfo = [];
  rooms[room].players.forEach((player, index) =>
    rooms[room].playersInfo.push({
      username: player,
      avatarId: index + 1,
      [rooms[room].currentRound]: {
        prevCardPlayed: "",
        cardPlayed: "",
        guess: -1,
        made: 0,
        score: 0,
      },
      score: 0,
    })
  );
};

const startRound = async (room) => {
  // braodcast games status (hide score board & show guess info)
  io.sockets.to(room).emit("staring_new_round");

  // deal card
  var numberCardsDealed = dealCards(room);

  // broadcast other players information if at special rounds
  if (rooms[room].currentRoundNumTricks === 1) {
    broadcastPlayersInfo(room, true);
  }

  // reveal trump card
  revealTrumpCard(room, numberCardsDealed);

  // broadcast the leading player (crown sign)
  io.sockets
    .to(room)
    .emit(
      "leading_player",
      rooms[room].players[rooms[room].currentRoundFirstPlayerIndex]
    );

  // start collecting guesses
  await delay(waitTimeBetweenGuesses);
  collectOneGuess(room);
};

const dealCards = (room) => {
  var start_from = 0;
  var num_cards = rooms[room].currentRoundNumTricks;
  var cardsInHand = [];

  // shuffle the deck
  shuffleArray(deck);

  // deal cards to players
  rooms[room].players.forEach((username) => {
    cardsInHand = deck.slice(start_from, start_from + num_cards);
    console.log(
      `[ROOM ${room}] dealing to player ${username} cards ${cardsInHand}`
    );
    // special round or not
    if (rooms[room].currentRoundNumTricks !== 1) {
      rooms[room][username].socket.emit("deal_card", cardsInHand);
    } else {
      rooms[room][username].socket.emit("deal_card", ["back"]);
    }
    start_from += num_cards;
    rooms[room][username].cardsInHand = cardsInHand;
  });

  // return number of cards dealed (for keeping track of the trump card)
  return start_from;
};

const revealTrumpCard = (room, numberCardsDealed) => {
  var trump_card;

  // special round without trump card
  if (rooms[room].currentRound === rooms[room].maxTrickPerRound + 1) {
    trump_card = "back";
  } else {
    trump_card = deck.slice(numberCardsDealed, numberCardsDealed + 1)[0];
  }
  console.log(`[ROOM ${room}] trump card is ${trump_card}`);

  // update room information and send trump card to all players
  rooms[room].currentRoundTrumpCard = trump_card;
  rooms[room].currentRoundTrumpSuit = trump_card[trump_card.length - 1];
  io.sockets.to(room).emit("trump_card", trump_card);
};

const collectOneGuess = (room) => {
  // set room status
  rooms[room].currentGuessInProgress = true;

  // ask the next player to submit a guess
  var username = rooms[room].players[rooms[room].currentGuessPlayerIndex];
  console.log(`[ROOM ${room}] asking player ${username} to submit a guess`);
  rooms[room][username].socket.emit(
    "your_turn_to_guess",
    rooms[room].currentGuessForbidden
  );

  // broadcast "who is guessing" to all players (message & spotlight)
  if (rooms[room].currentGuessNumberSubmitted === 0) {
    rooms[room].lastMessage =
      `Starting round ${rooms[room].currentRound}` +
      ` ... ` +
      `${username} is guessing`;
  } else {
    rooms[room].lastMessage = `${username} is guessing`;
  }
  io.sockets.to(room).emit("message", rooms[room].lastMessage);
  io.sockets.to(room).emit("playing_player", username);
};

const updateRoomWithNewGuess = (data) => {
  // keep track of guesses so far
  rooms[data.room].currentGuessNumberSubmitted++;
  rooms[data.room].currentGuessTotal += data.guess;
  rooms[data.room].currentGuessPlayerIndex =
    (rooms[data.room].currentGuessPlayerIndex + 1) %
    rooms[data.room].numPlayers;

  // if the next player to guess is the last player, set restriction
  if (
    rooms[data.room].currentGuessNumberSubmitted ===
    rooms[data.room].numPlayers - 1
  ) {
    rooms[data.room].currentGuessForbidden =
      rooms[data.room].currentRoundNumTricks -
      rooms[data.room].currentGuessTotal;
  }
};

const prepRoomAfterGuessComplete = (room) => {
  // update room status
  rooms[room].currentGuessInProgress = false;

  // set the player index for upcoming trick
  rooms[room].currentTrickPlayerIndex =
    rooms[room].currentRoundFirstPlayerIndex;

  // revael hand automatically if at special rounds
  if (rooms[room].currentRoundNumTricks === 1) {
    rooms[room].players.forEach((username) => {
      rooms[room][username].socket.emit(
        "deal_card",
        rooms[room][username].cardsInHand
      );
    });
  }
};

const startTrick = (room) => {
  // broadcast leader of the trick
  io.sockets
    .to(room)
    .emit(
      "leading_player",
      rooms[room].players[rooms[room].currentTrickPlayerIndex]
    );
  // ask the first player to play a card
  collectOnePlayedCard(room);
};

const collectOnePlayedCard = (room) => {
  // gather username of the next player
  var username = rooms[room].players[rooms[room].currentTrickPlayerIndex];
  console.log(`[ROOM ${room}] ask player ${username} to play a card`);

  // ask the player to play (manually or automatically)
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

  // broadcast current player to all players
  rooms[room].lastMessage = `${username} is playing`;
  io.sockets.to(room).emit("message", rooms[room].lastMessage);
  io.sockets.to(room).emit("playing_player", username);
};

const updateRoomWithNewCardPlayed = (data) => {
  // update cardsInHand
  rooms[data.room][data.username].cardsInHand = rooms[data.room][
    data.username
  ].cardsInHand.filter((card) => card !== data.cardPlayed);

  // update information relating to the current trick
  updateCurrentTrickInfo(data);

  // update the winner of the current trick so far
  updateCurrentTrickWinner(data);
};

const updateCurrentTrickInfo = (data) => {
  rooms[data.room].currentTrickPlayerIndex =
    (rooms[data.room].currentTrickPlayerIndex + 1) %
    rooms[data.room].numPlayers;
  rooms[data.room].currentTrickNumberCardsPlayed++;
  if (rooms[data.room].currentTrickNumberCardsPlayed === 1) {
    rooms[data.room].currentTrickSuit =
      data.cardPlayed[data.cardPlayed.length - 1];
  }
};

const updateCurrentTrickWinner = (data) => {
  // if first card played, automatically the winner
  if (rooms[data.room].currentTrickNumberCardsPlayed === 1) {
    setNewWinner(data);
  }
  // otherwise, compare with previous winning card
  else {
    var played_suit = data.cardPlayed[data.cardPlayed.length - 1];
    var played_rank = ranks.indexOf(
      data.cardPlayed.slice(0, data.cardPlayed.length - 1)
    );
    if (played_suit === rooms[data.room].currentTrickWinningSuit) {
      if (played_rank > rooms[data.room].currentTrickWinningRank) {
        setNewWinner(data);
      }
    } else {
      if (played_suit === rooms[data.room].currentRoundTrumpSuit) {
        setNewWinner(data);
      }
    }
  }

  // log winner after new card played
  console.log(
    `[ROOM ${data.room}] winner so far is ${
      rooms[data.room].currentTrickWinner
    }`
  );
};

const setNewWinner = (data) => {
  rooms[data.room].currentTrickWinner = data.username;
  rooms[data.room].currentTrickWinningCard = data.cardPlayed;
  rooms[data.room].currentTrickWinningSuit =
    rooms[data.room].currentTrickWinningCard[
      rooms[data.room].currentTrickWinningCard.length - 1
    ];
  rooms[data.room].currentTrickWinningRank = ranks.indexOf(
    rooms[data.room].currentTrickWinningCard.slice(
      0,
      rooms[data.room].currentTrickWinningCard.length - 1
    )
  );
};

const broadCastTrickWinner = (room) => {
  rooms[room].lastMessage = `Winner is ${rooms[room].currentTrickWinner}`;
  io.sockets.to(room).emit("message", rooms[room].lastMessage);
  io.sockets.to(room).emit("winning_player", rooms[room].currentTrickWinner);
  io.sockets.to(room).emit("playing_player", "");

  // update playersInfo (made) and broadcast to all
  rooms[room].playersInfo.forEach((playerInfo) => {
    if (playerInfo.username === rooms[room].currentTrickWinner) {
      playerInfo[rooms[room].currentRound].made++;
    }
  });
  broadcastPlayersInfo(room, false);
};

const finishTrick = (room) => {
  // update round information
  rooms[room].currentRoundNumberTricksPlayed++;

  // prepare current trick information for the next trick
  prepCurrentTrickInfoForNextTrick(room);

  // update playersInfo (cardPlayed and prevCardPlayed) and broadcast
  rooms[room].playersInfo.forEach((playerInfo) => {
    playerInfo[rooms[room].currentRound].prevCardPlayed =
      playerInfo[rooms[room].currentRound].cardPlayed;
    playerInfo[rooms[room].currentRound].cardPlayed = "";
  });
  broadcastPlayersInfo(room, false);

  // reset winning player and broadcast
  io.sockets.to(room).emit("winning_player", "");
};

const prepCurrentTrickInfoForNextTrick = (room) => {
  rooms[room].currentTrickPlayerIndex = rooms[room].players.indexOf(
    rooms[room].currentTrickWinner
  );
  rooms[room].currentTrickNumberCardsPlayed = 0;
  rooms[room].currentTrickSuit = "";
};

const finishRound = (room) => {
  // update score of players
  updatePlayerScore(room);

  // update room information for next round
  prepCurrentRoundInfoForNextRound(room);

  // update playersInfo for next round and broadcast to all
  rooms[room].playersInfo.forEach((playerInfo) => {
    playerInfo[rooms[room].currentRound] = {
      prevCardPlayed: "",
      cardPlayed: "",
      guess: -1,
      made: 0,
      score: 0,
    };
  });
  broadcastPlayersInfo(room, false);

  // broadcast to players game status (show score board)
  io.sockets.to(room).emit("end_of_round");
};

const updatePlayerScore = (room) => {
  rooms[room].playersInfo.forEach((playerInfo) => {
    var guess = playerInfo[rooms[room].currentRound].guess;
    var made = playerInfo[rooms[room].currentRound].made;
    var score_this_round;
    if (guess === made) {
      score_this_round = 10 + 10 * made;
    } else {
      score_this_round = -10 * Math.abs(guess - made);
    }
    playerInfo[rooms[room].currentRound].score = score_this_round;
    playerInfo.score += score_this_round;
  });
};

const prepCurrentRoundInfoForNextRound = (room) => {
  rooms[room].currentRoundFirstPlayerIndex =
    (rooms[room].currentRoundFirstPlayerIndex + 1) % rooms[room].numPlayers;
  rooms[room].currentRoundNumberTricksPlayed = 0;
  rooms[room].currentRoundTrumpSuit = "";
  rooms[room].currentRound++;
  if (rooms[room].currentRound <= rooms[room].maxTrickPerRound) {
    rooms[room].currentRoundNumTricks =
      rooms[room].maxTrickPerRound + 1 - rooms[room].currentRound;
  } else {
    rooms[room].currentRoundNumTricks =
      rooms[room].currentRound - rooms[room].maxTrickPerRound;
  }
  rooms[room].currentGuessTotal = 0;
  rooms[room].currentGuessNumberSubmitted = 0;
  rooms[room].currentGuessPlayerIndex =
    rooms[room].currentRoundFirstPlayerIndex;
  rooms[room].currentGuessForbidden = -1;
};

const finishGame = (room) => {
  console.log(`[ROOM ${room}] game finished!`);
  rooms[room].lastMessage = "Game complete!";
  io.sockets.to(room).emit("message", rooms[room].lastMessage);
  io.sockets.to(room).emit("end_of_game");
};

/* collection of socket.on(...) functions */
io.on("connection", (socket) => {
  console.log("New connection", socket.id);

  socket.on("disconnect", () => {
    console.log(socket.id, "disconnected");
    if (socket.id in socketIdMapUser) {
      // gather username and room information correponding to the socket
      var username = socketIdMapUser[socket.id].username;
      var room = socketIdMapUser[socket.id].room;
      console.log(
        `[ROOM ${room}] player ${username} disconnected from room ${room}`
      );

      // remove socket from socketIdMapUser
      delete socketIdMapUser[socket.id];

      // update player information and broadcast if in waiting room
      if (room in rooms) {
        rooms[room][username].connected = false;
        if (!rooms[room].gameStarted) {
          rooms[room].players = rooms[room].players.filter(
            (player) => player !== username
          );
          broadcastPlayers(room);
        }
      }
    }
  });

  socket.on("join_room", (data) => {
    // add socket to room
    socket.join(data.room);

    // if username exists, add '_' to name
    try {
      while (rooms[data.room].players.indexOf(data.username) !== -1) {
        if (!rooms[data.room].gameStarted) {
          data.username = data.username + "_";
        } else {
          break;
        }
      }
    } catch (e) {}

    // add player to room
    console.log(
      `[ROOM ${data.room}] player ${data.username} joined room ${data.room}`
    );
    addPlayerToRoom(data, socket);

    // broadcast the new player
    if (!rooms[data.room].gameStarted) {
      broadcastPlayers(data.room);
    }

    // store which user and room this socket is for
    if (!rooms[data.room].gameStarted) {
      socketIdMapUser[socket.id] = {
        username: data.username,
        room: data.room,
      };
    }
  });

  socket.on("start_game", async ({ room, initNumTricks }) => {
    console.log(`[ROOM ${room}] game starting...`);

    // set up the game room and front-end Playzone
    io.sockets.to(room).emit("show_game");
    initRoom(room, initNumTricks);
    broadcastPlayersInfo(room, false);

    // start the first round
    await delay(waitTimeBeforeGameStart);
    startRound(room);
  });

  socket.on("submit_guess", async (data) => {
    console.log(
      `[ROOM ${data.room}] player ${data.username} guessed ${data.guess} hands`
    );

    // update playersInfo
    rooms[data.room].playersInfo.forEach((playerInfo) => {
      if (playerInfo.username === data.username) {
        playerInfo[rooms[data.room].currentRound].guess = data.guess;
      }
    });

    // update room information based on new guess
    updateRoomWithNewGuess(data);

    // broadcast playersInfo to all players
    broadcastPlayersInfo(
      data.room,
      rooms[data.room].currentRoundNumTricks === 1
    );

    // delay before asking the next player for guesses
    await delay(waitTimeBetweenGuesses);

    // collect guess from the next player or start playing
    if (
      rooms[data.room].currentGuessNumberSubmitted !==
      rooms[data.room].numPlayers
    ) {
      collectOneGuess(data.room);
    } else {
      prepRoomAfterGuessComplete(data.room);
      startTrick(data.room);
    }
  });

  socket.on("card_played", async (data) => {
    console.log(
      `[ROOM ${data.room}] player ${data.username} played card ${data.cardPlayed}`
    );

    // update playersInfo and broadcast playersInfo to all players
    rooms[data.room].playersInfo.forEach((playerInfo) => {
      if (playerInfo.username === data.username) {
        playerInfo[rooms[data.room].currentRound].cardPlayed = data.cardPlayed;
      }
    });
    broadcastPlayersInfo(data.room, false);

    // update room information based on new card played
    updateRoomWithNewCardPlayed(data);

    // if this is the last card for the current trick
    var trickInProgress =
      rooms[data.room].currentTrickNumberCardsPlayed <
      rooms[data.room].numPlayers;
    if (!trickInProgress) {
      console.log(`[ROOM ${data.room}] current trick finished`);
      await delay(waitTimeBetweenCardPlays);

      // broadcast winner to all players
      broadCastTrickWinner(data.room);

      // wait and display winner and played cards
      await delay(waitTimeBetweenTricksWinnerDisplay);

      // clean up and prepare for next trick
      finishTrick(data.room);
    }

    // if this is also the last trick of the current round
    var roundInProgress =
      rooms[data.room].currentRoundNumberTricksPlayed <
      rooms[data.room].currentRoundNumTricks;
    if (!roundInProgress) {
      console.log(`[ROOM ${data.room}] current round finished`);
      finishRound(data.room);
      await delay(waitTimeBetweenRoundsScoreDisplay);
    }

    // if this is also the last round of the game
    var gameInProgress =
      rooms[data.room].currentRound <= rooms[data.room].maxTrickPerRound * 2;
    if (!gameInProgress) {
      finishGame(data.room);
    }

    // next step of the game for three situations
    if (trickInProgress) {
      console.log(`[ROOM ${data.room}] current trick continuing`);
      await delay(waitTimeBetweenCardPlays);
      collectOnePlayedCard(data.room);
    } else {
      if (roundInProgress) {
        console.log(`[ROOM ${data.room}] current round continuing, next trick`);
        startTrick(data.room);
      } else {
        if (gameInProgress) {
          console.log(
            `[ROOM ${data.room}] current game continuing, next round`
          );
          startRound(data.room);
        }
      }
    }
  });
});
