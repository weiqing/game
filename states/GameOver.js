
class GameOver extends Phaser.State {
  init(gameInfo) {
    this.stage.backgroundColor = '#eee';
    this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    this.scale.pageAlignHorizontally = true;
    this.scale.pageAlignVertically = true;
    this.gameInfo = gameInfo;
  }

  preload() {
    // this.load.image('bg', 'images/bg.jpg');
    // this.load.image('hero', 'images/hero.png');
  }

  create() {
    this.score = this.add.text(
        this.world.centerX,
        this.world.centerY - 100,
        'Total score: ' + this.gameInfo["score"].toString(),
        {
          font: 'Arial',
          fill: '#333',
          fontSize: 40
        }
      );
      this.score.anchor.setTo(0.5);
      
    this.startBtn = this.add.text(
      this.world.centerX,
      this.world.centerY,
      'Restart Game',
      {
        font: 'Arial',
        fill: '#333',
        fontSize: 64
      }
    );
    this.startBtn.anchor.setTo(0.5);
    this.startBtn.inputEnabled = true;
    this.startBtn.events.onInputDown.add(function() {
      this.state.start('Game');
    }, this);
  }
}
