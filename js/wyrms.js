// Main

$(function () {
	var width = 60;
	var height = 90;
	var tileSize = 6;

	var canvas = $("#canvas")[0];
	var ctx = canvas.getContext("2d");

	var grid = new Grid(ctx, width, height, tileSize);
	window.grid = grid;

	grid.draw();

	var update = function () {
		grid.update();
		grid.draw();
	}

	setInterval(update, 90);

	$(canvas).click(function (e) {
		var x = (e.offsetX / grid.tileSize) | 0;
		var y = (e.offsetY / grid.tileSize) | 0;
		var p = new Point(x, y);

		grid.createWyrm(p);
		grid.update();
		grid.draw();
	});
});

// Absolute and relative directions

var N = 0, E = 1, S = 2, W = 3;
var F = 0, R = 1, B = 2, L = 3;

function turn(a, b) {
	return (a + b) % 4;
}

// Actions

var GO_F = 0, GO_L = 1, GO_R = 2, REST = 3;

var actionDirs = [];
actionDirs[GO_F] = F;
actionDirs[GO_L] = L;
actionDirs[GO_R] = R;

var dirActions = [];
dirActions[F] = GO_F;
dirActions[L] = GO_L;
dirActions[R] = GO_R;

// Tiles

var EMPTY = 0, WALL = 1, FOOD = 2, WYRM = 3;

var tileColors = [];
tileColors[EMPTY] = "#fff";
tileColors[WALL] = "#222";
tileColors[FOOD] = "#642";

var wyrmColors = [
	"#d22",
	"#2d2",
	"#22d",

	"#d2d",
	"#dd2",
	"#2dd",

	"#711",
	"#171",
	"#117",

	"#717",
	"#771",
	"#177",
]

var wyrmColorMod = wyrmColors.length;

var tileScores = []
tileScores[EMPTY] = 0;
tileScores[WALL] = -1;
tileScores[FOOD] = 1;

function tileScore(tile) {
	return maybe(tileScores[tile], -1);
}

// Helpers

function maybe(a, b) {
	return (a == undefined || a == null) ? b : a;
}

function assert(pred, err) {
	if (!pred) {
		err = maybe(err, "Assertion failed");
		throw err;
	}
}

// Point

function Point(x, y) {
	this.x = x;
	this.y = y;
}

Point.random = function (mx, my) {
	var x = _.random(0, mx);
	var y = _.random(0, my);
	return new Point(x, y);
}

Point.prototype.copy = function (x, y) {
	var x = maybe(x, 0);
	var y = maybe(y, 0);

	return new Point(this.x + x, this.y + y);
}

Point.prototype.move = function (dir) {
	var x = 0, y = 0;

	switch (dir) {
		case N:
			y -= 1;
			break;
		case E:
			x += 1;
			break;
		case S:
			y += 1;
			break;
		case W:
			x -= 1;
			break;
	}

	return this.copy(x, y);
}

// Grid

function Grid(ctx, width, height, tileSize) {
	this.ctx = ctx;
	this.width = width;
	this.height = height;

	this.tileSize = tileSize;

	var canvas = this.ctx.canvas;
	canvas.width = this.width * this.tileSize;
	canvas.height = this.height * this.tileSize;
	canvas.style["background-color"] = tileColors[EMPTY];

	var count = width * height;
	var buffer = new ArrayBuffer(count * 1);
	this.tiles = new Uint8Array(buffer);

	for (var y = 0; y < height; y++) {
		for (var x = 0; x < width; x++) {
			var i = y * width + x;

			var isEdge = y == 0
					  || y == height - 1
					  || x == 0
					  || x == width - 1;

			if (isEdge) {
				this.tiles[i] = WALL;
			} else {
				if (_.random(0, 15) == 0) {
					this.tiles[i] = FOOD;
				}
			}
		}
	}

	this.wyrmId = WYRM;
	this.wyrms = {};

	this.ticks = -5;
}

Grid.prototype.update = function () {
	this.ticks++;

	var wyrms = _.sortBy(this.wyrms, function (wyrm) {
		var s = wyrm.size();
		return -s;
	});

	var grid = this;

	_.each(wyrms, function (wyrm) {
		wyrm.autoAct();
	});
}

Grid.prototype.draw = function () {
	var w = this.width, h = this.height;
	var s = this.tileSize;

	this.ctx.clearRect(0, 0, w * s, h * s);

	var n = 30;
	var makeWyrm = (this.ticks % n) == 0;

	for (var x = 0; x < w; x++) {
		for (var y = 0; y < h; y++) {
			var i = y * w + x;
			var tile = this.tiles[i];

			var xf = x / w;
			var yf = y / h;

			var inMiddle = 0.45 < xf
						&& xf < 0.55
						&& 0.45 < yf
						&& yf < 0.55;

			if (makeWyrm && inMiddle && tile == EMPTY) {
				var p = new Point(x, y);
				this.createWyrm(p);

				makeWyrm = false;
			}

			if (tile >= WYRM) {
				var wyrm = this.wyrms[tile];
				if (wyrm == undefined) {
					var r = _.random(0, 4) == 0;
					tile = r ? EMPTY : FOOD;
					this.tiles[i] = tile;
				}
			}

			if (tile == EMPTY || tile >= WYRM) {
				continue;
			}

			this.ctx.fillStyle = tileColors[tile];
			this.ctx.fillRect(x * s, y * s, s, s);
		}
	}

	var ctx = this.ctx;

	_.each(this.wyrms, function (wyrm) {
		wyrm.draw(ctx);
	});
}

