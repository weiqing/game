class Game extends Phaser.State {
  preload() {
    this.tileSize = 100;
    this.colMax = 5;
    this.rowMax = 5;
    this.gameInfo;
    this.bmd;
    this.height = this.world.height;
    this.width = this.world.width;
    this.game.time.desiredFps = 120;

    // var game = new Phaser.Game(tileSize * (colMax + 2), tileSize * (rowMax + 5), Phaser.CANVAS, "", { preload: onPreload, create: onCreate, update: onUpdate });
    // game array, starts with all cells to zero
    this.fieldArray = Array(this.colMax * this.rowMax).fill(0);
    // this is the group which will contain all tile sprites
    this.tileSprites;
    this.frontGroup;
    this.scoreTile;
    this.lifeTile;
    this.foundBlocksCancelDedupe = false;
    
    this.colors = {
        0:0x71FF61,
        1:0xBAF058,
        2:0x5BC2FA,
        3:0xFEC764,
        4:0xFD725D,
        5:0x179D87,
        6:0x7768F7,
        7:0xF45CC2,
        8:0xFFBBBB,
        9:0xFFAAAA
    };

    this.textColors = {
        1:"3FAC21",
        2:"208BFA",
        3:"FC732F",
        4:"F5D19A",
        5:"83E59F",
        6:"CDBDFD",
        7:"FCBEA2"
    };

    for (var i = 10; i < 999; i++) {
      this.colors[i] = Math.random() * 0xFFFFFF << 0;
    }

    this.bmd = this.add.bitmapData(this.tileSize, this.tileSize);

    // draw to the canvas context like normal
    this.bmd.ctx.beginPath();
    this.bmd.ctx.rect(0, 0, this.tileSize, this.tileSize);
    this.bmd.ctx.fillStyle = '#fefefe';
    this.bmd.ctx.fill();

    this.background = this.add.image(0, 0, this.bmd);
    this.background.height = this.height;
    this.background.width = this.width;

    this.canMove = false;
    this.lock = 0;
  }

  create() {
    this.gameInfo = { "score": 0, "life": 5 };

    // sprite group declaration
    this.tileSprites = this.add.group();
    this.frontGroup = this.add.group();

    const verticalMargin = (this.height - (this.tileSize * this.rowMax)) / 2;
    const horizontalMargin = (this.width - (this.tileSize * this.colMax)) / 2;

    this.tileSprites.x = horizontalMargin;
    this.tileSprites.y = verticalMargin;

    this.frontGroup.x = horizontalMargin;
    this.frontGroup.y = verticalMargin;

    this.scoreTile = this.add.text(160, 100, "score: 0");
    this.scoreTile.anchor.set(0.5);

    this.lifeTile = this.add.text(150, 200, "life: 5");
    this.lifeTile.anchor.set(0.5);
    this.initGame();
  }

  update() {
    if (this.canMove && this.lock == 0) {
      this.fall();
    }
    if (!this.containsZero() && this.lock == 0) {
      this.check();
    }
    if (this.gameInfo["life"] < 0) {
        this.state.start('GameOver', true, false, this.gameInfo);
    }
    this.lifeTile.setText("life: " + this.gameInfo["life"].toString());
    this.scoreTile.setText("score: " + this.gameInfo["score"].toString());
  }

  containsZero() {
    for (var j = this.colMax - 1; j >= 0; j--) {
      for (var i = this.rowMax - 1; i >= 0; i--) {
        if (this.fieldArray[i * this.colMax + j] == 0) return true;
      }
    }
    return false;
  }

  findRandomBlocksToCancel() {
    var result = [];
    for (var j = this.colMax - 1; j >= 0; j--) {
      for (var i = 0; i < this.rowMax; i++) {
        var visited = Array(this.colMax * this.rowMax).fill(0);
        var val = this.findBlocks(i, j, visited);
        if (val >= 3) {
          result.push(i * this.colMax + j);
        }
      }
    }
    if (result.length == 0) {
      return null;
    } else {
      var pos = result.sort(function (a, b) { return a - b; })[0];
      return pos;
    }
  }

  check() {
    var game = this;
    if (this.containsZero() || this.lock != 0 || !this.canMove) {
      return;
    }
    var pos = this.findRandomBlocksToCancel();

    if (pos != null) {
      var x = this.toRow(pos);
      var y = this.toCol(pos);
      this.canMove = false;
      if (this.foundBlocksCancelDedupe == true) {
        return;
      }

      this.foundBlocksCancelDedupe = true;
      setTimeout(function () {
        game.shrinkBlocksPostClick(x, y, function () {
          game.foundBlocksCancelDedupe = false;
        });


      }, 300);
    }
  }

  fall() {
    var game = this;
    for (var i = 0; i < this.rowMax; i++) {
      for (var j = 0; j < this.colMax; j++) {
        if (i == 0 && this.fieldArray[i * this.colMax + j] == 0) {
          var randomValue = Math.floor(Math.random() * 4) + 1;
          this.createTile(i, j, randomValue);
          this.fieldArray[i * this.colMax + j] = randomValue;
          this.updateNumbers();
        }
        if (i + 1 < this.rowMax &&
          this.fieldArray[(i + 1) * this.colMax + j] == 0 &&
          this.fieldArray[i * this.colMax + j] != 0) {
          this.tileSprites.forEach(function (item) {
            var endPos = (i + 1) * game.colMax + j;
            if (item.pos == i * game.colMax + j) {
              game.lock += 1;
              game.moveTileWithSteps(item, [item.pos, endPos], function (currentTile) {

                game.fieldArray[endPos] = game.fieldArray[currentTile.pos];
                game.fieldArray[currentTile.pos] = 0;
                currentTile.pos = endPos;
                game.lock -= 1;
              });
            }
          });
        }
      }
    }
  }

  click(i, j) {
    if (this.canMove == true && this.lock == 0) {
      this.gameInfo["life"] -= 1;
      this.fieldArray[i * this.colMax + j] += 1;
      this.updateNumbers();
      this.shrinkBlocksPostClick(i, j);
    }
  }

  shrinkBlocksPostClick(i, j, callback) {
    var game = this;
    if (game.findBlocks(i, j, Array(game.colMax * game.rowMax).fill(0)) >= 3) {
      game.canMove = false;
      var targetVal = game.fieldArray[i * game.colMax + j];
      var visited = Array(game.colMax * game.rowMax).fill(0);
      var result = {};
      game.findConnectingBlocks(i, j, targetVal, visited, result, []);
      var maxLength = 0;
      var maxPos = i * game.colMax + j;
      for (var pos in result) {
        if (maxLength < result[pos].length) {
          maxLength = result[pos].length;
          maxPos = pos;
        }
        if (pos != i * game.colMax + j) {
          game.fieldArray[pos] = 0;
        }
      }
      for (var pos in result) {
        var path = result[pos].reverse();
        game.tileSprites.forEach(function (item) {
          if (item.pos == pos) {
            game.moveTileWithSteps(item, path, function (currentTile) {
              item.destroy();
              if (maxPos == currentTile.pos) {
                if (callback) {
                  callback();
                }
                game.fieldArray[i * game.colMax + j] += 1;
                game.canMove = true;
                game.updateNumbers();
                if (game.gameInfo["life"] <= 4) {
                  game.gameInfo["life"] += 1;
                }
              }
            }, function (currentTile) {
              var style = { font: "bold 30px Arial", fill: "#aaaaaa", align: "center" };
              var score = parseInt(currentTile.children[0]._text) * 10;
              var text = game.add.text(currentTile.x + game.tileSize / 2, currentTile.y + game.tileSize / 2, score.toString(), style);
              text.visible = false;
              text.anchor.set(0.5);
              game.frontGroup.add(text);
              var textMovement = game.add.tween(text);
              var textScale = game.add.tween(text.scale);
              textMovement = textMovement.to({ alpha: 0.5, x: text.x, y: text.y - 100 }, 500, Phaser.Easing.Linear.None, true, 200 * (maxLength - path.length));
              textMovement.onComplete.add(function () {
                text.destroy();
                game.gameInfo["score"] += score;
              }, this);
              textMovement.onStart.add(function () {
                text.visible = true;
              }, this);
              textMovement.start();
              textScale.to({ x: 3, y: 3 }, 400, Phaser.Easing.Linear.None, true, 200 * (maxLength - path.length) + 100);
              textScale.start();
            });
          }
        });
      }
    }
  }

  findConnectingBlocks(i, j, targetVal, visited, result, path) {
    if (i < 0 || i >= this.rowMax) return;
    if (j < 0 || j >= this.colMax) return;
    if (visited[i * this.colMax + j] == 1) return;

    var val = this.fieldArray[i * this.colMax + j];
    visited[i * this.colMax + j] = 1;
    if (val == targetVal) {
      var _path = path.slice();
      _path.push(i * this.colMax + j);
      result[i * this.colMax + j] = _path;
      this.findConnectingBlocks(i - 1, j, targetVal, visited, result, _path);
      this.findConnectingBlocks(i + 1, j, targetVal, visited, result, _path);
      this.findConnectingBlocks(i, j - 1, targetVal, visited, result, _path);
      this.findConnectingBlocks(i, j + 1, targetVal, visited, result, _path);
    }
  }

  moveTileWithSteps(tile, steps, callback, preCallback) {
    var game = this;
    if (preCallback) {
      preCallback(tile);
    }
    var movement = game.add.tween(tile);
    movement.currentTile = tile;
    for (var i in steps) {
      if (i == 0) continue;
      var step = steps[i];
      movement = movement.to({ x: game.tileSize * (game.toCol(step)), y: game.tileSize * (game.toRow(step)) }, 100, Phaser.Easing.Linear.None);
    }

    movement.onComplete.add(function () {
      callback(movement.currentTile);
    }, this);
    movement.start();
  }

  initGame() {
    for (var i = 0; i < this.rowMax; i++) {
      for (var j = 0; j < this.colMax; j++) {
        var pos = i * this.colMax + j;
        var visited = Array(this.colMax * this.rowMax).fill(0);
        do {
          visited = Array(this.colMax * this.rowMax).fill(0);
          var randomValue = Math.floor(Math.random() * 5) + 1;
          this.fieldArray[pos] = randomValue;
        } while (this.findBlocks(i, j, visited) > 2)
        this.createTile(i, j, this.fieldArray[pos]);
      }
    }
  }

  createTile(i, j, val) {
    var game = this;
    var pos = i * this.colMax + j;
    var tile = this.add.sprite(this.toCol(pos) * this.tileSize, (this.toRow(pos) - 1) * this.tileSize, this.bmd);
    tile.pos = pos;
    // at the beginning the tile is completely transparent
    tile.alpha = 1;
    // creation of a text which will represent the value of the tile
    var text = this.add.text(this.tileSize / 2, this.tileSize / 2, val.toString(), { font: "bold 30px Arial", align: "center" });
    // setting text anchor in the horizontal and vertical center
    text.anchor.set(0.5);
    // adding the text as a child of tile sprite
    tile.addChild(text);
    tile.inputEnabled = true;
    tile.events.onInputDown.add(() => {
      var x = this.toRow(tile.pos);
      var y = this.toCol(tile.pos);
      game.click(x, y);
    }, this);
    // adding tile sprites to the group
    this.tileSprites.add(tile);
    tile.text = text;
    // creation of a new tween for the tile sprite
    var fadeIn = this.add.tween(tile);
    // the tween will make the sprite completely opaque in 250 milliseconds
    fadeIn.to({ x: this.tileSize * (this.toCol(pos)), y: this.tileSize * (this.toRow(pos)) }, 100, Phaser.Easing.Quadratic.In);
    // tween callback

    fadeIn.onComplete.add(function () {
      // updating tile numbers. This is not necessary the 1st time, anyway
      game.updateNumbers();
      // now I can move
      game.canMove = true;
    })
    // starting the tween
    fadeIn.start();
  }

  findBlocks(i, j, visited) {
    if (i < 0 || i > this.rowMax - 1) {
      return 0;
    }
    if (j < 0 || j > this.colMax - 1) {
      return 0;
    }

    if (visited[i * this.colMax + j] == 1) {
      return 0;
    } else {
      visited[i * this.colMax + j] = 1;
    }

    var pos = i * this.colMax + j;
    var val = this.fieldArray[pos];
    var up = 0;
    var down = 0;
    var left = 0;
    var right = 0;
    var next = -1;

    next = (i - 1) * this.colMax + j;
    if (this.fieldArray[next] == val) {
      up = this.findBlocks(i - 1, j, visited);
    }

    next = (i + 1) * this.colMax + j;
    if (this.fieldArray[next] == val) {
      down = this.findBlocks(i + 1, j, visited);
    }

    next = i * this.colMax + j - 1;
    if (this.fieldArray[next] == val) {
      left = this.findBlocks(i, j - 1, visited);
    }

    next = i * this.colMax + j + 1;
    if (this.fieldArray[next] == val) {
      right = this.findBlocks(i, j + 1, visited);
    }

    return up + down + right + left + 1;
  }

  // GIVING A NUMBER IN A 1-DIMENSION ARRAY, RETURNS THE ROW
  toRow(n) {
    return Math.floor(n / this.rowMax);
  }

  // GIVING A NUMBER IN A 1-DIMENSION ARRAY, RETURNS THE COLUMN
  toCol(n) {
    return n % this.colMax;
  }

  updateNumbers() {
    var game = this;
    this.tileSprites.forEach(function (item) {
      var value = game.fieldArray[item.pos];
      item.getChildAt(0).text = value;
      item.tint = game.colors[value];
      var style = { font: "bold 30px Arial", fill: "#"+game.textColors[value], align: "center" };
      item.text.setStyle(style, true);
    });
  }
}
