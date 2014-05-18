/**
 * enchant.js ver0.8.1
 */

enchant();

define = function() {
	game.DEBUG = false;
	game.VERSION = 140514;
	game.STAGE_ROWS	= 6;
	game.STAGE_LINES = 5;
	game.STAGE_H = 250;
	game.STAGE_W = 300;
	game.DROP_SIZE = 50;
	game.DROP_COLOR_SIZE = 6;
	game.DROP_COLOR_ASSOSIATE = {0:"blue", 1:"red", 2:"yellow", 3:"gray", 4:"green", 5:"orange"};
	game.DROP_COLOR_FRAME = {"blue":0, "red":1, "yellow":2, "gray":3, "green":4, "orange":5};
	game.SLIDE_FRAME = 30;
	game.SLIDE_EASING = enchant.Easing.CIRC_EASEOUT;
	game.EXCHANGE_FRAME = 10;
	game.EXCHANGE_EASING = enchant.Easing.CIRC_EASEOUT;
	game.GAME_TIME = 120;
	game.MANIPULATION_TIME = 5;
	game.MATCH_THRESHOLD = 3;
	game.BONUS_ADD_PER_ONE = 0.25;
	game.BONUS_COMBO = 0.25
}

DropManager = enchant.Class.create({
	initialize: function() {
		this.drops = new Array();
		var number_of_drops = game.STAGE_ROWS * game.STAGE_LINES;
		for (var i=0; i<number_of_drops; i++) {
			this.drops[i] = new Drop();
		}
	}
	, setDrops: function() {
		for (var i=0; i<this.drops.length; i++) {
			var drop = this.drops[i];
			var row  = Math.floor(i % game.STAGE_ROWS);
			var line = Math.floor(i / game.STAGE_ROWS);
			drop.setDrop(game.stage, row, line);
		}
	}
	, getDropByRowLine: function(row, line) {
		for (key in this.drops) {
			var drop = this.drops[key];
			if (drop.row == row && drop.line == line) {
				return drop;
				break;
			}
		}
	}
});

Drop = enchant.Class.create(enchant.Sprite, {
	initialize: function() {
		var width  = game.DROP_SIZE;
		var height = game.DROP_SIZE;
		Sprite.call(this, width, height);
		this.image = game.assets["images/icon1.png"];
		this.color = this.getRandomColor();
		this.frame = this.getFrame();
		this.row  = 0;
		this.line = 0;
		this.matched = false;
		this.comboChecked = false;
	}
	, getRandomColor: function() {
		var max  = game.DROP_COLOR_SIZE;
		var list = game.DROP_COLOR_ASSOSIATE;
		var rand = Math.floor(Math.random() * max);
		var color = list[rand];
		if (color) {
			return color;
		}
		return false;
	}
	, getColor: function() {
		if (this.color) {
			return this.color;
		}
		return false;
	}
	, getFrame: function() {
		var list = game.DROP_COLOR_FRAME;
		var color = this.getColor();
		var frame = list[color];
		if (frame) {
			return frame;
		}
		return false;
	}
	, setDrop: function(parent, row, line, color) {
		this.row = row;
		this.line = line;
		this.x = this.row * game.DROP_SIZE;
		this.y = this.line * game.DROP_SIZE;
		parent.addChild(this);
	}
	, move: function(x, y, movetype, params) {
		var frame  = 10;
		var easing = enchant.Easing.CIRC_EASEOUT;
		if (movetype=="slide")	{
			frame  = game.SLIDE_FRAME;
			easing = game.SLIDE_EASING;
		}
		else if (movetype=="exchenge")	{
			frame  = game.EXCHANGE_FRAME;
			easing = game.EXCHANGE_EASING;
		}
		this.tl.moveTo(x, y, frame, easing);
	}
});

/*
Dragger
     current
     selected
     touchStart()
     touchMove()
     touchEnd()
     exchangeFor(target)
*/
Dragger = enchant.Class.create(enchant.Entity, {
	initialize: function() {
		Entity.call(this);
		this.width  = game.STAGE_W;
		this.height = game.STAGE_H;
		this.current = null;
		this.dragging = false;
	}
	, ontouchstart: function(e){
		this.dragging = true;
		var row  = Math.floor( (e.x - this._offsetX) / game.DROP_SIZE);
		var line = Math.floor( (e.y - this._offsetY) / game.DROP_SIZE);
		this.current = game.dropManager.getDropByRowLine(row, line);
	}
	, ontouchmove: function(e){
		this.current.x = e.x - this._offsetX - (game.DROP_SIZE / 2);
		this.current.y = e.y - this._offsetY - (game.DROP_SIZE / 2);
		this.current.visible = true;
	}
	, ontouchend: function(e){
		if (this.dragging) {
			this.dragging = false;
		}
	}
});


MainScene = enchant.Class.create(enchant.Scene, {
	initialize: function() {
		enchant.Scene.call(this);
		
		// Main
		console.log("main game");
		// Stage
		game.stage = new Group(game.STAGE_W, game.STAGE_H);
		game.stage.x = 10;
		game.stage.y = 60;
		this.addChild(game.stage);
		// DropManager
		game.dropManager = new DropManager();
		game.dropManager.setDrops();
		// Dragger
		game.dragger = new Dragger();
		game.stage.addChild(game.dragger);

		/*
		this.sprite = new Sprite(50,50);
		this.sprite.image = game.assets["images/icon1.png"];
		this.addChild(this.sprite);
		this.sprite.addEventListener('touchstart', function() {
			console.log("test");
		});
		*/

		/*
		this.addEventListener('touchstart', function() {
			console.log("test");
		});
		*/
	}
});

window.onload = function() {
	game = new Game(320, 320);
	game.fps = 30;
	game.preload('images/icon0.png', 'images/icon1.png');

	define();

	game.onload = function() {
		game.mainScene = new MainScene();
		game.pushScene(game.mainScene);
	}

	if (game.DEBUG) {
		game.debug();
	} else {
		game.start()
	}
};