Grid.prototype.createWyrm = function (p) {
	var id = this.wyrmId;
	this.wyrmId++;

	this.wyrms[id] = new Wyrm(this, id, p);
	this.set(p, id);
}

Grid.prototype.destroyWyrm = function (id) {
	delete this.wyrms[id];
}

Grid.prototype.inBounds = function (p) {
	var x = p.x, y = p.y;

	return x >= 0
		&& x <  this.width
		&& y >= 0
		&& y <  this.height;
}

Grid.prototype.index = function (p) {
	var k = p.y * this.width + p.x;
	return k;
}

Grid.prototype.get = function (p) {
	var i = this.index(p);
	return this.tiles[i];
}

Grid.prototype.getNeighbors = function (p, f) {
	var l = turn(f, L);
	var r = turn(f, R);

	var fp = p.move(f);
	var lp = p.move(l);
	var rp = p.move(r);

	var ns = [];
	ns[F] = this.get(fp);
	ns[L] = this.get(lp);
	ns[R] = this.get(rp);

	return ns;
}

Grid.prototype.set = function (p, tile) {
	var i = this.index(p);
	this.tiles[i] = tile;
}

Grid.prototype.empty = function (p) {
	if (grid.inBounds(pos)) {
		var tile = grid.get(pos);
		return tile == EMPTY;
	}

	return false;
}

// Wyrm

function fight(aWyrm, bWyrm) {
	if (aWyrm == undefined || bWyrm == undefined) {
		return;
	}

	var aSize = aWyrm.size();
	var bSize = bWyrm.size();
	var ratio = aSize / bSize;

	var chance = _.random(8, 12) / 10;
	var finalRatio = ratio * chance;

	var winner = aWyrm, loser = bWyrm;

	if (finalRatio < 0.5) {
		winner = bWyrm, loser = aWyrm;
	}

	loser.die();
	winner.act(GO_F);
}

function Wyrm(grid, id, pos) {
	this.grid = grid;
	this.id = id;

	this.dir = _.random(0, 3);
	this.segments = [pos];
}

Wyrm.prototype.draw = function (ctx) {
	var s = this.grid.tileSize;

	var n = this.id % wyrmColorMod;
	var color = wyrmColors[n];

	ctx.fillStyle = color;
	ctx.strokeStyle = color;
	ctx.lineWidth = s;
	ctx.lineCap = "square";

	var points = this.segments;
	var h = points[0];
	points = points.slice(1);

	if (points.length == 0) {
		ctx.fillRect(h.x * s, h.y * s, s, s);
		return;
	}

	var o = s * 0.5;

	ctx.beginPath();

	ctx.moveTo(h.x * s + o, h.y * s + o);

	_.each(points, function (p) {
		ctx.lineTo(p.x * s + o, p.y * s + o);
	});

	ctx.stroke();
}

Wyrm.prototype.size = function () {
	return this.segments.length;
}

Wyrm.prototype.head = function () {
	var s = this.segments;

	assert(s.length > 0, "Wyrm of size 0");
	return s[0];
}

Wyrm.prototype.chooseAction = function (tiles) {
	var pairs = _.map(tiles, function (tile, dir) {
		var score = tileScore(tile);
		return [dir, score];
	});

	var sortedPairs = _.sortBy(pairs, function (pair) {
		return -pair[1];
	});

	var bestPair = sortedPairs[0];

	var dir = bestPair[0];
	var action = dirActions[dir];

	return action;
}

Wyrm.prototype.autoAct = function () {
	var p = this.head();
	var tiles = this.grid.getNeighbors(p, this.dir);

	var action = this.chooseAction(tiles);
	this.act(action);
}

Wyrm.prototype.act = function (action) {
	if (action == REST) {
		return;
	}

	var relDir = actionDirs[action];
	var absDir = turn(this.dir, relDir);

	var dest = this.head().move(absDir);
	var tile = this.grid.get(dest);

	switch (tile) {
		case WALL:
		case this.id:
			this.die();
			break;
		case EMPTY:
			var poop = _.random(0, 30) == 0;
			this.move(absDir, false, poop);
			break;
		case FOOD:
			this.move(absDir, true);
			break;
		default:
			var that = grid.wyrms[tile];
			fight(this, that);
			break;
	}
}

Wyrm.prototype.die = function () {
	this.grid.destroyWyrm(this.id);
}

Wyrm.prototype.move = function (dir, grow, poop) {
	var grow = maybe(grow, false);
	var poop = maybe(poop, false);

	var dest = this.head().move(dir);

	this.grid.set(dest, this.id);
	this.segments.unshift(dest);

	if (!grow) {
		var last = this.segments.pop();

		var tile = poop ? FOOD : EMPTY;
		this.grid.set(last, tile);
	}

	this.dir = dir;
}
