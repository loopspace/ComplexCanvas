var layers = {};
var centre;
var scale;
var style = {
    axesWidth: 5,
    bgHue: 0,
    font: "sans",
    fontSize: "18px",
    stroke: 'hsl(0,0,0)',
    labelColour: 'rgb(255,255,255)',
    labelStroke: 'rgb(128,128,128)',
    point: {
	colour: 'rgb(255,128,128)',
	radius: 4,
    },
    cpoint: {
	colour: 'rgb(128,255,128)',
	radius: 4,
    },
    ctrlPoint: {
	colour: ['rgb(128,128,255)','rgb(64,64,128)','rgb(32,32,64)','rgb(16,16,32)'],
	radius: 8,
    },
    labels: true,
    guides: true,
    cartesian: true,
    border: 3,
    singleton: false,
    root: 4,
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
var currentOperation;
var calc;
var nctrls;

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
    var ctrl = document.getElementById('op');
    ctrl.onchange = function(e) {
	setOperation(this.value);
    };
    setOperation(ctrl.value);
    ctrl = document.getElementById('style');
    ctrl.onchange = function(e) {
	if (this.value == 0) {
	    style.cartesian = true;
	} else {
	    style.cartesian = false;
	}
	drawLabels();
    };
    if (ctrl.value == 1)
	style.cartesian = false;
    ctrl = document.getElementById('singleton');
    ctrl.onchange = function(e) {
	style.singleton = this.checked;
	clear(layers['points']);
	clear(layers['cpoints']);
	points = [points.pop()];
	drawPoints();
	recalcPoints();
    }
    style.singleton = ctrl.checked;
    ctrl = document.getElementById('root');
    ctrl.onchange = function(e) {
	style.root = parseInt(this.value,10);
	recalcPoints();
    }
    style.root = ctrl.value;
    ctrl = document.getElementById('slabels');
    ctrl.onchange = function(e) {
	style.labels = this.checked;
	drawLabels();
    }
    style.labels = ctrl.checked;
    ctrl = document.getElementById('guides');
    ctrl.onchange = function(e) {
	style.guides = this.checked;
	drawLabels();
    }
    style.guides = ctrl.checked;
    var icons = document.querySelectorAll('#icons a');
    var s = icons[0].scrollWidth;
    for (var i = 0; i < icons.length; i++) {
	s = Math.max(s,icons[i].scrollWidth);
	s = Math.max(s,icons[i].scrollHeight);
    }
    var pd;
    for (var i = 0; i < icons.length; i++) {
	pd = (s - icons[i].scrollWidth)/2 + 3;
	icons[i].style.paddingLeft = pd + 'px';
	icons[i].style.paddingRight = pd + 'px';
	icons[i].style.paddingTop = '3px';
	icons[i].style.paddingBottom = '3px';
    }
    var micon = document.getElementById('micon');
    var menu = document.getElementById('menu');
    micon.onclick = function(e) {
	e.preventDefault();
	if (menu.style.display == 'none') {
	    menu.style.display = '';
	} else {
	    menu.style.display = 'none';
	}
	return false;
    }
    Complex.setPrecision(1);
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
    ctx.font = style.fontSize + ' ' + style.font;
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
    ctx.fillStyle = style.point.colour;
    var r = style.point.radius;
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
    ctx.fillStyle = style.cpoint.colour;
    var r = style.cpoint.radius;
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
    if (style.singleton) {
	cpoints = calc(points[points.length-1]);
    } else {
	points.forEach(function(z) {
	    calc(z).forEach(function(w) {
		cpoints.push(w);
	    });
	});
    }
    drawCalcPoints();
    drawLabels();
}

function drawPoint(z,v) {
    var ctx = layers['points'];
    if (style.singleton)
	clear(ctx);
    var s = scale;
    var w = ctx.canvas.width;
    var h = ctx.canvas.height;
    var ox = s * centre.x + w/2;
    var oy = s * centre.y + h/2;
    ctx.fillStyle = style.point.colour;
    var r = style.point.radius;
    ctx.beginPath();
    ctx.arc(s * z.x + ox, -s * z.y + oy, r, 0, 2*Math.PI);
    ctx.fill();
    if (!w)
	return;
    ctx = layers['cpoints'];
    if (style.singleton)
	clear(ctx);
    ctx.fillStyle = style.cpoint.colour;
    r = style.cpoint.radius;
    v.forEach(function(u) {
	ctx.beginPath();
	ctx.arc(s * u.x + ox, -s * u.y + oy, r, 0, 2*Math.PI);
	ctx.fill();
    });
    drawLabels();
}

