var layers = {};
var centre;
var scale;
var style = {
    axesWidth: 5,
    bgHue: 0,
    font: "18px sans",
    stroke: 'hsl(0,0,0)',
    labelColour: 'rgb(255,255,255)',
    pointColour: 'rgb(255,128,128)',
    pointRadius: 2,
    cpointColour: 'rgb(128,255,128)',
    cpointRadius: 2,
    ctrlPointColour: 'rgb(128,128,255)',
    ctrlPointRadius: 8,
}
var points;
var cpoints;
var ctrlpts;
/*
  Actions:
  0: none,
  1: add point,
  2: move control point
*/
var tolerance = 64;
var mouseAction;
var mvpt;
var offset;

function init() {
    var container = document.getElementById('layers');
    container.addEventListener('mousedown',doMouseDown,false);
    container.addEventListener('mouseup',doMouseUp,false);
    container.addEventListener('mouseout',doMouseOut,false);
    container.addEventListener('mousemove',doMouseMove,false);
    var h = window.innerHeight, w = window.innerWidth;
    [
	'background',
	'points',
	'cpoints',
	'axes',
	'labels'
    ].forEach(function(v) {
	var cvs = document.getElementById(v);
	layers[v] = cvs.getContext('2d');
	cvs.width = w;
	cvs.height = h;
    });
    centre = { x: 0, y: 0};
    scale = Math.min(w,h)/4;
    points = [];
    cpoints = [];
    ctrlpts = [
	new Complex(1,0),
	new Complex(0,0),
	new Complex(0,0),
	new Complex(1,0)
    ];
    calc = operations['add'];
    drawBackground();
    drawAxes();
    drawPoints();
    drawCalcPoints();
    drawLabels();
}

window.onload = init;

function drawBackground() {
    var ctx = layers['background'];
    clear(ctx);
    var w = ctx.canvas.width, h = ctx.canvas.height;
    ctx.save();
    ctx.fillStyle = "hsl(" + style.bgHue + ",100%,25%)";
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
}

function drawAxes() {
    var ctx = layers['axes'];
    clear(ctx);
    var s = scale;
    var w = ctx.canvas.width;
    var h = ctx.canvas.height;
    var ox = s * centre.x + w/2;
    var oy = s * centre.y + h/2;
    ctx.lineWidth = style.axesWidth;
    ctx.strokeStyle = style.stroke;
    ctx.beginPath();
    ctx.moveTo(ox,h);
    ctx.lineTo(ox,0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0,oy);
    ctx.lineTo(w,oy);
    ctx.stroke();
    ctx.beginPath();
    ctx.beginPath();
    ctx.arc(ox,oy,s,0,2*Math.PI);
    ctx.stroke();
    ctx.fillStyle = style.labelColour;
    ctx.font = style.font;
    ctx.fillText("1",ox+s,oy);
    ctx.fillText("i",ox,oy-s);
}

function drawPoints() {
    var ctx = layers['points'];
    clear(ctx);
    var s = scale;
    var w = ctx.canvas.width;
    var h = ctx.canvas.height;
    var ox = s * centre.x + w/2;
    var oy = s * centre.y + h/2;
    ctx.fillStyle = style.pointColour;
    var r = style.pointRadius;
    points.forEach(function(v) {
	ctx.beginPath();
	ctx.arc(s * v.x + ox, -s * v.y + oy, r, 0, 2*Math.PI);
	ctx.fill();
    });
}

function drawCalcPoints() {
    var ctx = layers['cpoints'];
    clear(ctx);
    var s = scale;
    var w = ctx.canvas.width;
    var h = ctx.canvas.height;
    var ox = s * centre.x + w/2;
    var oy = s * centre.y + h/2;
    ctx.fillStyle = style.cpointColour;
    var r = style.cpointRadius;
    cpoints.forEach(function(v) {
	if (v) {
	    ctx.beginPath();
	    ctx.arc(s * v.x + ox, -s * v.y + oy, r, 0, 2*Math.PI);
	    ctx.fill();
	}
    });
}

function recalcPoints() {
    cpoints = [];
    points.forEach(function(z) {
	cpoints.push(calc(z));
    });
    drawCalcPoints();
    drawLabels();
}

