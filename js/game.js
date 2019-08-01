// window.onload = function() {
// 
// }

var aspect = window.innerWidth / window.innerHeight;
var gameWidth = 640;
var gameHeight = gameWidth / aspect;

var game = new Phaser.Game({
  width: gameWidth,
  height: gameHeight,
  renderer: Phaser.CANVAS
});

const startState = new Start();
const gameState = new Game();
const gameOverState = new GameOver();

game.state.add('Start', startState, false);
game.state.add('Game', gameState, false);
game.state.add('GameOver', gameOverState, false);
game.state.start('Start');
