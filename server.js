require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const expect = require('chai');
const socket = require('socket.io');
const helmet = require('helmet');
const cors = require('cors');
const nocache = require("nocache");

const fccTestingRoutes = require('./routes/fcctesting.js');
const runner = require('./test-runner.js');

const app = express();

app.use('/public', express.static(process.cwd() + '/public'));
app.use('/assets', express.static(process.cwd() + '/assets'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors({origin: '*'})); 

app.use(helmet({
  hidePoweredBy: {
    setTo: "PHP 7.4.3",
  },
}));
app.use(nocache());
// app.set('x-powered-by', 'PHP 7.4.3');

// Index page (static HTML)
app.route('/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
  });

// For FCC testing purposes
fccTestingRoutes(app);

const portNum = process.env.PORT || 3000;

// Set up server and tests
const server = app.listen(portNum, () => {
  console.log(`Listening on port ${portNum}`);
  if (process.env.NODE_ENV==='test') {
    console.log('Running Tests...');
    setTimeout(function () {
      try {
        runner.run();
      } catch (error) {
        console.log('Tests are not valid:');
        console.error(error);
      }
    }, 1500);
  }
});


// ********************************************************************

const Collectible = require('./public/Collectible.mjs');
const io = socket(server);
let players = [];
let coin = {};
let collectedCoins = [];

const newCoin = () => {
  let rand = Math.random();
  let val = rand < 0.6 ? 1 : rand < 0.9 ? 2 : 3;
  return new Collectible({
    // Play area 630x420, minus 15 pixels of coin picture
    x: Math.round(Math.random() * 615),
    y: Math.round(Math.random() * 405),
    value: val,
    id: Date.now()
  });
}

// Use io.sockets.on() to listen for a new connection from the client
/*
  socket.emit() - only send to the sender socket
  io.emit() - send to all connected sockets
  socket.broadcast.emit() - send to all connected sockets except sender socket
*/
io.sockets.on('connection', socket => {
  console.log(`Server - New connected socket id: ${socket.id}`);
  // Send the id anf list of current players back to the new connection
  socket.emit('playerIn', {id: socket.id, players});

  // Client create new player object and send back to server
  socket.on('newPlayer', newPlayer => {
    coin = newCoin();
    players.push(newPlayer);
    // Send new player object to all connected sockets for adding to players list
    io.emit('newPlayerJoined', {newPlayer, coin});
  });

  // Update when player move
  socket.on('playerMove', movingPlayer => {
    for (let player of players) {
      if (player.id == movingPlayer.id) {
        player.x = movingPlayer.x;
        player.y = movingPlayer.y;
      }
    }
    // Send moving player to all clients (sockets)
    io.emit('playerMove', movingPlayer);
  });

  // When a player collected coin
  socket.on('coinCollected', ({winPlayer, coinID}) => {
    //Check to be sure 1 coin just collected by 1 player
    if (!collectedCoins.includes(coinID)) {
      collectedCoins.push(coinID);
      coin = newCoin();
      io.emit('coinCollected', {winPlayer, coin});
      for (let player of players) {
        if (player.id == winPlayer.id) {
          player.score = winPlayer.score;
        }
      }
    }
  });
  
  // When player out
  socket.on('disconnect', () => {
    console.log(`Server - Disconnected socket id: ${socket.id}`);
    players = players.filter(player => player.id != socket.id);
    // Send id to all connected sockets for removing out of players list
    io.emit('playerOut', {id: socket.id});
  });

});
    
// 404 Not Found Middleware
app.use(function(req, res, next) {
  res.status(404)
    .type('text')
    .send('Not Found');
});

module.exports = app; // For testing