function drawPoint(z,v) {
    var ctx = layers['points'];
    var s = scale;
    var w = ctx.canvas.width;
    var h = ctx.canvas.height;
    var ox = s * centre.x + w/2;
    var oy = s * centre.y + h/2;
    ctx.fillStyle = style.pointColour;
    var r = style.pointRadius;
    ctx.beginPath();
    ctx.arc(s * z.x + ox, -s * z.y + oy, r, 0, 2*Math.PI);
    ctx.fill();
    if (!w)
	return;
    ctx = layers['cpoints'];
    ctx.fillStyle = style.cpointColour;
    r = style.cpointRadius;
    ctx.beginPath();
    ctx.arc(s * v.x + ox, -s * v.y + oy, r, 0, 2*Math.PI);
    ctx.fill();
    drawLabels();
}

function drawLabels() {
    var ctx = layers['labels'];
    clear(ctx);
    var s = scale;
    var w = ctx.canvas.width;
    var h = ctx.canvas.height;
    var ox = s * centre.x + w/2;
    var oy = s * centre.y + h/2;
    ctx.fillStyle = style.ctrlPointColour;
    var r = style.ctrlPointRadius;
    ctrlpts.forEach(function(v) {
	if (v) {
	    ctx.beginPath();
	    ctx.arc(s * v.x + ox, -s * v.y + oy, r, 0, 2*Math.PI);
	    ctx.fill();
	}
    });
}

function clear(c) {
    if (!c)
	c = ctx;
    var w = c.canvas.width, h = c.canvas.height;
    c.save();
    c.clearRect(0, 0, w, h);
    c.restore();
}

function addPoint(e) {
    var coords = getRelativeCoords(e);
    var w = layers['points'].canvas.width, h = layers['points'].canvas.height;
    var s = scale;
    var x = (coords.x - w/2)/s;
    var y = -(coords.y - h/2)/s;
    var z = new Complex(x,y);
    points.push(z);
    cpoints.push(calc(z));
    drawPoint(z,calc(z));
}

function doMouseDown(e) {
    var coords = getRelativeCoords(e);
    var b = false;
    var w = layers['points'].canvas.width, h = layers['points'].canvas.height;
    var s = scale;
    var ox = s * centre.x + w/2;
    var oy = s * centre.y + h/2;
    var d = tolerance;
    ctrlpts.forEach(function(v,i) {
	var x = s * v.x + ox - coords.x;
	var y = -s * v.y + oy - coords.y;
	if (x*x + y*y < d) {
	    d = x*x + y*y;
	    mvpt = i;
	    b = true;
	    offset = {x: x, y: y}
	}
    });
    if (b) {
	mouseAction = 2;
    } else {
	mouseAction = 1;
	addPoint(e);
    }
}

function doMouseUp(e) {
    doMouseMove(e);
    mouseAction = 0;
}

function doMouseOut(e) {
}

function doMouseMove(e) {
    if (mouseAction == 1) {
	addPoint(e);
    } else if (mouseAction == 2) {
	var coords = getRelativeCoords(e);
	var w = layers['points'].canvas.width, h = layers['points'].canvas.height;
	var s = scale;
	var ox = s * centre.x + w/2;
	var oy = s * centre.y + h/2;
	var x = (coords.x + offset.x - ox)/s;
	var y = -(coords.y + offset.y - oy)/s;
	ctrlpts[mvpt].x = x;
	ctrlpts[mvpt].y = y;
	recalcPoints();
    }
}


function getRelativeCoords(event) {
    if (event.offsetX !== undefined && event.offsetY !== undefined) { return { x: event.offsetX, y: event.offsetY }; }
    return { x: event.layerX, y: event.layerY };
}

operations = {
    add: function(z) {return z.add(ctrlpts[0])},
    sub: function(z) {return z.sub(ctrlpts[0])},
    mul: function(z) {return z.mul(ctrlpts[0])},
    div: function(z) {return z.div(ctrlpts[0])},
    pow: function(z) {return z.pow(ctrlpts[0])},
    conj: function(z) {return z.conj()},
    mobius: function(z) {
	return z.mul(ctrlpts[0]).add(ctrlpts[1]).div(z.mul(ctrlpts[2]).add(ctrlpts[3]));
    },
}
