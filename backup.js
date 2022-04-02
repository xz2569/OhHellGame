// socketId2PlayerAndRoom = {[socketId]: {username: String, room: String}}
var socketId2PlayerAndRoom = {};

socket.on("disconnect", () => {
  try {
    const username = socketId2PlayerAndRoom[socketId].username;
    const room = socketId2PlayerAndRoom[socketId].room;
    removePlayerFromRoom({ username: username, room: room });
    broadcastPlayers(room);
  } catch (e) {}
});

const removePlayerFromRoom = (data) => {
  console.log(`user with username=${data.username} is disconnected`);
  if (!rooms[data.room].gameStarted) {
    rooms[data.room].players = rooms[data.room].players.filter(
      (player) => player.username !== data.username
    );
  }
};

const addPlayerToSockets = (data, socketId) => {
  socketId2PlayerAndRoom[socketId] = {
    username: data.username,
    room: data.room,
  };
};
