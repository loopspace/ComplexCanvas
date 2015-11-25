var __error = function(msg) {
    console.log(msg);
}

var precision = 2;
var symbol = 'i';
var angle = 1;
var angsym = 'π';

function Complex(x,y) {
    this.x = 0;
    this.y = 0;
    
    if (x instanceof Complex) {
	this.x = x.x;
	this.y = x.y;
    } else if (typeof(x) === 'number' && typeof(y) === 'number') {
	this.x = x;
	this.y = y;
    } else if (typeof(x) === 'array') {
	this.x = x[0];
	this.y = x[1];
    } else if (typeof(x) === 'object') {
	if (x.x && x.y && typeof(x.x) === 'number' && typeof(x.y) === 'number') {
	    this.x = x.x;
	    this.y = x.y;
	}
    }

    return this;
}

/*
  Complex numbers are immutable
*/

Complex.prototype.clone = function() {
    return new Complex(this);
}

Complex.prototype.add = function(z) {
    if (z instanceof Complex) {
	return new Complex(this.x + z.x, this.y + z.y);
    } else if (typeof(z) === 'number') {
	return new Complex(this.x + z, this.y);
    } else {
	__error("Can't add " + typeof(this) + " to " + typeof(z));
	return false;
    }
}

Complex.prototype.sub = function(z) {
    if (z instanceof Complex) {
	return new Complex(this.x - z.x, this.y - z.y);
    } else if (typeof(z) === 'number') {
	return new Complex(this.x - z, this.y);
    } else {
	__error("Can't subtract " + typeof(this) + " from " + typeof(z));
	return false;
    }
}

Complex.prototype.mul = function(z) {
    if (z instanceof Complex) {
	return new Complex( this.x * z.x - this.y * z.y, this.x * z.y + this.y * z.x);
    } else if (typeof(z) === 'number') {
	return new Complex(this.x * z, this.y * z);
    } else {
	__error("Can't multipy " + typeof(this) + " by " + typeof(z));
	return false;
    }
}

Complex.prototype.div = function(z) {
    if (z instanceof Complex) {
	var l = z.lenSqr();
	if (l === 0) {
	    __error("Can't divide by zero");
	    return false;
	} else {
	    return new Complex( (this.x * z.x + this.y * z.y)/l, (-this.x * z.y + this.y * z.y)/l);
	}
    } else if (typeof(z) === 'number') {
	if (z === 0) {
	    __error("Can't divide by zero");
	    return false;
	} else {
	    return new Complex (this.x/l,this.y/l);
	}
    }
}

Complex.prototype.is_real = function() {
    return this.y === 0;
}

Complex.prototype.is_imaginary = function() {
    return this.x === 0;
}

Complex.prototype.is_zero = function() {
    return this.x === 0 && this.y === 0;
}

Complex.prototype.normalise = function() {
    var l = this.len();
    if (l === 0) {
	__error("Can't normalise zero");
	return false;
    } else {
	return new Complex (this.x/l, this.y/l);
    }
}

Complex.prototype.len = function() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
}

Complex.prototype.lenSqr = function() {
    return this.x * this.x + this.y * this.y;
}

Complex.prototype.dist = function(z) {
    var x = this.x - z.x;
    var y = this.y - z.y;
    return Math.sqrt(x * x + y * y);
}

Complex.prototype.distSqr = function(z) {
    var x = this.x - z.x;
    var y = this.y - z.y;
    return x * x + y * y;
}

Complex.prototype.conjugate = function() {
    return new Complex(this.x,-this.y);
}

Complex.prototype.arg = function() {
    return Math.atan2(this.y,this.x);
}

Complex.prototype.pow = function(z,k) {
    var r,t;
    r = this.len();
    t = this.arg();
    if (!k)
	k = 0;
    if (typeof(z) === 'number') {
	r = Math.pow(r,z);
	t = (t + 2*k*Math.PI) * z;
	return new Complex(r * Math.cos(t), r * Math.sin(t));
    } else if (z instanceof Complex) {
	// Check this, should we add 2pi k to t in the nr formula?
	var nr,nt;
	nr = Math.pow(r,z.x) * Math.exp(-z.y*t);
	nt = (t + 2 * k * Math.PI)* z.x + Math.log(r)*z.y;
	return new Complex(nr * Math.cos(nt), nr * Math.sin(nt));
    }
}

Complex.prototype.real = function() {
    return this.x;
}

Complex.prototype.imaginary = function() {
    return this.y;
}

Complex.prototype.toStringCartesian = function() {
    var s,x,y;
    var p = Math.pow(10,precision);
    x = Math.floor(this.x * p + .5)/p;
    y = Math.floor(this.y * p + .5)/p;
    if (x !== 0)
	s = x;
    if (y !== 0) {
	if (s) {
	    if (y > 0) {
		if (y == 1) {
		    s += ' + ' + symbol;
		} else {
		    s += ' + ' + y + symbol;
		}
	    } else {
		if (y == -1) {
		    s += ' - ' + symbol;
		} else {
		    s += ' - ' + (-y) + symbol;
		}
	    }
	} else {
	    if (y == 1) {
		s = symbol;
	    } else if (y == -1) {
		s =  '-'  + symbol;
	    } else {
		s = y + symbol;
	    }
	}
    }
    if (!s)
	s = "0";
    return s;
}

Complex.prototype.toStringPolar = function() {
    var t,r;
    var p = Math.pow(10,precision);
    t = Math.floor(angle * this.arg() * p/Math.PI + .5)/p;
    r = Math.floor(this.len() * p + .5)/p;
    return '(' + r + ',' + t + angsym + ')';
}

Complex.prototype.toString = Complex.prototype.toStringCartesian;


function testComplex() {
    var log = function(z) {
	console.log(z.toString());
    }
    var z = new Complex(2,-3);
    var w = new Complex(-1,2);
    log(z.add(w));
    log(z.sub(w));
    log(z.mul(w));
    log(z.div(w));
    log(z.pow(3));
    log(z.pow(w));
    log(z.len());
    log(z.arg());
    log(z.conjugate());
}

testComplex();