function drawLabels() {
    var ctx = layers['labels'];
    var doLabel;
    if (style.cartesian) {
	doLabel = drawCartesian;
    } else {
	doLabel = drawPolar;
    }
    clear(ctx);
    ctx.font = style.fontSize + ' ' + style.font;
    ctx.fillStyle = style.labelColour;
    var s = scale;
    var w = ctx.canvas.width;
    var h = ctx.canvas.height;
    var ox = s * centre.x + w/2;
    var oy = s * centre.y + h/2;
    var z;
    if (points.length > 0) {
	z = points[points.length - 1];
	lines(ctx,z);
	doLabel(z,style.point);
    }
    if (cpoints.length > 0) {
	z = cpoints[cpoints.length - 1];
	doLabel(z,style.cpoint);
    }
    if (nctrls > 0) {
	var r = style.ctrlPoint.radius;
	for (var i = 0; i < nctrls; i++) {
	    ctx.fillStyle = style.labelColour;
	    doLabel(ctrlpts[i],style.ctrlPoint);
	    ctx.fillStyle = style.ctrlPoint.colour[i];
	    ctx.beginPath();
	    ctx.arc(s * ctrlpts[i].x + ox, -s * ctrlpts[i].y + oy, r, 0, 2*Math.PI);
	    ctx.fill();

	}
    }
}

function drawCartesian(z,st) {
    var bdr = style.border;
    var ctx = layers['labels'];
    var s = scale;
    var w = ctx.canvas.width;
    var h = ctx.canvas.height;
    var ox = s * centre.x + w/2;
    var oy = s * centre.y + h/2;
    var x = s * z.x + ox;
    var y =  -s * z.y + oy;
    if (style.guides) {
	ctx.strokeStyle = style.labelStroke;
	ctx.beginPath();
	ctx.moveTo(ox,oy);
	ctx.lineTo(x,y);
	ctx.moveTo(x,oy);
	ctx.lineTo(x,y);
	ctx.lineTo(ox,y);
	ctx.stroke();
    }
    if (!style.labels)
	return;
    var r = st.radius;
    var a;
    if (z.y < 0) {
	a = 'north ';
    } else {
	a = 'south ';
    }
    if (z.x < 0) {
	a += 'east';
    } else {
	a += 'west';
    }
    textNode(ctx,z.toStringCartesian(),style.fontSize,style.font,x,y,r,a);
    if (style.guides) {
	if (z.y < 0) {
	    a = 'south ';
	} else {
	    a = 'north ';
	}
	if (z.x < 0) {
	    a += 'east';
	} else {
	    a += 'west';
	}
	textNode(ctx,Complex.round(z.x),style.fontSize,style.font,x,oy,r,a);
	if (z.y < 0) {
	    a = 'north ';
	} else {
	    a = 'south ';
	}
	if (z.x < 0) {
	    a += 'west';
	} else {
	    a += 'east';
	}
	textNode(ctx,Complex.round(z.y),style.fontSize,style.font,ox,y,r,a);
    }
}

