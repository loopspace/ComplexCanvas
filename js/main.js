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
    pointColour: 'rgb(255,128,128)',
    pointRadius: 2,
    cpointColour: 'rgb(128,255,128)',
    cpointRadius: 2,
    ctrlPointColour: 'rgb(128,128,255)',
    ctrlPointRadius: 8,
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
	if (e.value == 0) {
	    style.cartesian = true;
	} else {
	    style.cartesian = true;
	}
	drawLabels();
    };
    if (ctrl.value == 1)
	style.cartesian = false;
    ctrl = document.getElementById('singleton');
    ctrl.onchange = function(e) {
	style.singleton = e.target.checked;
	recalcPoints();
    }
    style.singleton = ctrl.checked;
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
    ctx.fillStyle = style.pointColour;
    var r = style.pointRadius;
    ctx.beginPath();
    ctx.arc(s * z.x + ox, -s * z.y + oy, r, 0, 2*Math.PI);
    ctx.fill();
    if (!w)
	return;
    ctx = layers['cpoints'];
    if (style.singleton)
	clear(ctx);
    ctx.fillStyle = style.cpointColour;
    r = style.cpointRadius;
    v.forEach(function(u) {
	ctx.beginPath();
	ctx.arc(s * u.x + ox, -s * u.y + oy, r, 0, 2*Math.PI);
	ctx.fill();
    });
    drawLabels();
}

function drawLabels() {
    var ctx = layers['labels'];
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
	if (style.cartesian) {
	    drawCartesian(z);
	} else {
	    drawPolar(z);
	}
    }
    if (cpoints.length > 0) {
	z = cpoints[cpoints.length - 1];
	if (style.cartesian) {
	    drawCartesian(z);
	} else {
	    drawPolar(z);
	}
    }
    ctx.fillStyle = style.ctrlPointColour;
    var r = style.ctrlPointRadius;
    if (nctrls > 0) {
	for (var i = 0; i < nctrls; i++) {
	    ctx.beginPath();
	    ctx.arc(s * ctrlpts[i].x + ox, -s * ctrlpts[i].y + oy, r, 0, 2*Math.PI);
	    ctx.fill();
	}
	for (var i = 0; i < nctrls; i++) {
	    ctx.fillText(ctrlpts[i].toString(),s * ctrlpts[i].x + ox + r, -s * ctrlpts[i].y + oy - r);
	}	
    }
}

function drawCartesian(z) {
    var bdr = style.border;
    var ctx = layers['labels'];
    var s = scale;
    var w = ctx.canvas.width;
    var h = ctx.canvas.height;
    var ox = s * centre.x + w/2;
    var oy = s * centre.y + h/2;
    var x = s * z.x + ox;
    var y =  -s * z.y + oy;
    ctx.strokeStyle = style.labelStroke;
    ctx.beginPath();
    ctx.moveTo(ox,oy);
    ctx.lineTo(x,y);
    ctx.moveTo(x,oy);
    ctx.lineTo(x,y);
    ctx.lineTo(ox,y);
    ctx.stroke();
    var r = style.pointRadius;
    var str = z.toStringCartesian();
    var tm = measureText(ctx,style.fontSize,style.font,str);
    if (z.x < 0) {
	aw = - tm.width - r - bdr;
    } else {
	aw = r + bdr;
    }
    if (z.y < 0) {
	ah = tm.height + r + bdr;
    } else {
	ah = - r - bdr;
    }
    ctx.fillText(str,x + aw, y + ah);
    str = Complex.round(z.x);
    tm = measureText(ctx,style.fontSize,style.font,str);
    if (z.x < 0) {
	aw = - tm.width - bdr;
    } else {
	aw = bdr;
    }
    if (z.y < 0) {
	ah = -bdr;
    } else {
	ah = tm.height + bdr;
    }
    ctx.fillText(str,x + aw,oy + ah);
    str = Complex.round(z.y);
    tm = measureText(ctx,style.fontSize,style.font,str);
    if (z.x < 0) {
	aw = bdr;
    } else {
	aw = -tm.width - bdr; 
    }
    if (z.y < 0) {
	ah = tm.height + bdr;
    } else {
	ah = -bdr;
    }
    ctx.fillText(str,ox + aw,y + ah);
}

