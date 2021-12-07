import Player from './Player.mjs';
import Collectible from './Collectible.mjs';

const socket = io();
const canvas = document.getElementById('game-window');
const context = canvas.getContext('2d');

let mainPlayer = {};
let players = [];
let coin = {};
let movingDir = {left: false, right: false, up: false, down: false};
let currentMove = [];

const bronzeCoinImage = new Image();
bronzeCoinImage.src = 'https://cdn.freecodecamp.org/demo-projects/images/bronze-coin.png';
const silverCoinImage = new Image();
silverCoinImage.src = 'https://cdn.freecodecamp.org/demo-projects/images/silver-coin.png';
const goldCoinImage = new Image();
goldCoinImage.src = 'https://cdn.freecodecamp.org/demo-projects/images/gold-coin.png';
const mainPlayerImage = new Image();
mainPlayerImage.src = 'https://cdn.freecodecamp.org/demo-projects/images/main-player.png';
const otherPlayerImage = new Image();
otherPlayerImage.src = 'https://cdn.freecodecamp.org/demo-projects/images/other-player.png';

// Create main player in client after connect to server
socket.on('playerIn', data => {
  players = data.players;
  mainPlayer = new Player({
    // Play area 630x420, minus 30 pixels of player picture
    x: Math.round(Math.random() * 600),
    y: Math.round(Math.random() * 390),
    score: 0,
    id: data.id
  })
  // then send infomation of main player to server
  socket.emit('newPlayer', mainPlayer);
});

// Update players list everytime new player joined
socket.on('newPlayerJoined', data => {
  players.push(data.newPlayer);
  coin = data.coin;
});

// Get and remove direction base on key down & up
document.onkeydown = (e) => {
  if (e.keyCode == 65 || e.keyCode == 37) {
    movingDir.left = true;
  }
  else if (e.keyCode == 68 || e.keyCode == 39) {
    movingDir.right = true;
  }
  else if (e.keyCode == 87 || e.keyCode == 38) {
    movingDir.up = true;
  }
  else if (e.keyCode == 83 || e.keyCode == 40) {
    movingDir.down = true;
  }
  currentMove = Object.keys(movingDir).filter(dir => movingDir[dir]);
}
document.onkeyup = (e) => {
  if (e.keyCode == 65 || e.keyCode == 37) {
    movingDir.left = false;
  }
  else if (e.keyCode == 68 || e.keyCode == 39) {
    movingDir.right = false;
  }
  else if (e.keyCode == 87 || e.keyCode == 38) {
    movingDir.up = false;
  }
  else if (e.keyCode == 83 || e.keyCode == 40) {
    movingDir.down = false;
  }
  currentMove = Object.keys(movingDir).filter(dir => movingDir[dir]);
}

// Update when player move
socket.on('playerMove', movingPlayer => {
  for (let player of players) {
    if (player.id == movingPlayer.id) {
      player.x = movingPlayer.x;
      player.y = movingPlayer.y;
    }
  }
});

// Update when coin collected
socket.on('coinCollected', data => {
  coin = data.coin;
  for (let player of players) {
    if (player.id == data.winPlayer.id) {
      player.score = data.winPlayer.score;
    }
  }
});

// Update when player out
socket.on('playerOut', playerOut => {
  players = players.filter(player => player.id != playerOut.id);
});

// Draw canvas function
const drawCanvas = () => {
  // Draw canvas background & text & play area
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = 'gray';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = 'black';
  context.strokeRect(5, 55, 630, 420);
  context.font = '25px serif';
  context.fillStyle = 'black';
  context.fillText('Controls: WASD', 5, 40);
  context.font = '30px serif';
  context.fillText('COIN RACE', 250, 40);

  // Draw main player
  context.drawImage(mainPlayerImage, mainPlayer.x + 5, mainPlayer.y + 55);

  // Draw coin
  if (coin.value == 1) {
    context.drawImage(bronzeCoinImage, coin.x + 5, coin.y + 55);
  }
  else if (coin.value == 2) {
    context.drawImage(silverCoinImage, coin.x + 5, coin.y + 55);
  }
  else {
    context.drawImage(goldCoinImage, coin.x + 5, coin.y + 55);
  }

  // Put these code here because this function (drawCanvas) is call continuously & fast
  currentMove.forEach(dir => {
    mainPlayer.movePlayer(dir, 5);
    if (mainPlayer.collision(coin) && !coin.collected) {
      // collected attribute is used to prevent collect 1 coin many times
      coin.collected = true;
      mainPlayer.score += coin.value;
      socket.emit('coinCollected', {winPlayer: mainPlayer, coinID: coin.id});
    }
  });
  socket.emit('playerMove', mainPlayer);
  
  // Draw players
  players.forEach(player => {
    if (player.id == mainPlayer.id) {
      context.font = '25px serif';
      context.fillText(`${mainPlayer.calculateRank(players)}`, 500, 40);
    }
    else {
      context.drawImage(otherPlayerImage, player.x + 5, player.y + 55);
    }
  });

  // This code to call this function continuously
  requestAnimationFrame(drawCanvas);
}

// Call function drawCanvas()
drawCanvas();
