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
	game.DROP_COLOR_ASSOSIATE = {0:"red", 1:"green", 2:"blue", 3:"yellow", 4:"white", 5:"gray"};
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

MainScene = enchant.Class.create(enchant.Scene, {
	initialize: function() {
		enchant.Scene.call(this);
		
		// Main
		console.log("main game");

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

