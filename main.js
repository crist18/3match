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
	}
	, setDrops: function() {
		var number_of_drops = game.STAGE_ROWS * game.STAGE_LINES;
		for (var i=0; i<number_of_drops; i++) {
			var drop = this.drops[i];
			var row  = Math.floor(i % game.STAGE_ROWS);
			var line = Math.floor(i / game.STAGE_ROWS);
			this.addDrop(row, line);
		}
	}
	, addDrop: function(row, line) {
		var drop = new Drop();
		drop.addTo(game.stage, row, line);
		this.drops.push(drop);
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
	, unset: function(drop) {
		for (key in this.drops) {
			if (this.drops[key] == drop) {
				this.drops.splice(key, 1);
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
		this.toucnEnabled = false;
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
	, getFrame: function() {
		var list = game.DROP_COLOR_FRAME;
		var color = this.color;
		var frame = list[color];
		if (frame) {
			return frame;
		}
		return false;
	}
	, addTo: function(parent, row, line, color) {
		this.row = row;
		this.line = line;
		this.x = this.row * game.DROP_SIZE;
		this.y = this.line * game.DROP_SIZE;
		parent.addChild(this);
	}
	, moveByRowLine: function(frame, easing) {
		if (typeof frame === 'undefined')	frame = game.EXCHANGE_FRAME;
		if (typeof easing === 'undefined')	easing = game.EXCHANGE_EASING;
		var tx = this.row * game.DROP_SIZE;
		var ty = this.line * game.DROP_SIZE;
		this.tl.moveTo(tx, ty, frame, easing);
	}
});

Dragger = enchant.Class.create(enchant.Entity, {
	initialize: function() {
		Entity.call(this);
		this.width  = game.STAGE_W;
		this.height = game.STAGE_H;
		this.current = null;
		this.dragging = false;
	}
	, ontouchstart: function(e) {
		this.dragging = true;
		var row  = Math.floor( (e.x - this._offsetX) / game.DROP_SIZE);
		var line = Math.floor( (e.y - this._offsetY) / game.DROP_SIZE);
		this.current = game.dropManager.getDropByRowLine(row, line);
	}
	, ontouchmove: function(e) {
		if (this.current) {
			// drag
			this.current.x = e.x - this._offsetX - (game.DROP_SIZE / 2);
			this.current.y = e.y - this._offsetY - (game.DROP_SIZE / 2);
			// exchange 
			var row  = Math.floor( (e.x - this._offsetX) / game.DROP_SIZE);
			var line = Math.floor( (e.y - this._offsetY) / game.DROP_SIZE);
			var target = game.dropManager.getDropByRowLine(row, line);
			if (typeof target !== 'undefined' && this.current != target) {
				this.exchangeFor(target);
			}
		}
	}
    , exchangeFor: function(target) {
		var r = this.current.row;
		var l = this.current.line;
		this.current.row = target.row;
		this.current.line = target.line;
		target.row = r;
		target.line = l;
		target.moveByRowLine();
	}
	, ontouchend: function(e){
		if (this.dragging) {
			this.dragging = false;
			if (this.current) {
				this.current.moveByRowLine();
			}
			// 3 Match Puzzle Logic
			game.puzzle.matchCheck();
		}
	}
});

Puzzle = enchant.Class.create({
	initialize: function() {
		this.combos = new Array();
		this.last_combo = 0;
		this.last_erased = 0;
		this._dropFields = new Array(game.STAGE_LINES);
		for (var i=0; i<this._dropFields.length; i++) {
			this._dropFields[i] = new Array(game.STAGE_ROWS);
		}
	}
    , dropFields: {
		get: function() {
			var f = new Array();	
			for (var i=0; i<game.STAGE_LINES; i++) {
				for (var j=0; j<game.STAGE_ROWS; j++) {
					var drop = game.dropManager.getDropByRowLine(j, i);
					if (drop) {
						this._dropFields[i][j] = drop.color;
					}
				}
			}
			return this._dropFields;
		}
	}
	/* 3match puzzle chain logic */
    , matchCheck: function() {
		this.put2dMatrix( this.dropFields );
		this.judge();
		this.countCombo();
		if (this.combos.length != this.last_combo) {
			this.last_combo = this.combos.length;
			this.last_erased = game.mainScene.age;
			game.mainScene.tl.cue({
			   1  : function(){ game.puzzle.erase() },
			   30 : function(){ game.puzzle.fillup() },
			   31 : function(){ game.puzzle.matchCheck() },
			});
		}
	}
    , judge: function() {
		var f = this.dropFields;
		for (var i=0; i<game.STAGE_LINES; i++) {
			for (var j=0; j<game.STAGE_ROWS; j++) {
				var v = this.verticalJudge(j, i);
				var h = this.horizontalJudge(j, i);
				if (v || h) {
					var drop = game.dropManager.getDropByRowLine(j, i);
					if (drop) {
						drop.matched = true;
					}
				}
			}
		}
	}
    , verticalJudge: function(row, line) {
		var f     = this.dropFields;
		var color = f[line][row];
		var arr   = new Array();
		for (var i=0; i<game.STAGE_LINES; i++) {
			arr[i] = f[i][row];
		}
		var cnt = this.countChain(arr, line, game.STAGE_LINES);
		if (cnt >= game.MATCH_THRESHOLD) {
			return true;
		}
		return false;
	}
    , horizontalJudge: function(row, line) {
		var f     = this.dropFields;
		var arr   = f[line];
		var cnt = this.countChain(arr, row, game.STAGE_ROWS);
		if (cnt >= game.MATCH_THRESHOLD) {
			return true;
		}
		return false;
	}
    , countChain: function(arr, index, max) {
		var cnt = 0;
		var color = arr[index];
		for (var i=index; i>=0; i--) {
			if (arr[i] == color )	cnt++;
			else					break;
		}
		for (var i=index+1; i<max; i++) {
			if (arr[i] == color )	cnt++;
			else					break;
		}
		return cnt;
	}
	/* 3match puzzle combo logic */
	, countCombo: function() {
		for (var i=0; i<game.STAGE_LINES; i++) {
			for (var j=0; j<game.STAGE_ROWS; j++) {
				var drop = game.dropManager.getDropByRowLine(j, i);
				if (drop && drop.matched) {
					var combo = this.searchCombo(drop);
					if (combo) {
						this.combos.push(combo);
					}
				}
			}
		}
	}
	, searchCombo: function(drop, combo, depth) {
		if (drop.comboChecked) {
			return false;
		} 

		if (typeof combo === 'undefined' && typeof depth === 'undefined') {
			combo = new Combo(drop.color);
			depth = 0;
		}
		depth++;

		if (drop.matched == true && drop.color == combo.color) {
			combo.children.push(drop);
			drop.comboChecked = true;
			var row  = drop.row;
			var line = drop.line;
			var r = game.dropManager.getDropByRowLine(row+1, line);
			var l = game.dropManager.getDropByRowLine(row-1, line);
			var d = game.dropManager.getDropByRowLine(row, line+1);
			var u = game.dropManager.getDropByRowLine(row, line-1);
			if (r)	this.searchCombo(r, combo, depth);
			if (l)	this.searchCombo(l, combo, depth);
			if (d)	this.searchCombo(d, combo, depth);
			if (u)	this.searchCombo(u, combo, depth);
			if (depth == 1) {
				return combo;
			}
		}
		return false;
	}
	/* 3match puzzle UI */
	, erase: function() {
		for (var i=0; i<this.combos.length; i++) {
			var combo = this.combos[i];
			combo.erase();
			console.log("combo " + i);
		}
	}
	, fillup: function() {
		for (var i=0; i<game.STAGE_LINES; i++) {
			for (var j=0; j<game.STAGE_ROWS; j++) {
				var search = game.dropManager.getDropByRowLine(j, i);
				if (typeof search === 'undefined') {
					game.dropManager.addDrop(j, i);
				}
			}
		}
	}
	/* console.log for 2d Array */
	, put2dMatrix : function(list) {
		var str = "";
		for (var i=0; i<list.length; i++) {
			for (var j=0; j<list[i].length; j++) {
				var text = list[i][j];
				while (text.length < 8) {
					text = text + " ";
				}
				str += text + ",";
			}
			str += "\n";
		}
		console.log(str);
	}
});

Combo = enchant.Class.create({
	initialize: function(color) {
		this.color = color;
		this.children = new Array();
		this.erased = false;
	}
	, erase: function() {
		if (this.erased) {
			return false;
		}
		for (var i=0; i<this.children.length; i++) {
			var drop = this.children[i];
			drop.tl.clear();
			drop.moveByRowLine(1);
			drop.tl.cue({
			   2 : function(){ this.tl.fadeOut(20) },
			   10: function(){ this.tl.removeFromScene() },
			   11: function(){ game.dropManager.unset(this) },
			});
			this.erased = true;
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

		this.tl.cue({
			1: function() {
				// DropManager
				game.dropManager = new DropManager();
				game.dropManager.setDrops();
				// Dragger
				game.dragger = new Dragger();
				game.dragger.x = game.stage.x;
				game.dragger.y = game.stage.y;
				this.addChild(game.dragger);
				// Puzzle
				game.puzzle = new Puzzle();
			}
		});
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