function drawPolar(z) {
    var bdr = style.border;
    var ctx = layers['labels'];
    var s = scale;
    var w = ctx.canvas.width;
    var h = ctx.canvas.height;
    var ox = s * centre.x + w/2;
    var oy = s * centre.y + h/2;
    var x = s * z.x + ox;
    var y =  -s * z.y + oy;
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
    var r = style.pointRadius;
    var str = z.toStringPolar();
    var tm = measureText(ctx,style.fontSize,style.font,str);
    if (z.x < 0) {
	aw = - tm.width - r - bdr;
    } else {
	aw = r + bdr;
    }
    if (z.y < 0) {
	ah = tm.height + r + bdr;
    } else {
	ah = - r - bdr;
    }
    ctx.fillText(str,x + aw, y + ah);
    str = Complex.round(z.len());
    tm = measureText(ctx,style.fontSize,style.font,str);
    if (z.x < 0) {
	aw = - tm.width - bdr;
    } else {
	aw = bdr;
    }
    if (z.y < 0) {
	ah = -bdr;
    } else {
	ah = -tm.height - bdr;
    }
    x = s * z.x/2 + ox;
    y =  -s * z.y/2 + oy;
    ctx.fillText(str,x + aw,y + ah);
    str = Complex.round(z.arg());
    tm = measureText(ctx,style.fontSize,style.font,str);
    x = s * z.len() * Math.cos(z.arg()/2)/2 + ox;
    y = -s * z.len() * Math.sin(z.arg()/2)/2 + oy;
    if (z.x < 0) {
	aw = bdr;
    } else {
	aw = -tm.width - bdr; 
    }
    if (z.y < 0) {
	ah = tm.height + bdr;
    } else {
	ah = -bdr;
    }
    ctx.fillText(str,x + aw,y + ah);
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
    if (style.singleton) {
	cpoints = calc(z);
    } else {
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
    calc = operations[currentOperation]['op'];
    nctrls = operations[currentOperation]['nc'];
    recalcPoints();
}

operations = {
    none: {
	op: function(z) {return []},
	nc: 0,
    },
    add: {
	op: function(z) {return [z.add(ctrlpts[0])]},
	nc: 1,
    },
    sub: {
	op: function(z) {return [z.sub(ctrlpts[0])]},
	nc: 1,
    },
    mul: {
	op: function(z) {return [z.mul(ctrlpts[0])]},
	nc: 1,
    },
    div: {
	op: function(z) {return [z.div(ctrlpts[0])]},
	nc: 1,
    },
    pow: {
	op: function(z) {return [z.pow(ctrlpts[0])]},
	nc: 1,
    },
    conj: {
	op: function(z) {return [z.conj()]},
	nc: 0,
    },
    roots: {
	op: function(z) {var ret = []; for (var i = 0; i < style.root; i++) {ret.unshift(z.pow(1/style.root,i))}; return ret},
	nc: 0,
    },
    mobius: {
	op: function(z) {
	    return [z.mul(ctrlpts[0]).add(ctrlpts[1]).div(z.mul(ctrlpts[2]).add(ctrlpts[3]))];
	},
	nc: 4,
    }
}

function getRelativeCoords(event) {
    if (event.offsetX !== undefined && event.offsetY !== undefined) { return { x: event.offsetX, y: event.offsetY }; }
    return { x: event.layerX, y: event.layerY };
}

var measureText = function(ctx,size,font,s) {
    ctx.save();
    ctx.font = font;
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

    div.style.display = 'inline-block';

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
