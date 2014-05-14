/**
 * enchant.js ver0.8.1
 */

enchant();

define = function() {
	game.DEBUG = false;
	game.VERSION = 140514;
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