function drawPolar(z,st) {
    var bdr = style.border;
    var ctx = layers['labels'];
    var s = scale;
    var w = ctx.canvas.width;
    var h = ctx.canvas.height;
    var ox = s * centre.x + w/2;
    var oy = s * centre.y + h/2;
    var x = s * z.x + ox;
    var y =  -s * z.y + oy;
    if (style.guides) {
	ctx.strokeStyle = style.labelStroke;
	ctx.beginPath();
	ctx.moveTo(ox,oy);
	ctx.lineTo(x,y);
	ctx.moveTo(s*z.len()/2+ox,oy);
	if (z.arg() > 0) {
	    ctx.arc(ox,oy,s*z.len()/2,0,-z.arg(),true);
	} else {
	    ctx.arc(ox,oy,s*z.len()/2,0,-z.arg());
	}
	ctx.stroke();
    }
    if (!style.labels)
	return;
    var r = st.radius;
    var a;
    if (z.y < 0) {
	a = 'north ';
    } else {
	a = 'south ';
    }
    if (z.x < 0) {
	a += 'east';
    } else {
	a += 'west';
    }
    textNode(ctx,z.toStringPolar(),style.fontSize,style.font,x,y,r,a);
    if (style.guides) {
	if (z.y < 0) {
	    a = 'north ';
	} else {
	    a = 'south ';
	}
	if (z.x < 0) {
	    a += 'west';
	} else {
	    a += 'east';
	}
	x = s * z.x/2 + ox;
	y =  -s * z.y/2 + oy;
	textNode(ctx,Complex.round(z.len()),style.fontSize,style.font,x,y,r,a);
	if (z.arg() > 0) {
	    a = "south west";
	} else {
	    a = "north west";
	}
	x = s * z.len() * Math.cos(z.arg()/2)/2 + ox;
	y = -s * z.len() * Math.sin(z.arg()/2)/2 + oy;
	textNode(ctx,Complex.round(z.arg()),style.fontSize,style.font,x,y,r,a);
    }
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
    if (style.singleton) {
	points = [z];
	cpoints = calc(z);
    } else {
	points.push(z);
	calc(z).forEach(function(w) {
	    cpoints.push(w);
	});
    }
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
    if (nctrls > 0) {
	for (var i = 0; i < nctrls; i++) {
	    var x = s * ctrlpts[i].x + ox - coords.x;
	    var y = -s * ctrlpts[i].y + oy - coords.y;
	    if (x*x + y*y < d) {
		d = x*x + y*y;
		mvpt = i;
		b = true;
		offset = {x: x, y: y}
	    }
	}
    }
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

function setOperation(o) {
    if (o == currentOperation)
	return;
    currentOperation = o;
    calc = operations[o]['op'];
    nctrls = operations[o]['nc'];
    lines = operations[o]['ln'];
    var rsel = document.getElementById('rootsel');
    if (o == "roots") {
	rsel.style.display = 'table-row';
    } else {
	rsel.style.display = 'none';
    }
    recalcPoints();
}

operations = {
    none: {
	op: function(z) {return []},
	nc: 0,
	ln: function(ctx,z) {},
    },
    add: {
	op: function(z) {return [z.add(ctrlpts[0])]},
	nc: 1,
	ln: function(ctx,z) {
	    var s = scale;
	    var w = ctx.canvas.width;
	    var h = ctx.canvas.height;
	    var ox = s * centre.x + w/2;
	    var oy = s * centre.y + h/2;
	    var x = s * z.x + ox;
	    var y =  -s * z.y + oy;
	    var w = z.add(ctrlpts[0]);
	    var ax = s * w.x + ox;
	    var ay =  -s * w.y + oy;
	    var cx = s * ctrlpts[0].x + ox;
	    var cy =  -s * ctrlpts[0].y + oy;
	    ctx.strokeStyle = style.labelStroke;
	    ctx.beginPath();
	    ctx.moveTo(ox,oy);
	    ctx.lineTo(x,y);
	    ctx.lineTo(ax,ay);
	    ctx.lineTo(cx,cy);
	    ctx.lineTo(ox,oy);
	    ctx.stroke();
	},
    },
    sub: {
	op: function(z) {return [z.sub(ctrlpts[0])]},
	nc: 1,
	ln: function(ctx,z) {
	    var s = scale;
	    var w = ctx.canvas.width;
	    var h = ctx.canvas.height;
	    var ox = s * centre.x + w/2;
	    var oy = s * centre.y + h/2;
	    var x = s * z.x + ox;
	    var y =  -s * z.y + oy;
	    var w = z.sub(ctrlpts[0]);
	    var ax = s * w.x + ox;
	    var ay =  -s * w.y + oy;
	    var cx = s * ctrlpts[0].x + ox;
	    var cy =  -s * ctrlpts[0].y + oy;
	    ctx.strokeStyle = style.labelStroke;
	    ctx.beginPath();
	    ctx.moveTo(ox,oy);
	    ctx.lineTo(ax,ay);
	    ctx.lineTo(x,y);
	    ctx.lineTo(cx,cy);
	    ctx.lineTo(ox,oy);
	    ctx.stroke();
	},
    },
    mul: {
	op: function(z) {return [z.mul(ctrlpts[0])]},
	nc: 1,
	ln: function(ctx,z) {
	    var s = scale;
	    var w = ctx.canvas.width;
	    var h = ctx.canvas.height;
	    var ox = s * centre.x + w/2;
	    var oy = s * centre.y + h/2;
	    var x = s * z.x + ox;
	    var y =  -s * z.y + oy;
	    var w = z.mul(ctrlpts[0]);
	    var ax = s * w.x + ox;
	    var ay =  -s * w.y + oy;
	    var cx = s * ctrlpts[0].x + ox;
	    var cy =  -s * ctrlpts[0].y + oy;
	    ctx.strokeStyle = style.labelStroke;
	    ctx.beginPath();
	    ctx.moveTo(ox,oy);
	    ctx.lineTo(x,y);
	    ctx.lineTo(ox + s,oy);
	    ctx.lineTo(ox,oy);
	    ctx.moveTo(ox,oy);
	    ctx.lineTo(cx,cy);
	    ctx.lineTo(ax,ay);
	    ctx.lineTo(ox,oy);
	    ctx.stroke();
	},
    },
    div: {
	op: function(z) {return [z.div(ctrlpts[0])]},
	nc: 1,
	ln: function(ctx,z) {
	    var s = scale;
	    var w = ctx.canvas.width;
	    var h = ctx.canvas.height;
	    var ox = s * centre.x + w/2;
	    var oy = s * centre.y + h/2;
	    var x = s * z.x + ox;
	    var y =  -s * z.y + oy;
	    var w = z.div(ctrlpts[0]);
	    var ax = s * w.x + ox;
	    var ay =  -s * w.y + oy;
	    var cx = s * ctrlpts[0].x + ox;
	    var cy =  -s * ctrlpts[0].y + oy;
	    ctx.strokeStyle = style.labelStroke;
	    ctx.beginPath();
	    ctx.moveTo(ox,oy);
	    ctx.lineTo(ax,ay);
	    ctx.lineTo(ox + s,oy);
	    ctx.lineTo(ox,oy);
	    ctx.moveTo(ox,oy);
	    ctx.lineTo(cx,cy);
	    ctx.lineTo(x,y);
	    ctx.lineTo(ox,oy);
	    ctx.stroke();
	},
    },
    pow: {
	op: function(z) {return [z.pow(ctrlpts[0])]},
	nc: 1,
	ln: function(ctx,z) {},
    },
    conj: {
	op: function(z) {return [z.conj()]},
	nc: 0,
	ln: function(ctx,z) {},
    },
    roots: {
	op: function(z) {var ret = []; for (var i = 0; i < style.root; i++) {ret.unshift(z.pow(1/style.root,i))}; return ret},
	nc: 0,
	ln: function(ctx,z) {
	    var s = scale;
	    var w = ctx.canvas.width;
	    var h = ctx.canvas.height;
	    var ox = s * centre.x + w/2;
	    var oy = s * centre.y + h/2;
	    var ret = [];
	    for (var i = 0; i < style.root; i++) {
		ret.unshift(z.pow(1/style.root,i));
	    }
	    var x = s * ret[style.root - 1].x + ox;
	    var y =  -s * ret[style.root - 1].y + oy;
	    ctx.strokeStyle = style.labelStroke;
	    ctx.beginPath();
	    ctx.moveTo(x,y);
	    for (var i = 0; i < style.root; i++) {
		x = s * ret[i].x + ox;
		y =  -s * ret[i].y + oy;
		ctx.lineTo(x,y);
	    }
	    ctx.stroke();
	},
    },
    mobius: {
	op: function(z) {
	    return [z.mul(ctrlpts[0]).add(ctrlpts[1]).div(z.mul(ctrlpts[2]).add(ctrlpts[3]))];
	},
	nc: 4,
	ln: function(ctx,z) {},
    }
}

function getRelativeCoords(event) {
    if (event.offsetX !== undefined && event.offsetY !== undefined) { return { x: event.offsetX, y: event.offsetY }; }
    return { x: event.layerX, y: event.layerY };
}

var measureText = function(ctx,size,font,s) {
    ctx.save();
    ctx.font = size + ' ' + font;
    var w = ctx.measureText(s).width;
    ctx.restore();
    var r = getTextHeight(size,font,s);
    r.width = w;
    return r;
}

/*
  From: http://stackoverflow.com/a/9847841
*/

var getTextHeight = function(size,font,s) {

    var text = document.createTextNode(s);
    var span = document.createElement('span');
    var block = document.createElement('div');
    var div = document.createElement('div');
    span.appendChild(text);
    div.appendChild(span);
    div.appendChild(block);
    var body = document.querySelector('body');
    body.appendChild(div);

    span.style.fontFamily = font;
    span.style.fontSize = size;
    block.style.display = 'inline-block';
    block.style.width = '1px';
    block.style.height = '0px';

    try {

	var result = {};

	block.style.verticalAlign = 'baseline';
	result.ascent = block.offsetTop - span.offsetTop;

	block.style.verticalAlign = 'bottom';
	result.height = block.offsetTop - span.offsetTop;

	result.descent = result.height - result.ascent;

    } finally {
	div.remove();
    }

    return result;
};

var textNode = function(ctx,str,size,font,x,y,b,a) {
    var tm = measureText(ctx,size,font,str);
    if (a == 'south') {
	y -= tm.descent - b;
	x -= tm.width/2;
    } else if (a == 'north') {
	y += tm.ascent + b;
	x -= tm.width/2;
    } else if (a == 'north west') {
	y += tm.ascent + b;
	x += b;
    } else if (a == 'south west') {
	y -= tm.descent - b;
	x += b;
    } else if (a == 'north east') {
	y += tm.ascent + b;
	x -= tm.width - b;
    } else if (a == 'south east') {
	y -= tm.descent - b;
	x -= tm.width - b;
    } else if (a == 'base east') {
	x -= tm.width - b;
    } else if (a == 'base west') {
	x += b;
    } else if (a == 'base') {
	x -= tm.width/2 ;
    }
    ctx.fillText(str,x,y);
}
